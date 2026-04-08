import { useState, useEffect, useCallback, useRef } from 'react';
import ScrollTopButton from './components/ScrollTopButton.jsx';
import { buildYearMonthIndex, collectAllMedia, computeStats } from './lib/parser.js';
import { readDirectoryHandle, readFilesFromInput, readZipFile, hasDirectoryPicker } from './lib/fileReader.js';
import { saveUserData, loadUserData, saveDirHandle, loadDirHandle, clearUserData } from './lib/storage.js';
import WelcomeUpload from './components/WelcomeUpload.jsx';
import Sidebar from './components/Sidebar.jsx';
import TimelineView from './components/TimelineView.jsx';
import GalleryView from './components/GalleryView.jsx';
import TimelineWheel from './components/TimelineWheel.jsx';
import Lightbox from './components/Lightbox.jsx';

export default function App() {
  const [data, setData] = useState(null); // { username, posts, yearMonthIndex, allMedia, stats, avatar }
  const [blobUrls, setBlobUrls] = useState(new Map());
  const [viewMode, setViewMode] = useState('timeline');
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [scrollInfo, setScrollInfo] = useState({ year: null, month: null, day: null, index: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cacheOnly, setCacheOnly] = useState(false); // Data loaded from cache, no media
  const timelineRef = useRef(null);

  // ── Try loading from IndexedDB cache on mount ──────────
  useEffect(() => {
    (async () => {
      const cached = await loadUserData();
      if (cached && cached.posts?.length > 0) {
        const yearMonthIndex = buildYearMonthIndex(cached.posts);
        const allMedia = collectAllMedia(cached.posts);
        const stats = computeStats(cached.posts);
        setData({ username: cached.username, posts: cached.posts, yearMonthIndex, allMedia, stats, avatar: null });
        setCacheOnly(true);

        // Try to restore directory handle for media
        if (hasDirectoryPicker()) {
          const handle = await loadDirHandle();
          if (handle) {
            try {
              const perm = await handle.requestPermission({ mode: 'read' });
              if (perm === 'granted') {
                const result = await readDirectoryHandle(handle, setLoadingMsg);
                setBlobUrls(result.blobUrls);
                if (result.avatar || result.kehuaLogo) {
                  setData(d => ({ ...d, avatar: result.avatar, kehuaLogo: result.kehuaLogo }));
                }
                setCacheOnly(false);
              }
            } catch { /* permission denied or handle invalid */ }
          }
        }
      }
    })();
  }, []);

  // ── Handle folder upload (modern API) ──────────────────
  const handleDirectoryPick = useCallback(async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      await processDirectoryHandle(dirHandle);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setLoadingMsg(`错误：${err.message}`);
      }
      setIsLoading(false);
    }
  }, []);

  // ── Handle folder drop (drag-and-drop gives us a handle directly) ──
  const handleDirectoryDrop = useCallback(async (dirHandle) => {
    await processDirectoryHandle(dirHandle);
  }, []);

  async function processDirectoryHandle(dirHandle) {
    setIsLoading(true);
    try {
      const result = await readDirectoryHandle(dirHandle, setLoadingMsg);
      applyResult(result);
      await saveDirHandle(dirHandle);
    } catch (err) {
      console.error(err);
      setLoadingMsg(`错误：${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Handle folder upload (fallback input) ──────────────
  const handleFileInput = useCallback(async (fileList) => {
    setIsLoading(true);
    try {
      const result = await readFilesFromInput(fileList, setLoadingMsg);
      applyResult(result);
    } catch (err) {
      console.error(err);
      setLoadingMsg(`错误：${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Handle ZIP upload (iOS Safari / universal) ─────────
  const handleZipUpload = useCallback(async (file) => {
    setIsLoading(true);
    try {
      const result = await readZipFile(file, setLoadingMsg);
      applyResult(result);
    } catch (err) {
      console.error(err);
      setLoadingMsg(`错误：${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Apply parsed data to state ─────────────────────────
  function applyResult({ username, posts, blobUrls: urls, avatar, kehuaLogo }) {
    const yearMonthIndex = buildYearMonthIndex(posts);
    const allMedia = collectAllMedia(posts);
    const stats = computeStats(posts);
    setData({ username, posts, yearMonthIndex, allMedia, stats, avatar, kehuaLogo });
    setBlobUrls(urls);
    setCacheOnly(false);
    saveUserData(username, posts);
  }

  // ── Resolve a relative media path to a blob URL ────────
  const resolveUrl = useCallback((relativePath) => {
    return blobUrls.get(relativePath) || null;
  }, [blobUrls]);

  // ── Navigate to a specific post index ──────────────────
  const navigateToIndex = useCallback((idx) => {
    if (viewMode === 'timeline') {
      if (timelineRef.current?.scrollToIndex) {
        timelineRef.current.scrollToIndex(idx);
      }
    } else {
      // Gallery mode: scroll to the year-month section
      if (data?.posts[idx]) {
        const d = new Date(data.posts[idx].date);
        const sectionId = `gallery-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [viewMode, data]);

  // ── Lightbox helpers ───────────────────────────────────
  const openLightbox = useCallback((index) => {
    setLightbox({ open: true, index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox({ open: false, index: 0 });
  }, []);

  // ── Reset / re-upload ─────────────────────────────────
  const handleReset = useCallback(async () => {
    await clearUserData();
    // Revoke all blob URLs
    blobUrls.forEach(url => URL.revokeObjectURL(url));
    setData(null);
    setBlobUrls(new Map());
    setCacheOnly(false);
    setViewMode('timeline');
  }, [blobUrls]);

  // ── Render: Welcome screen or main app ────────────────
  if (!data) {
    return (
      <WelcomeUpload
        onDirectoryPick={handleDirectoryPick}
        onDirectoryDrop={handleDirectoryDrop}
        onFileInput={handleFileInput}
        onZipUpload={handleZipUpload}
        isLoading={isLoading}
        loadingMsg={loadingMsg}
        hasModernAPI={hasDirectoryPicker()}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        data={data}
        scrollInfo={scrollInfo}
        onNavigate={navigateToIndex}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onReset={handleReset}
        cacheOnly={cacheOnly}
        onReloadMedia={handleDirectoryPick}
      />

      {/* Mobile topbar */}
      <header className="mobile-topbar">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="打开菜单">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span className="topbar-title">可话动态</span>
        <div className="topbar-user">{data.username}</div>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <div className="feed">
          <div className="feed-header">
            <div className="feed-title">
              <h2>{data.username} 的动态</h2>
              <span className="feed-subtitle">全部 · {data.posts.length} 条动态</span>
            </div>
            <div className="view-toggle">
              <button
                className={`vt-btn${viewMode === 'timeline' ? ' active' : ''}`}
                onClick={() => setViewMode('timeline')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                动态
              </button>
              <button
                className={`vt-btn${viewMode === 'gallery' ? ' active' : ''}`}
                onClick={() => setViewMode('gallery')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                相册
              </button>
            </div>
          </div>

          {viewMode === 'timeline' ? (
            <TimelineView
              ref={timelineRef}
              posts={data.posts}
              resolveUrl={resolveUrl}
              onScrollChange={setScrollInfo}
              onMediaClick={openLightbox}
              allMedia={data.allMedia}
            />
          ) : (
            <GalleryView
              posts={data.posts}
              allMedia={data.allMedia}
              resolveUrl={resolveUrl}
              onMediaClick={openLightbox}
            />
          )}
        </div>
      </main>

      {viewMode === 'timeline' && (
        <TimelineWheel scrollInfo={scrollInfo} posts={data.posts} />
      )}

      {lightbox.open && (
        <Lightbox
          items={data.allMedia}
          currentIndex={lightbox.index}
          resolveUrl={resolveUrl}
          onClose={closeLightbox}
          onNavigate={(idx) => setLightbox({ open: true, index: idx })}
        />
      )}

      <ScrollTopButton />
    </div>
  );
}
