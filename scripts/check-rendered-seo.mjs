import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';

const mingxu = process.argv.includes('--mingxu');
const dist = resolve(mingxu ? 'apps/web/dist' : 'dist');
const origin = mingxu ? 'https://astrocopy.jackmeds.top' : 'https://kehua.jackmeds.top';
const report = process.env.SEO_REPORT_DIR || join(tmpdir(), mingxu ? 'mingxu-seo-render' : 'kehua-seo-render');
await mkdir(report, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const server = createServer(async (req, res) => {
  try {
    let path = resolve(dist, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(dist + '/') && path !== dist) throw new Error('Invalid path');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    res.setHeader('Content-Type', types[extname(path)] || 'text/plain');
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  // CI uses its isolated Chromium installation; local manual verification uses Edge.
  browser = await chromium.launch();
  const xml = await readFile(join(dist, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(new Set(urls).size, urls.length);
  for (const url of urls) {
    assert.equal(new URL(url).origin, origin);
    const response = await fetch(base + new URL(url).pathname);
    assert.equal(response.status, 200, url);
    const html = await response.text();
    assert.ok(html.includes('href="' + url + '"'), 'canonical missing: ' + url);
    assert.ok(!/noindex/i.test(html), url);
    for (const block of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(block[1]);
  }
  assert.equal((await fetch(base + '/definitely-missing-seo-test')).status, 404);
  const paths = mingxu ? ['/', '/zh/', '/en/', '/guide/bazi.html'] : ['/', '/guide/'];
  const results = [];
  for (const path of paths) {
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => localStorage.setItem('astrocopy-locale-v1', 'en-US'));
    const page = await context.newPage();
    const errors = [], localFailures = [], externalFailures = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => (r.url().startsWith(base) ? localFailures : externalFailures).push(r.url()));
    page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) localFailures.push(r.url() + ':' + r.status()); });
    const initial = await (await fetch(base + path)).text();
    const label = path.replace(/[^a-z0-9]/gi, '_') || 'root';
    await writeFile(join(report, label + '-initial.html'), initial);
    await page.goto(base + path);
    if (path === '/' || path === '/zh/' || path === '/en/') await page.locator('.public-overview').waitFor();
    else await page.locator('h1').waitFor();
    const audit = await page.evaluate(() => ({
      title: document.title, lang: document.documentElement.lang,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      headings: [...document.querySelectorAll('h1')].map(e => e.textContent),
      links: [...document.querySelectorAll('a[href]')].map(e => e.getAttribute('href')),
      text: document.body.innerText,
      hidden: [...document.querySelectorAll('.public-overview, #guides, #liuren, #agent-access')].filter(e => {
        for (let p = e; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return true;
        }
        return false;
      }).map(e => e.id || e.className)
    }));
    assert.equal(audit.canonical, origin + path);
    assert.ok(audit.headings.length > 0);
    assert.deepEqual(audit.hidden, [], 'Core content must be visible without scrolling');
    assert.deepEqual(errors, [], 'JavaScript errors');
    assert.deepEqual(localFailures, [], 'Local resources failed');
    if (path === '/' || path === '/zh/' || path === '/en/') {
      const before = await context.newPage();
      await before.route('**/*', route => route.request().resourceType() === 'script' ? route.abort() : route.continue());
      await before.goto(base + path);
      const paragraphs = await before.locator('#root main p').allTextContents();
      const overview = await page.locator('.public-overview').textContent();
      for (const p of paragraphs.filter(p => p.trim())) {
        assert.ok(overview.replace(/\s+/g, ' ').includes(p.replace(/\s+/g, ' ').trim()), 'Initial paragraph lost: ' + p);
      }
      await before.close();
      for (const link of mingxu ? ['/bazi/', '/ziwei/', '/liuren/', '/true-solar-time/'] : ['/guide/', '/guide/import-folder.html', '/guide/import-zip.html']) assert.ok(audit.links.includes(link), 'Missing link ' + link);
      if (mingxu) assert.equal(audit.lang, path === '/en/' ? 'en-US' : 'zh-CN');
    }
    await writeFile(join(report, label + '-rendered.html'), await page.content());
    await page.screenshot({ path: join(report, label + '-no-scroll.png') });
    results.push({ path, ...audit, errors, localFailures, externalFailures });
    if (mingxu && path === '/') {
      await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
      await page.waitForURL(base + '/en/');
      await page.waitForFunction(() => document.documentElement.lang === 'en-US');
      await page.goBack();
      await page.waitForFunction(() => location.pathname === '/' && document.documentElement.lang === 'zh-CN');
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), origin + '/');
    }
    await context.close();
  }
  await writeFile(join(report, 'report.json'), JSON.stringify(results, null, 2));
  console.log('Built sitemap URLs:', urls.length, 'Rendered pages:', paths.length, 'Evidence:', report);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
