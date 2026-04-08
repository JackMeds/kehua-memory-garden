import { memo, useCallback } from 'react';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function formatTime(isoDate) {
  const d = new Date(isoDate);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}年${pad(d.getMonth()+1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PostCard = memo(function PostCard({ post, index, resolveUrl, onMediaClick, allMedia }) {
  const handleImageClick = useCallback((relativePath) => {
    const idx = allMedia.findIndex(m => m.relativePath === relativePath && m.type === 'image');
    if (idx >= 0) onMediaClick(idx);
  }, [allMedia, onMediaClick]);

  const handleVideoClick = useCallback((relativePath) => {
    const idx = allMedia.findIndex(m => m.relativePath === relativePath && m.type === 'video');
    if (idx >= 0) onMediaClick(idx);
  }, [allMedia, onMediaClick]);

  const imgCount = Math.min(post.images.length, 9);

  return (
    <div className="post-card" data-post-index={index}>
      <div className="post-date">
        <span className="post-date-dot" />
        {formatTime(post.date)}
      </div>

      {post.content.trim() && (
        <div
          className="post-text"
          dangerouslySetInnerHTML={{ __html: linkify(escapeHtml(post.content)) }}
        />
      )}

      {post.images.length > 0 && (
        <div className={`post-images grid-${imgCount}`}>
          {post.images.slice(0, 9).map((img, i) => {
            const url = resolveUrl(img.relativePath);
            return (
              <div className="post-img-wrapper" key={i} onClick={() => handleImageClick(img.relativePath)}>
                {url ? (
                  <img
                    src={url}
                    alt={img.filename}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="img-placeholder">📷</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {post.videos.length > 0 && (
        <div className="post-videos">
          {post.videos.map((vid, i) => {
            const url = resolveUrl(vid.relativePath);
            return (
              <div className="post-video-wrapper" key={i}>
                {url ? (
                  <video
                    src={url}
                    controls
                    preload="metadata"
                    playsInline
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="video-placeholder" onClick={() => handleVideoClick(vid.relativePath)}>
                    🎬 {vid.filename}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default PostCard;
