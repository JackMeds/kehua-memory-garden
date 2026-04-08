/* ═══════════════════════════════════════════════════════════
   fileReader.js — 浏览器端文件夹读取 & 媒体映射
   ═══════════════════════════════════════════════════════════ */

import { parseTxtContent } from './parser.js';
import JSZip from 'jszip';

// ── Modern API: File System Access (Chrome/Edge) ─────────

/**
 * Read a directory handle from showDirectoryPicker().
 * Returns { username, posts, blobUrls, avatar }.
 */
export async function readDirectoryHandle(dirHandle, onProgress) {
  let exportHandle = dirHandle;
  let username = dirHandle.name;

  // Check if this IS the export folder or contains it
  const match = dirHandle.name.match(/可话-个人动态-(.+)/);
  if (match) {
    username = match[1];
  } else {
    // Look for export subfolder
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'directory') {
        const m = name.match(/可话-个人动态-(.+)/);
        if (m) {
          exportHandle = handle;
          username = m[1];
          break;
        }
      }
    }
  }

  onProgress?.('正在读取动态目录…');

  // Navigate to 我的动态
  const postsDir = await navigateTo(exportHandle, '我的动态');
  if (!postsDir) throw new Error('未找到"我的动态"目录，请确认选择了正确的可话导出文件夹');

  const posts = [];
  const blobUrls = new Map();
  let yearCount = 0;

  for await (const [yearDirName, yearHandle] of postsDir.entries()) {
    if (yearHandle.kind !== 'directory') continue;
    if (!yearDirName.includes('年')) continue;
    yearCount++;

    onProgress?.(`正在解析 ${yearDirName} 的动态…`);

    // Read txt file
    const txtName = `${yearDirName}-动态内容.txt`;
    try {
      const txtHandle = await yearHandle.getFileHandle(txtName);
      const txtFile = await txtHandle.getFile();
      const txtContent = await txtFile.text();
      const yearPosts = parseTxtContent(txtContent, yearDirName);
      posts.push(...yearPosts);
    } catch {
      // txt file not found for this year, skip
    }

    // Read media files
    onProgress?.(`正在索引 ${yearDirName} 的图片与视频…`);
    try {
      const mediaDir = await navigateTo(yearHandle, '图片&视频');
      if (mediaDir) {
        await readMediaRecursive(mediaDir, `我的动态/${yearDirName}/图片&视频`, blobUrls);
      }
    } catch {
      // No media dir
    }
  }

  if (posts.length === 0 && yearCount === 0) {
    throw new Error('未找到任何年份数据，请确认文件夹结构正确');
  }

  // Sort descending by date
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Read logos
  let avatar = null;
  let kehuaLogo = null;
  try {
    const logoDir = await navigateTo(exportHandle, '可话 logo');
    if (logoDir) {
      for await (const [name, handle] of logoDir.entries()) {
        if (handle.kind === 'file' && name.endsWith('.png')) {
          const file = await handle.getFile();
          const url = URL.createObjectURL(file);
          if (name.includes('符号') && name.includes('透明底')) {
            kehuaLogo = url;  // Best for sidebar
          } else if (name.includes('logo') && !avatar) {
            avatar = url;
          }
        }
      }
    }
  } catch { /* no logo */ }
  // Fallback: use best available
  if (!kehuaLogo) kehuaLogo = avatar;
  if (!avatar) avatar = kehuaLogo;

  onProgress?.(`解析完成！共 ${posts.length} 条动态`);
  return { username, posts, blobUrls, avatar, kehuaLogo };
}

async function navigateTo(dirHandle, pathStr) {
  const parts = pathStr.split('/');
  let current = dirHandle;
  for (const part of parts) {
    try {
      current = await current.getDirectoryHandle(part);
    } catch {
      return null;
    }
  }
  return current;
}

async function readMediaRecursive(dirHandle, basePath, blobUrls) {
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file') {
      const file = await handle.getFile();
      blobUrls.set(`${basePath}/${name}`, URL.createObjectURL(file));
    } else if (handle.kind === 'directory') {
      await readMediaRecursive(handle, `${basePath}/${name}`, blobUrls);
    }
  }
}

// ── Fallback: <input webkitdirectory> (Firefox/Safari) ───

/**
 * Read files from a traditional file input with webkitdirectory.
 * Returns { username, posts, blobUrls, avatar }.
 */
export async function readFilesFromInput(fileList, onProgress) {
  const files = Array.from(fileList);
  if (files.length === 0) throw new Error('未选择任何文件');

  onProgress?.('正在分析文件结构…');

  // Find username from folder structure
  let username = 'User';
  for (const file of files) {
    const match = file.webkitRelativePath.match(/可话-个人动态-([^/]+)/);
    if (match) {
      username = match[1];
      break;
    }
  }

  // Find and parse txt files
  const txtFiles = files.filter(f => f.name.endsWith('-动态内容.txt'));
  const posts = [];

  for (const txtFile of txtFiles) {
    const yearMatch = txtFile.name.match(/(\d{4}年)/);
    if (!yearMatch) continue;
    onProgress?.(`正在解析 ${yearMatch[1]} 的动态…`);
    const content = await txtFile.text();
    posts.push(...parseTxtContent(content, yearMatch[1]));
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Build media blob URL map
  onProgress?.('正在索引媒体文件…');
  const blobUrls = new Map();
  for (const file of files) {
    const rp = file.webkitRelativePath;
    // Extract the path starting from 我的动态/
    const match = rp.match(/(我的动态\/.+)/);
    if (match) {
      blobUrls.set(match[1], URL.createObjectURL(file));
    }
  }

  // Find logos
  let avatar = null;
  let kehuaLogo = null;
  for (const file of files) {
    if (file.webkitRelativePath.includes('可话 logo') && file.name.endsWith('.png')) {
      const url = URL.createObjectURL(file);
      if (file.name.includes('符号') && file.name.includes('透明底')) {
        kehuaLogo = url;
      } else if (file.name.includes('logo') && !avatar) {
        avatar = url;
      }
    }
  }
  if (!kehuaLogo) kehuaLogo = avatar;
  if (!avatar) avatar = kehuaLogo;

  onProgress?.(`解析完成！共 ${posts.length} 条动态`);
  return { username, posts, blobUrls, avatar, kehuaLogo };
}

/**
 * Check if File System Access API is available.
 */
export function hasDirectoryPicker() {
  return typeof window.showDirectoryPicker === 'function';
}

// ── ZIP Upload (iOS Safari / all platforms) ───────────────

/**
 * Read a ZIP file containing the kehua export folder.
 * Returns { username, posts, blobUrls, avatar, kehuaLogo }.
 */
export async function readZipFile(file, onProgress) {
  onProgress?.('正在解压 ZIP 文件…');
  const zip = await JSZip.loadAsync(file);

  // Find all file paths
  const allPaths = Object.keys(zip.files).filter(p => !zip.files[p].dir);

  // Detect username from folder structure
  let username = 'User';
  let exportPrefix = '';
  for (const p of allPaths) {
    const match = p.match(/(.*?可话-个人动态-([^/]+))/);
    if (match) {
      exportPrefix = match[1];
      username = match[2];
      break;
    }
  }

  // Parse txt files
  onProgress?.('正在解析动态内容…');
  const posts = [];
  const txtFiles = allPaths.filter(p => p.endsWith('-动态内容.txt'));

  for (const txtPath of txtFiles) {
    const yearMatch = txtPath.match(/(\d{4}年)/);
    if (!yearMatch) continue;
    onProgress?.(`正在解析 ${yearMatch[1]} 的动态…`);
    const content = await zip.files[txtPath].async('string');
    posts.push(...parseTxtContent(content, yearMatch[1]));
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Build media blob URLs
  onProgress?.('正在索引媒体文件…');
  const blobUrls = new Map();
  const mediaExt = /\.(jpe?g|png|gif|webp|mp4|mov|avi|webm)$/i;
  let mediaCount = 0;

  for (const p of allPaths) {
    if (!mediaExt.test(p)) continue;
    // Extract path relative to export root: 我的动态/...
    const relMatch = p.match(/(我的动态\/.+)/);
    if (relMatch) {
      const blob = await zip.files[p].async('blob');
      blobUrls.set(relMatch[1], URL.createObjectURL(blob));
      mediaCount++;
      if (mediaCount % 50 === 0) onProgress?.(`已索引 ${mediaCount} 个媒体文件…`);
    }
  }

  // Find logos
  let avatar = null;
  let kehuaLogo = null;
  for (const p of allPaths) {
    if (p.includes('可话 logo') && p.endsWith('.png')) {
      const blob = await zip.files[p].async('blob');
      const url = URL.createObjectURL(blob);
      const name = p.split('/').pop();
      if (name.includes('符号') && name.includes('透明底')) {
        kehuaLogo = url;
      } else if (name.includes('logo') && !avatar) {
        avatar = url;
      }
    }
  }
  if (!kehuaLogo) kehuaLogo = avatar;
  if (!avatar) avatar = kehuaLogo;

  onProgress?.(`解析完成！共 ${posts.length} 条动态，${mediaCount} 个媒体`);
  return { username, posts, blobUrls, avatar, kehuaLogo };
}
