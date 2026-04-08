import { useRef, useCallback, useState } from 'react';

export default function WelcomeUpload({ onDirectoryPick, onDirectoryDrop, onFileInput, onZipUpload, isLoading, loadingMsg, hasModernAPI }) {
  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleFolderPick = useCallback(() => {
    setShowMenu(false);
    if (hasModernAPI) {
      onDirectoryPick();
    } else {
      fileInputRef.current?.click();
    }
  }, [hasModernAPI, onDirectoryPick]);

  const handleZipPick = useCallback(() => {
    setShowMenu(false);
    zipInputRef.current?.click();
  }, []);

  const handleZipChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      onZipUpload(file);
    }
  }, [onZipUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    // Check for ZIP file drop
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles?.length === 1 && droppedFiles[0].name.endsWith('.zip')) {
      onZipUpload(droppedFiles[0]);
      return;
    }

    const items = e.dataTransfer?.items;
    if (items?.length > 0) {
      const item = items[0];
      if (item.getAsFileSystemHandle) {
        item.getAsFileSystemHandle().then(handle => {
          if (handle.kind === 'directory') {
            onDirectoryDrop?.(handle);
          }
        });
        return;
      }
    }

    if (droppedFiles?.length > 0) {
      onFileInput(droppedFiles);
    }
  }, [onDirectoryDrop, onFileInput, onZipUpload]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  return (
    <div className="welcome-page" onClick={() => showMenu && setShowMenu(false)}>
      <div className="welcome-container">
        <div className="welcome-graphic">
          <div className="welcome-orb orb-1" />
          <div className="welcome-orb orb-2" />
          <div className="welcome-orb orb-3" />
        </div>

        <div className="welcome-logo">
          <svg viewBox="0 0 56 56" width="56" height="56">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#e11d48' }} />
                <stop offset="100%" style={{ stopColor: '#be123c' }} />
              </linearGradient>
            </defs>
            <rect rx="14" width="56" height="56" fill="url(#logoGrad)" />
            <text x="28" y="37" textAnchor="middle" fill="white" fontSize="24" fontWeight="700" fontFamily="Outfit, sans-serif">可</text>
          </svg>
        </div>

        <h1 className="welcome-title">可话 · 动态查看器</h1>
        <p className="welcome-desc">
          浏览你在可话留下的珍贵记忆<br />
          <span className="welcome-note">纯前端运行 · 数据不上传至任何服务器</span>
        </p>

        {/* Upload zone */}
        <div
          className="upload-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isLoading ? (
            <div className="upload-loading">
              <div className="spinner" />
              <p className="upload-progress">{loadingMsg || '处理中…'}</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="upload-main-text">将可话数据包拖至此处</p>
              <p className="upload-sub-text">支持文件夹或 ZIP 压缩包</p>

              <div className="upload-btns">
                <div className="import-btn-wrapper">
                  <button
                    className="btn-primary"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v12" />
                      <path d="m8 11 4 4 4-4" />
                      <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                    </svg>
                    导入数据
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 2 }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {showMenu && (
                    <div className="import-menu" onClick={(e) => e.stopPropagation()}>
                      <button className="import-menu-item" onClick={handleFolderPick}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <div>
                          <span className="import-menu-title">打开文件夹</span>
                          <span className="import-menu-desc">选择解压后的导出目录</span>
                        </div>
                      </button>
                      <button className="import-menu-item" onClick={handleZipPick}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M21 8v13H3V8" />
                          <path d="M1 3h22v5H1z" />
                          <path d="M10 12h4" />
                        </svg>
                        <div>
                          <span className="import-menu-title">打开 ZIP 压缩包</span>
                          <span className="import-menu-desc">直接读取原始压缩文件</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                style={{ display: 'none' }}
                onChange={(e) => onFileInput(e.target.files)}
              />
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                style={{ display: 'none' }}
                onChange={handleZipChange}
              />
            </>
          )}
        </div>

        <div className="welcome-footer">
          <p className="welcome-privacy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            所有数据均在本地处理，不会上传至服务器
          </p>
          <p className="welcome-oss">
            开源项目 · MIT License ·
            <a href="https://github.com/JackMeds" target="_blank" rel="noopener">JackMeds</a>
          </p>
        </div>
      </div>
    </div>
  );
}
