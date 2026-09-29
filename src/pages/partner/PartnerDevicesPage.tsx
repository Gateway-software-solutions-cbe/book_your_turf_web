import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listPartnerDevices,
  logoutPartnerDevice,
} from "../../api/partner/devices";
import {
  getPartnerDeviceId,
  detectPartnerPlatform,
} from "../../utils/partnerDeviceUtils";
import type { PartnerDevice } from "../../types/partner/device";
import "./PartnerDevicesPage.css";

// ─── Helpers ─────────────────────────────────────────────
const formatRelativeTime = (iso?: string) => {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
};

const platformLabel = (p?: string) => (p ? p.toUpperCase() : "DEVICE");

const platformIcon = (p?: string) => {
  switch (p) {
    case "android":
      return "🤖";
    case "ios":
      return "🍎";
    case "web":
      return "💻";
    default:
      return "📱";
  }
};

const truncateId = (id?: string) => {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 10)}…` : id;
};

// ─── Page ────────────────────────────────────────────────
const PartnerDevicesPage: React.FC = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState<PartnerDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoutTarget, setLogoutTarget] = useState<PartnerDevice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentDeviceId = getPartnerDeviceId();
  const currentPlatform = detectPartnerPlatform();

  // ─── Fetch ─────────────────────────────────────────────
  const fetchDevices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await listPartnerDevices();
      if (res.result === "success" && Array.isArray(res.data)) {
        setDevices(res.data);
      } else {
        setError(res.message || "Failed to load devices");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // ─── Logout handler ────────────────────────────────────
  const handleConfirmLogout = async () => {
    if (!logoutTarget) return;
    setActionLoading(true);
    try {
      const res = await logoutPartnerDevice({ device_id: logoutTarget.id });
      if (res.result === "success") {
        setLogoutTarget(null);
        await fetchDevices(true);
      } else {
        alert(res.message || "Failed to logout device");
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to logout device");
    } finally {
      setActionLoading(false);
    }
  };

  const isCurrent = (d: PartnerDevice) => {
    // Match by our locally stored ID, or by platform + name heuristic
    if (d.device_id === currentDeviceId) return true;
    if (
      d.platform === currentPlatform &&
      d.device_name?.toLowerCase().includes("chrome") &&
      currentPlatform === "web"
    ) {
      return true;
    }
    return false;
  };

  return (
    <div className="pt-dev-page">
      {/* Header */}
      <header className="pt-dev-header">
        <button
          className="pt-dev-back"
          onClick={() => navigate("/partner/profile")}
          aria-label="Back"
        >
          ‹
        </button>
        <div className="pt-dev-header-body">
          <h1>Manage Devices</h1>
          <p>Devices currently logged into your account</p>
        </div>
        <button
          className="pt-dev-refresh"
          onClick={() => fetchDevices(true)}
          disabled={refreshing || loading}
          aria-label="Refresh"
        >
          {refreshing ? "…" : "⟳"}
        </button>
      </header>

      {/* Loading */}
      {loading && (
        <div className="pt-dev-loading">
          <div className="pt-dev-spinner" />
          <p>Loading devices...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="pt-dev-error">
          <span>⚠</span>
          <p>{error}</p>
          <button onClick={() => fetchDevices()}>Retry</button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && devices.length === 0 && (
        <div className="pt-dev-empty">
          <div className="pt-dev-empty-icon">📱</div>
          <h3>No devices found</h3>
          <p>
            We haven't recorded any logged-in devices yet. Try refreshing in a
            moment.
          </p>
          <button onClick={() => fetchDevices(true)}>⟳ Refresh</button>
        </div>
      )}

      {/* List */}
      {!loading && !error && devices.length > 0 && (
        <div className="pt-dev-list">
          {devices.map((d) => {
            const current = isCurrent(d);
            const active = d.is_active !== false;

            return (
              <div
                key={d.id}
                className={`pt-dev-card ${current ? "pt-dev-card-current" : ""}`}
              >
                <div className={`pt-dev-card-icon pt-dev-card-icon-${d.platform}`}>
                  {platformIcon(d.platform)}
                </div>

                <div className="pt-dev-card-body">
                  <div className="pt-dev-card-top">
                    <h3 className="pt-dev-card-name">
                      {d.device_name || "Unknown device"}
                    </h3>
                    {current && (
                      <span className="pt-dev-current-badge">Current</span>
                    )}
                  </div>

                  <div className="pt-dev-card-chips">
                    <span className="pt-dev-chip pt-dev-chip-platform">
                      {platformLabel(d.platform)}
                    </span>
                    {d.os_version && (
                      <span className="pt-dev-chip">{d.os_version}</span>
                    )}
                  </div>

                  {d.location && (
                    <div className="pt-dev-card-meta">
                      <span>📍</span>
                      <span>{d.location}</span>
                    </div>
                  )}

                  <div className="pt-dev-card-meta">
                    <span>🕐</span>
                    <span>Added {formatRelativeTime(d.created_at)}</span>
                    <span
                      className={`pt-dev-dot ${active ? "pt-dev-dot-active" : "pt-dev-dot-inactive"}`}
                    />
                    <span
                      className={
                        active ? "pt-dev-active" : "pt-dev-inactive"
                      }
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="pt-dev-card-meta pt-dev-card-meta-id">
                    <span>🆔</span>
                    <span>ID: {truncateId(d.device_id)}</span>
                  </div>
                </div>

                <div className="pt-dev-card-action">
                  {current ? (
                    <button
                      className="pt-dev-info-btn"
                      title="This is your current device"
                      aria-label="Current device"
                    >
                      ℹ
                    </button>
                  ) : (
                    <button
                      className="pt-dev-logout-btn"
                      onClick={() => setLogoutTarget(d)}
                      title="Logout this device"
                      aria-label="Logout device"
                    >
                      ↪
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Logout confirmation modal */}
      {logoutTarget && (
        <div
          className="pt-dev-modal-overlay"
          onClick={() => !actionLoading && setLogoutTarget(null)}
        >
          <div
            className="pt-dev-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-dev-modal-header">
              <div className="pt-dev-modal-header-icon">
                {platformIcon(logoutTarget.platform)}
              </div>
              <h2 className="pt-dev-modal-title">Logout Device?</h2>
            </div>

            <div className="pt-dev-modal-details">
              <div className="pt-dev-modal-device-name">
                {logoutTarget.device_name || "Unknown device"}
              </div>
              <div className="pt-dev-modal-chips">
                <span className="pt-dev-modal-chip">
                  {platformLabel(logoutTarget.platform)}
                  {logoutTarget.os_version && ` • ${logoutTarget.os_version}`}
                </span>
              </div>
              {logoutTarget.location && (
                <div className="pt-dev-modal-meta">
                  <span>📍</span>
                  <span>{logoutTarget.location}</span>
                </div>
              )}
            </div>

            <div className="pt-dev-modal-divider" />

            <p className="pt-dev-modal-message">
              This device will be logged out and will no longer receive
              notifications from your account.
            </p>

            <div className="pt-dev-modal-ref">
              <span>🆔</span>
              <span>ID: {logoutTarget.device_id || "—"}</span>
            </div>

            <div className="pt-dev-modal-actions">
              <button
                className="pt-dev-modal-btn pt-dev-modal-btn-text"
                onClick={() => setLogoutTarget(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="pt-dev-modal-btn pt-dev-modal-btn-primary"
                onClick={handleConfirmLogout}
                disabled={actionLoading}
              >
                {actionLoading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDevicesPage;