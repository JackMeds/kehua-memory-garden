import { useMemo } from 'react';

export default function TimelineWheel({ scrollInfo, posts }) {
  const { index } = scrollInfo;
  const post = posts[index];

  const prevDate = useMemo(() => {
    if (index > 0 && posts[index - 1]) return formatShort(posts[index - 1].date);
    return '';
  }, [index, posts]);

  const nextDate = useMemo(() => {
    if (index < posts.length - 1 && posts[index + 1]) return formatShort(posts[index + 1].date);
    return '';
  }, [index, posts]);

  if (!post) return null;

  const d = new Date(post.date);
  const pad = n => String(n).padStart(2, '0');

  return (
    <div className={`timeline-indicator${scrollInfo.year ? ' visible' : ''}`}>
      <div className="ti-wheel">
        <div className="ti-wheel-item prev">{prevDate}</div>
        <div className="ti-wheel-item curr">
          <div className="ti-wheel-curr-inner">
            <span className="ti-year">{d.getFullYear()}</span>
            <span className="ti-month">{pad(d.getMonth() + 1)}</span>
            <span className="ti-day">{pad(d.getDate())}日</span>
          </div>
        </div>
        <div className="ti-wheel-item next">{nextDate}</div>
      </div>
    </div>
  );
}

function formatShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}
