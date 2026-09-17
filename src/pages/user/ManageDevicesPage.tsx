// src/pages/user/ManageDevicesPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listDevices, logoutDevice } from '../../api/user/devices';
import { getClientDeviceId, detectPlatform } from '../../utils/deviceUtils';
import type { UserDevice } from '../../types/user/device';
import './style/ManageDevicesPage.css';

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatRelativeTime = (iso?: string) => {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
};

const platformLabel = (p?: string) => {
  if (!p) return 'DEVICE';
  return p.toUpperCase();
};

const platformIcon = (p?: string) => {
  switch (p) {
    case 'android': return 'android2';
    case 'ios': return 'apple';
    case 'web': return 'display';
    default: return 'phone';
  }
};

// Truncate ID like "AND-V1TD..."
const truncateId = (id?: string) => {
  if (!id) return '—';
  return id.length > 10 ? `${id.slice(0, 8)}...` : id;
};

// ─── Page ─────────────────────────────────────────────────────────────────
const ManageDevicesPage = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoutTarget, setLogoutTarget] = useState<UserDevice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentDeviceId = getClientDeviceId();
  const currentPlatform = detectPlatform();

  // ─── Fetch ──────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await listDevices();
      if (res.result === 'success' && Array.isArray(res.data)) {
        setDevices(res.data);
      } else {
        setError(res.message || 'Failed to load devices');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // ─── Logout device ──────────────────────────────────────────────────
  const handleConfirmLogout = async () => {
    if (!logoutTarget) return;
    setActionLoading(true);
    try {
      const res = await logoutDevice({ device_id: logoutTarget.id });
      if (res.result === 'success') {
        setLogoutTarget(null);
        await fetchDevices(true);
      } else {
        alert(res.message || 'Failed to logout device');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to logout device');
    } finally {
      setActionLoading(false);
    }
  };

  const isCurrent = (d: UserDevice) =>
    d.device_id === currentDeviceId ||
    (d.platform === currentPlatform &&
      d.device_name?.toLowerCase().includes('chrome') &&
      d.device_name?.toLowerCase().includes(currentPlatform === 'android' ? 'android' : currentPlatform));

  return (
    <div className="devices-page">
      {/* Header */}
      <div className="devices-page__header">
        <div>
          <h1>Manage Devices</h1>
          <p>Devices currently logged into your account</p>
        </div>
        <button
          className="devices-page__refresh"
          onClick={() => fetchDevices(true)}
          disabled={refreshing || loading}
          aria-label="Refresh"
        >
          <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="devices-page__loading">
          <div className="spinner-border text-success" role="status" />
          <p>Loading devices...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="devices-page__error">
          <i className="bi bi-exclamation-triangle-fill" />
          <p>{error}</p>
          <button onClick={() => fetchDevices()}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && devices.length === 0 && (
        <div className="devices-page__empty">
          <i className="bi bi-phone" />
          <h3>No devices found</h3>
          <p>
            We haven't recorded any logged-in devices yet.
            Try refreshing in a moment.
          </p>
          <button onClick={() => fetchDevices(true)}>
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>
      )}

      {/* List */}
      {!loading && !error && devices.length > 0 && (
        <div className="devices-page__list">
          {devices.map((d) => {
            const current = isCurrent(d);
            const active = d.is_active !== false;

            return (
              <div
                key={d.id}
                className={`device-card ${current ? 'device-card--current' : ''}`}
              >
                {/* Icon */}
                <div className={`device-card__icon device-card__icon--${d.platform}`}>
                  <i className={`bi bi-${platformIcon(d.platform)}`} />
                </div>

                {/* Body */}
                <div className="device-card__body">
                  <div className="device-card__top">
                    <h3 className="device-card__name">
                      {d.device_name || 'Unknown device'}
                    </h3>
                    {current && (
                      <span className="device-card__current-badge">Current</span>
                    )}
                  </div>

                  <div className="device-card__chips">
                    <span className={`device-card__chip device-card__chip--platform`}>
                      {platformLabel(d.platform)}
                    </span>
                    {d.os_version && (
                      <span className="device-card__chip">{d.os_version}</span>
                    )}
                  </div>

                  {d.location && (
                    <div className="device-card__meta">
                      <i className="bi bi-geo-alt" />
                      <span>{d.location}</span>
                    </div>
                  )}

                  <div className="device-card__meta">
                    <i className="bi bi-clock" />
                    <span>Added {formatRelativeTime(d.created_at)}</span>
                    <span className={`device-card__dot ${active ? 'active' : 'inactive'}`} />
                    <span className={active ? 'device-card__active' : 'device-card__inactive'}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="device-card__meta device-card__meta--id">
                    <i className="bi bi-fingerprint" />
                    <span>ID: {truncateId(d.device_id)}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="device-card__action">
                  {current ? (
                    <button
                      className="device-card__info-btn"
                      title="This is your current device"
                      aria-label="Current device"
                    >
                      <i className="bi bi-info-circle" />
                    </button>
                  ) : (
                    <button
                      className="device-card__logout-btn"
                      onClick={() => setLogoutTarget(d)}
                      title="Logout this device"
                      aria-label="Logout device"
                    >
                      <i className="bi bi-box-arrow-right" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Logout confirm modal */}
      {logoutTarget && (
  <div
    className="device-modal-overlay"
    onClick={() => !actionLoading && setLogoutTarget(null)}
  >
    <div className="device-modal" onClick={(e) => e.stopPropagation()}>
      {/* Header: icon + title inline */}
      <div className="device-modal__header">
        <div className="device-modal__header-icon">
          <i className={`bi bi-${platformIcon(logoutTarget.platform)}`} />
        </div>
        <h2 className="device-modal__title">Logout Device?</h2>
      </div>

      {/* Device details */}
      <div className="device-modal__details">
        <div className="device-modal__device-name">
          {logoutTarget.device_name || 'Unknown device'}
        </div>

        <div className="device-modal__chips">
          <span className="device-modal__chip">
            {platformLabel(logoutTarget.platform)}
            {logoutTarget.os_version && ` • ${logoutTarget.os_version}`}
          </span>
        </div>

        {logoutTarget.location && (
          <div className="device-modal__meta">
            <i className="bi bi-geo-alt-fill" />
            <span>{logoutTarget.location}</span>
          </div>
        )}
      </div>

      <div className="device-modal__divider" />

      {/* Warning text */}
      <p className="device-modal__message">
        This device will be logged out and will no longer receive
        notifications from your account.
      </p>

      {/* Reference ID pill */}
      <div className="device-modal__ref">
        <i className="bi bi-fingerprint" />
        <span>ID: {logoutTarget.device_id || '—'}</span>
      </div>

      {/* Actions — right-aligned, text Cancel + green Logout */}
      <div className="device-modal__actions">
        <button
          className="device-modal__btn device-modal__btn--text"
          onClick={() => setLogoutTarget(null)}
          disabled={actionLoading}
        >
          Cancel
        </button>
        <button
          className="device-modal__btn device-modal__btn--primary"
          onClick={handleConfirmLogout}
          disabled={actionLoading}
        >
          {actionLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default ManageDevicesPage;