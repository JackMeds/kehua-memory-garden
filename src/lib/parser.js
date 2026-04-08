/* ═══════════════════════════════════════════════════════════
   parser.js — 可话 txt 文件解析器（纯前端版）
   ═══════════════════════════════════════════════════════════ */

const DATE_REGEX = /^(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}):(\d{2}):(\d{2})$/;

/**
 * Parse a single year's txt content into Post objects.
 * @param {string} txtContent - Raw text from "XXXX年-动态内容.txt"
 * @param {string} yearDirName - e.g. "2025年"
 * @returns {Array<Post>}
 */
export function parseTxtContent(txtContent, yearDirName) {
  const blocks = txtContent.split(/\n{2,}/);
  const posts = [];
  let currentPost = null;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    const firstLine = lines[0].trim();
    const dateMatch = firstLine.match(DATE_REGEX);

    if (dateMatch) {
      if (currentPost) posts.push(currentPost);

      const [, y, m, d, hh, mm, ss] = dateMatch;
      const monthNum = parseInt(m, 10);

      currentPost = {
        id: `${y}${m}${d}-${hh}${mm}${ss}`,
        date: `${y}-${m}-${d}T${hh}:${mm}:${ss}`,
        content: '',
        images: [],
        videos: [],
        year: y,
        monthNum,
      };

      processContentLines(lines.slice(1), currentPost, yearDirName);
    } else if (currentPost) {
      processContentLines(lines, currentPost, yearDirName);
    }
  }

  if (currentPost) posts.push(currentPost);
  return posts;
}

function processContentLines(lines, post, yearDirName) {
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const imgMatch = trimmedLine.match(/\[图片[：:](.+?)\]/);
    const vidMatch = trimmedLine.match(/\[视频[：:](.+?)\]/);

    if (imgMatch) {
      const filename = imgMatch[1];
      post.images.push({
        filename,
        relativePath: `我的动态/${yearDirName}/图片&视频/${post.monthNum}月/${filename}`,
      });
    } else if (vidMatch) {
      const filename = vidMatch[1];
      post.videos.push({
        filename,
        relativePath: `我的动态/${yearDirName}/图片&视频/${post.monthNum}月/${filename}`,
      });
    } else {
      post.content += (post.content ? '\n' : '') + trimmedLine;
    }
  }
}

/**
 * Build a year/month index from a sorted posts array.
 * Enables O(1) lookup for sidebar navigation.
 */
export function buildYearMonthIndex(posts) {
  const index = {};
  posts.forEach((post, i) => {
    const d = new Date(post.date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (!index[y]) {
      index[y] = { months: new Set(), firstIndex: i, monthFirst: {} };
    }
    index[y].months.add(m);
    if (index[y].monthFirst[m] === undefined) {
      index[y].monthFirst[m] = i;
    }
  });
  // Convert month sets to sorted arrays (descending, newest month first)
  for (const y of Object.keys(index)) {
    index[y].months = [...index[y].months].sort((a, b) => b - a);
  }
  return index;
}

/**
 * Collect all media items from posts for lightbox navigation.
 */
export function collectAllMedia(posts) {
  const media = [];
  posts.forEach(post => {
    post.images.forEach(img => media.push({ type: 'image', ...img, date: post.date }));
    post.videos.forEach(vid => media.push({ type: 'video', ...vid, date: post.date }));
  });
  return media;
}

/**
 * Compute summary stats from posts.
 */
export function computeStats(posts) {
  let totalImages = 0;
  let totalVideos = 0;
  posts.forEach(p => {
    totalImages += p.images.length;
    totalVideos += p.videos.length;
  });
  return { totalPosts: posts.length, totalImages, totalVideos };
}
