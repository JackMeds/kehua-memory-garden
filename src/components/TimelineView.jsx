import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import PostCard from './PostCard.jsx';

const BATCH_SIZE = 40;

const TimelineView = forwardRef(function TimelineView({ posts, resolveUrl, onScrollChange, onMediaClick, allMedia }, ref) {
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const loadTriggerRef = useRef(null);

  // ── Expose scrollToIndex to parent ─────────────────────
  useImperativeHandle(ref, () => ({
    scrollToIndex(idx) {
      // Ensure enough posts are rendered
      if (idx >= displayCount) {
        setDisplayCount(Math.min(idx + BATCH_SIZE, posts.length));
        // Wait for render then scroll
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const card = document.querySelector(`[data-post-index="${idx}"]`);
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        });
      } else {
        const card = document.querySelector(`[data-post-index="${idx}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }), [displayCount, posts.length]);

  // ── Reset display count when posts change ──────────────
  useEffect(() => {
    setDisplayCount(BATCH_SIZE);
    window.scrollTo(0, 0);
  }, [posts]);

  // ── IntersectionObserver for scrollspy ─────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        const idx = parseInt(visible[0].target.dataset.postIndex, 10);
        if (!isNaN(idx) && posts[idx]) {
          const d = new Date(posts[idx].date);
          onScrollChange({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
            index: idx,
          });
        }
      }
    }, {
      rootMargin: '-10% 0px -60% 0px',
      threshold: 0,
    });

    // Observe all currently rendered cards
    document.querySelectorAll('[data-post-index]').forEach(card => {
      observerRef.current.observe(card);
    });

    return () => observerRef.current?.disconnect();
  }, [displayCount, posts, onScrollChange]);

  // ── Infinite scroll: load more when near bottom ────────
  useEffect(() => {
    const handleScroll = () => {
      if (displayCount >= posts.length) return;
      const distToBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (distToBottom < 800) {
        setDisplayCount(c => Math.min(c + BATCH_SIZE, posts.length));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayCount, posts.length]);

  // ── Build grouped display with date dividers ──────────
  const visiblePosts = posts.slice(0, displayCount);

  const elements = [];
  let lastDateKey = '';

  visiblePosts.forEach((post, displayIdx) => {
    const globalIdx = displayIdx; // since visiblePosts is a prefix of posts
    const d = new Date(post.date);
    const months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
    const dateKey = `${d.getFullYear()}年 ${months[d.getMonth()]}`;

    if (dateKey !== lastDateKey) {
      elements.push(
        <div className="date-divider" key={`div-${dateKey}`}>
          <div className="date-divider-line" />
          <span className="date-divider-text">{dateKey}</span>
          <div className="date-divider-line" />
        </div>
      );
      lastDateKey = dateKey;
    }

    elements.push(
      <PostCard
        key={post.id}
        post={post}
        index={globalIdx}
        resolveUrl={resolveUrl}
        onMediaClick={onMediaClick}
        allMedia={allMedia}
      />
    );
  });

  return (
    <div className="posts-container" ref={containerRef}>
      {elements}
      {displayCount < posts.length && (
        <div className="load-more" ref={loadTriggerRef}>
          <div className="spinner" />
        </div>
      )}
    </div>
  );
});

export default TimelineView;
