import { useEffect, useCallback } from 'react';

export default function Lightbox({ items, currentIndex, resolveUrl, onClose, onNavigate }) {
  const item = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1);
  }, [hasPrev, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1);
  }, [hasNext, currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  if (!item) return null;

  const url = resolveUrl(item.relativePath);

  return (
    <div className="lightbox visible" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button className="lightbox-close" onClick={onClose} aria-label="关闭">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="lightbox-content">
        {item.type === 'image' ? (
          url ? <img src={url} alt="" /> : <div className="lightbox-placeholder">📷 图片未加载</div>
        ) : (
          url ? (
            <video
              src={url}
              controls
              autoPlay
              playsInline
              style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px' }}
            />
          ) : (
            <div className="lightbox-placeholder">🎬 视频未加载</div>
          )
        )}
      </div>

      {hasPrev && (
        <button className="lightbox-nav lightbox-prev" onClick={goPrev} aria-label="上一张">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {hasNext && (
        <button className="lightbox-nav lightbox-next" onClick={goNext} aria-label="下一张">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
