import { useCallback, useEffect, useState } from 'react';
import { getAppVersion } from '../../api/admin/appversion';
import type { AppType, AppPlatform } from '../../types/admin/appversion';

// ─── Tab: App Version ──────────────────────────────────────────────────────────
const AppVersion: React.FC = () => {
  const [appType, setAppType] = useState<AppType>('user');
  const [platform, setPlatform] = useState<AppPlatform>('android');
  const [version, setVersion] = useState<import('../../types/admin/appversion').AppVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setVersion(null);
    try {
      const data = await getAppVersion(appType, platform);
      setVersion(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 404 ? 'No version record found for this combination.' : 'Failed to fetch version info.');
    } finally { setIsLoading(false); }
  }, [appType, platform]);

  useEffect(() => { fetchVersion(); }, [fetchVersion]);

  // Helper to get icon for app type
  const getAppIcon = (type: AppType) => type === 'user' ? 'bi-person' : 'bi-building';
  const getPlatformIcon = (plat: AppPlatform) => plat === 'android' ? 'bi-android2' : 'bi-apple';

  return (
    <div className="d-flex justify-content-center align-items-start" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '720px' }}>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-success bg-opacity-10 rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px' }}>
              <i className="bi bi-phone text-success fs-5"></i>
            </div>
            <div>
              <h3 className="h4 mb-0 fw-bold text-dark">App Version</h3>
              <p className="text-secondary small mb-0">View minimum and latest version info for user and partner apps.</p>
            </div>
          </div>
        </div>

        {/* ── Filter Section ────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            <div className="row g-3">
              {/* App Type */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark small mb-2">
                  <i className="bi bi-app-indicator me-1 text-success"></i>App Type
                </label>
                <div className="d-flex gap-2">
                  {(['user', 'partner'] as AppType[]).map((t) => (
                    <button
                      key={t}
                      className={`btn btn-sm flex-fill rounded-pill py-2 justify-content-center fw-semibold ${
                        appType === t 
                          ? 'btn-success text-white shadow-sm' 
                          : 'btn-light text-secondary border-0'
                      }`}
                      onClick={() => setAppType(t)}
                      style={{ 
                        transition: 'all 0.2s ease',
                        backgroundColor: appType === t ? undefined : '#f8f9fa',
                      }}
                      onMouseEnter={(e) => {
                        if (appType !== t) {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (appType !== t) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                    >
                      <i className={`bi ${getAppIcon(t)} me-1`}></i>
                      {t === 'user' ? 'User App' : 'Partner App'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark small mb-2">
                  <i className="bi bi-device-ssd me-1 text-success"></i>Platform
                </label>
                <div className="d-flex gap-2">
                  {(['android', 'ios'] as AppPlatform[]).map((p) => (
                    <button
                      key={p}
                      className={`btn btn-sm flex-fill rounded-pill py-2 justify-content-center fw-semibold ${
                        platform === p 
                          ? 'btn-success text-white shadow-sm' 
                          : 'btn-light text-secondary border-0'
                      }`}
                      onClick={() => setPlatform(p)}
                      style={{ 
                        transition: 'all 0.2s ease',
                        backgroundColor: platform === p ? undefined : '#f8f9fa',
                      }}
                      onMouseEnter={(e) => {
                        if (platform !== p) {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (platform !== p) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                    >
                      <i className={`bi ${getPlatformIcon(p)} me-1`}></i>
                      {p === 'android' ? 'Android' : 'iOS'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading State ──────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body p-5 text-center">
              <div className="spinner-border text-success" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-secondary small mb-0">Loading version information...</p>
            </div>
          </div>
        )}

        {/* ── Error State ────────────────────────────────────────────────────── */}
        {error && !isLoading && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3">
                <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
              </div>
              <h6 className="text-dark mb-1">Unable to load version info</h6>
              <p className="text-secondary small mb-3">{error}</p>
              <button 
                className="btn btn-outline-success btn-sm rounded-pill px-4"
                onClick={() => fetchVersion()}
              >
                <i className="bi bi-arrow-repeat me-1"></i>Try Again
              </button>
            </div>
          </div>
        )}

        {/* ── Version Details ────────────────────────────────────────────────── */}
        {version && !isLoading && (
          <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
            <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-success bg-opacity-10 rounded-2 p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-phone text-success"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">Version Details</h6>
                  <span className="text-secondary small">
                    {appType === 'user' ? 'User App' : 'Partner App'} • {platform === 'android' ? 'Android' : 'iOS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="row g-3">
                {/* Minimum Version */}
                <div className="col-6">
                  <div className="bg-light rounded-3 p-3 text-center" style={{ borderRadius: '12px' }}>
                    <div className="text-secondary small text-uppercase fw-semibold mb-1">
                      <i className="bi bi-arrow-down-circle me-1"></i>Minimum
                    </div>
                    <div className="h5 fw-bold text-dark mb-0">{version.minimum_version}</div>
                  </div>
                </div>

                {/* Latest Version */}
                <div className="col-6">
                  <div className="bg-success bg-opacity-10 rounded-3 p-3 text-center" style={{ borderRadius: '12px' }}>
                    <div className="text-secondary small text-uppercase fw-semibold mb-1">
                      <i className="bi bi-arrow-up-circle me-1"></i>Latest
                    </div>
                    <div className="h5 fw-bold text-success mb-0">{version.latest_version}</div>
                  </div>
                </div>

                {/* Force Update */}
                <div className="col-6">
                  <div className="bg-light rounded-3 p-3 text-center" style={{ borderRadius: '12px' }}>
                    <div className="text-secondary small text-uppercase fw-semibold mb-1">
                      <i className="bi bi-exclamation-triangle me-1"></i>Force Update
                    </div>
                    <span className={`badge rounded-pill px-3 py-1 ${
                      version.force_update ? 'bg-danger' : 'bg-success'
                    }`}>
                      {version.force_update ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-6">
                  <div className="bg-light rounded-3 p-3 text-center" style={{ borderRadius: '12px' }}>
                    <div className="text-secondary small text-uppercase fw-semibold mb-1">
                      <i className="bi bi-circle-fill me-1"></i>Status
                    </div>
                    <span className={`badge rounded-pill px-3 py-1 ${
                      version.is_active ? 'bg-success' : 'bg-secondary'
                    }`}>
                      <span className={`d-inline-block rounded-circle me-1 ${
                        version.is_active ? 'bg-white' : 'bg-white'
                      }`} style={{ width: '5px', height: '5px' }}></span>
                      {version.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Update URL */}
              {version.update_url && (
                <div className="mt-3 pt-3 border-top">
                  <label className="form-label fw-semibold text-dark small mb-1">
                    <i className="bi bi-link-45deg me-1 text-success"></i>Update URL
                  </label>
                  <div className="bg-light rounded-3 p-2 d-flex align-items-center gap-2">
                    <a 
                      href={version.update_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-success text-decoration-none small flex-grow-1"
                      style={{ wordBreak: 'break-all' }}
                    >
                      {version.update_url}
                    </a>
                    <button 
                      className="btn btn-sm btn-outline-secondary rounded-pill"
                      onClick={() => navigator.clipboard?.writeText(version.update_url || '')}
                      title="Copy URL"
                      style={{ flexShrink: 0 }}
                    >
                      <i className="bi bi-copy"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Info Badge */}
              <div className="mt-3 text-center">
                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Version {version.latest_version} is available
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppVersion;