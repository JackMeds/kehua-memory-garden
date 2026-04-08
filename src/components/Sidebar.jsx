import MonthStrip from './MonthStrip.jsx';
import WeekStrip from './WeekStrip.jsx';

export default function Sidebar({ data, scrollInfo, onNavigate, isOpen, onClose, onReset, cacheOnly, onReloadMedia }) {
  const { username, avatar, kehuaLogo, yearMonthIndex, stats } = data;
  const years = Object.keys(yearMonthIndex).sort((a, b) => b - a);

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* ── Header: Logo + Branding ──────────────────── */}
      <div className="sidebar-header">
        <div className="logo-area">
          <div className="logo-icon">
            {kehuaLogo ? (
              <img src={kehuaLogo} alt="可话" className="logo-icon-img" />
            ) : (
              <svg viewBox="0 0 40 40" width="40" height="40">
                <defs>
                  <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#e11d48' }} />
                    <stop offset="100%" style={{ stopColor: '#be123c' }} />
                  </linearGradient>
                </defs>
                <rect rx="10" width="40" height="40" fill="url(#sidebarLogoGrad)" />
                <text x="20" y="27" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Outfit, sans-serif">可</text>
              </svg>
            )}
          </div>
          <div className="logo-text">
            <h1>动态查看器</h1>
            <span className="logo-sub">for 可话 · by JackMeds</span>
          </div>
        </div>
      </div>

      {/* ── User info ────────────────────────────────── */}
      <div className="sidebar-section">
        <div className="section-label">用户</div>
        <div className="user-list">
          <div className="user-item active">
            <div className="user-avatar">
              {avatar ? <img src={avatar} alt={username} /> : username[0]}
            </div>
            <span className="user-name">{username}</span>
          </div>
        </div>
      </div>

      {/* ── Timeline navigation ──────────────────────── */}
      <div className="sidebar-section">
        <div className="section-label">时间线</div>
        <div className="year-filter">
          {years.map(y => (
            <button
              key={y}
              className={`year-btn${scrollInfo.year === parseInt(y) ? ' active' : ''}`}
              onClick={() => {
                const idx = yearMonthIndex[y]?.firstIndex;
                if (idx !== undefined) onNavigate(idx);
              }}
            >
              {y}
            </button>
          ))}
        </div>

        <MonthStrip
          yearMonthIndex={yearMonthIndex}
          currentYear={scrollInfo.year}
          currentMonth={scrollInfo.month}
          onNavigate={onNavigate}
        />

        <WeekStrip
          year={scrollInfo.year}
          month={scrollInfo.month}
          day={scrollInfo.day}
        />
      </div>

      {/* ── Stats ────────────────────────────────────── */}
      <div className="sidebar-section">
        <div className="section-label">数据统计</div>
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-value">{stats?.totalPosts ?? '—'}</div>
            <div className="stat-label">条动态</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.totalImages ?? '—'}</div>
            <div className="stat-label">张图片</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.totalVideos ?? '—'}</div>
            <div className="stat-label">个视频</div>
          </div>
        </div>
      </div>

      {/* ── Cache notice ─────────────────────────────── */}
      {cacheOnly && (
        <div className="sidebar-section">
          <div className="cache-notice">
            <p>📂 图片暂未加载</p>
            <button className="btn-secondary btn-sm" onClick={onReloadMedia}>重新选择文件夹</button>
          </div>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────── */}
      <div className="sidebar-section sidebar-actions">
        <button className="btn-ghost" onClick={onReset}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          重新导入数据
        </button>
      </div>

      {/* ── Footer: MIT + GitHub ──────────────────────── */}
      <div className="sidebar-footer">
        <div className="footer-divider" />
        <p className="footer-license">MIT License © JackMeds</p>
        <div className="footer-links">
          <a href="https://github.com/JackMeds" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
            个人主页
          </a>
          <span className="footer-dot">·</span>
          <a href="https://github.com/JackMeds/kehua-viewer" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            项目仓库
          </a>
        </div>
        <p className="footer-disclaimer">本项目为社区开源工具，与可话官方无关</p>
      </div>
    </aside>
  );
}
