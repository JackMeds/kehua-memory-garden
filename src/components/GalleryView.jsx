import { useMemo } from 'react';

export default function GalleryView({ posts, allMedia, resolveUrl, onMediaClick }) {
  const groups = useMemo(() => {
    const g = {};
    const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

    posts.forEach(post => {
      const d = new Date(post.date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      if (!g[key]) g[key] = { label: `${y}年 ${monthNames[d.getMonth()]}`, items: [] };

      post.images.forEach(img => g[key].items.push({ type: 'image', ...img, date: post.date }));
      post.videos.forEach(vid => g[key].items.push({ type: 'video', ...vid, date: post.date }));
    });
    return g;
  }, [posts]);

  const sortedKeys = useMemo(() => Object.keys(groups).sort((a, b) => b.localeCompare(a)), [groups]);

  if (sortedKeys.length === 0 || sortedKeys.every(k => groups[k].items.length === 0)) {
    return (
      <div className="no-posts">
        <div className="no-posts-icon">🖼️</div>
        <p>没有图片或视频</p>
      </div>
    );
  }

  return (
    <div className="posts-container">
      {sortedKeys.map(key => {
        const group = groups[key];
        if (group.items.length === 0) return null;
        return (
          <div className="gallery-section" key={key} id={`gallery-${key}`}>
            <div className="gallery-section-header">{group.label}</div>
            <div className="gallery-grid">
              {group.items.map((item, idx) => {
                const url = resolveUrl(item.relativePath);
                const globalIdx = allMedia.findIndex(m => m.relativePath === item.relativePath);
                const d = new Date(item.date);

                return (
                  <div
                    className={`gallery-cell${item.type === 'video' ? ' gallery-cell-video' : ''}`}
                    key={`${key}-${idx}`}
                    onClick={() => globalIdx >= 0 && onMediaClick(globalIdx)}
                  >
                    {item.type === 'image' ? (
                      url ? (
                        <img src={url} loading="lazy" alt="" onError={(e) => { e.target.parentElement.classList.add('gallery-cell-error'); e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="img-placeholder">📷</div>
                      )
                    ) : (
                      <>
                        {url ? (
                          <video src={url} preload="metadata" muted />
                        ) : (
                          <div className="video-placeholder">🎬</div>
                        )}
                        <div className="gallery-play-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                        </div>
                      </>
                    )}
                    <div className="gallery-cell-date">{d.getMonth()+1}月{d.getDate()}日</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
