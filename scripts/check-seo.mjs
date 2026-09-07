import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const origin = 'https://kehua.jackmeds.top';
const pages = new Map([
  ['/', 'index.html'],
  ['/guide/', 'public/guide/index.html'],
  ['/guide/import-folder.html', 'public/guide/import-folder.html'],
  ['/guide/import-zip.html', 'public/guide/import-zip.html'],
  ['/guide/local-privacy.html', 'public/guide/local-privacy.html'],
  ['/about/', 'public/about/index.html'],
  ['/privacy/', 'public/privacy/index.html'],
]);

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const extract = (html, pattern) => html.match(pattern)?.[1];

const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
check(sitemapUrls.length === pages.size, `sitemap 应有 ${pages.size} 个 URL，实际为 ${sitemapUrls.length}`);
check((sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length === pages.size, '每个 sitemap URL 都必须包含 lastmod');

for (const [pathname, relativeFile] of pages) {
  const absoluteFile = join(root, relativeFile);
  const url = `${origin}${pathname}`;
  check(existsSync(absoluteFile), `${pathname} 对应页面不存在：${relativeFile}`);
  check(sitemapUrls.filter((item) => item === url).length === 1, `${url} 必须在 sitemap 中恰好出现一次`);
  if (!existsSync(absoluteFile)) continue;

  const html = readFileSync(absoluteFile, 'utf8');
  check(extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) === url, `${relativeFile} canonical 不是自指 URL`);
  check(extract(html, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i) === url, `${relativeFile} og:url 不正确`);
  check(html.includes('name="description"'), `${relativeFile} 缺少 description`);
  check(html.includes('name="robots"') && !/noindex/i.test(html), `${relativeFile} 缺少可索引 robots 或含 noindex`);
  check(html.includes('property="og:image" content="https://kehua.jackmeds.top/social-preview.png"'), `${relativeFile} 缺少绝对 OG 图片`);
  check(html.includes('name="twitter:card" content="summary_large_image"'), `${relativeFile} Twitter Card 类型不正确`);
  check(html.includes('name="twitter:image" content="https://kehua.jackmeds.top/social-preview.png"'), `${relativeFile} 缺少 Twitter 图片`);
  check(html.includes('static.cloudflareinsights.com/beacon.min.js'), `${relativeFile} 缺少 Cloudflare Web Analytics`);
  check(!html.includes('__CF_BEACON_TOKEN__'), `${relativeFile} 残留 Analytics 占位 token`);
  check(!html.includes('jackmeds.github.io/kehua-memory-garden'), `${relativeFile} 残留旧 github.io 正式 URL`);

  const jsonBlocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  check(jsonBlocks.length > 0, `${relativeFile} 缺少 JSON-LD`);
  for (const block of jsonBlocks) {
    try { JSON.parse(block[1]); } catch (error) { failures.push(`${relativeFile} JSON-LD 无法解析：${error.message}`); }
  }
}

const pngPath = join(root, 'public/social-preview.png');
check(existsSync(pngPath), '缺少 social-preview.png');
if (existsSync(pngPath)) {
  const png = readFileSync(pngPath);
  check(png.subarray(1, 4).toString() === 'PNG', 'social-preview.png 不是有效 PNG');
  check(png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, 'social-preview.png 必须为 1200×630');
}

const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
check(robots.includes('User-agent: OAI-SearchBot'), 'robots.txt 缺少 OAI-SearchBot');
check(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt sitemap 地址不正确');
check(readFileSync(join(root, 'public/CNAME'), 'utf8').trim() === 'kehua.jackmeds.top', 'CNAME 内容不正确');
check(existsSync(join(root, 'public/llms.txt')) && existsSync(join(root, 'public/agents.md')), '缺少 AI 发现文件');

if (failures.length) {
  console.error(`SEO 校验失败（${failures.length} 项）：\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`SEO 校验通过：${pages.size} 个正式页面、sitemap、JSON-LD、社交图片及抓取规则均有效。`);
