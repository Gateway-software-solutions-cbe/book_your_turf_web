import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { partnerTurfsApi } from "../../api/partner/turfs";
import type { PartnerTurf } from "../../types/partner/turf";
import "./PartnerProfilePage.css";

const PartnerProfilePage: React.FC = () => {
  const { partner } = usePartnerAuth();
  const navigate = useNavigate();

  const [turfs, setTurfs] = useState<PartnerTurf[]>([]);
  const [turfsLoading, setTurfsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await partnerTurfsApi.list();
        setTurfs(res.data || []);
      } catch {
        setTurfs([]);
      } finally {
        setTurfsLoading(false);
      }
    })();
  }, []);

  if (!partner) return null;

  const initials = (partner.name || "P")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sportEmoji = (gameType: string): string => {
    const g = gameType.toLowerCase();
    if (g.includes("badminton")) return "🏸";
    if (g.includes("pickle")) return "🏓";
    return "⚽";
  };

  const statusLabel = (status: string) => {
    if (status === "Approved") return "Approved";
    if (status === "Rejected") return "Rejected";
    return "Pending";
  };

  const statusClass = (status: string) => {
    if (status === "Approved") return "pt-prof-status-approved";
    if (status === "Rejected") return "pt-prof-status-rejected";
    return "pt-prof-status-pending";
  };

  return (
    <div className="pt-prof-page">
      {/* Hero banner */}
      <div className="pt-prof-banner">
        <div className="pt-prof-banner-bg" />
        <div className="pt-prof-avatar">
          {partner.profile_image_url ? (
            <img src={partner.profile_image_url} alt={partner.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>

      <div className="pt-prof-hero">
        <h2 className="pt-prof-name">{partner.name || "Partner"}</h2>
        <p className="pt-prof-email">{partner.email || "—"}</p>
        <span className="pt-prof-tag">✓ Channel Partner</span>
      </div>

      {/* Account Details */}
      <section className="pt-prof-card">
        <header className="pt-prof-card-header">
          <span className="pt-prof-card-bar" />
          <h3>Account Details</h3>
        </header>

        <div className="pt-prof-row">
          <span className="pt-prof-row-icon">👤</span>
          <div className="pt-prof-row-body">
            <span className="pt-prof-row-label">Full Name</span>
            <span className="pt-prof-row-value">{partner.name || "—"}</span>
          </div>
        </div>

        <div className="pt-prof-row">
          <span className="pt-prof-row-icon">✉️</span>
          <div className="pt-prof-row-body">
            <span className="pt-prof-row-label">Email Address</span>
            <span className="pt-prof-row-value">
              {partner.email || "—"}
            </span>
          </div>
        </div>

        <div className="pt-prof-row">
          <span className="pt-prof-row-icon">📞</span>
          <div className="pt-prof-row-body">
            <span className="pt-prof-row-label">Mobile Number</span>
            <span className="pt-prof-row-value">{partner.number}</span>
          </div>
        </div>

        <div className="pt-prof-row">
          <span className="pt-prof-row-icon">🏅</span>
          <div className="pt-prof-row-body">
            <span className="pt-prof-row-label">Account Type</span>
            <span className="pt-prof-row-value pt-prof-green">
              Channel Partner
            </span>
          </div>
        </div>
      </section>

      {/* My Turfs */}
      <section className="pt-prof-card">
        <header className="pt-prof-card-header">
          <span className="pt-prof-card-bar" />
          <h3>My Turfs</h3>
          <span className="pt-prof-count">{turfs.length}</span>
        </header>

        {turfsLoading ? (
          <div className="pt-prof-turfs-loading">Loading...</div>
        ) : turfs.length === 0 ? (
          <div className="pt-prof-turfs-empty">
            <p>No venues added yet</p>
          </div>
        ) : (
          <div className="pt-prof-turfs">
            {turfs.map((t, idx) => {
              const isTurfSport =
                t.game_type.toLowerCase().includes("cricket") ||
                t.game_type.toLowerCase().includes("football");
              return (
                <div
                  key={t.id}
                  className="pt-prof-turf"
                  onClick={() => navigate(`/partner/venues/${t.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="pt-prof-turf-index">{idx + 1}</div>
                  <div className="pt-prof-turf-body">
                    <div className="pt-prof-turf-top">
                      <span className="pt-prof-turf-name">{t.name}</span>
                    </div>
                    <div className="pt-prof-turf-meta">
                      <span className="pt-prof-turf-code">
                        🆔 {t.turf_code}
                      </span>
                      <span className="pt-prof-turf-sport">
                        {sportEmoji(t.game_type)}{" "}
                        {isTurfSport ? "Turf" : "Court"}
                      </span>
                      <span
                        className={`pt-prof-turf-status ${statusClass(
                          t.status,
                        )}`}
                      >
                        ✓ {statusLabel(t.status)}
                      </span>
                    </div>
                    <div className="pt-prof-turf-date">
                      📅 {new Date(t.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="pt-prof-actions">
        <button
          className="pt-prof-btn pt-prof-btn-secondary"
          onClick={() => navigate("/partner/devices")}
        >
          🖥 Manage Devices
        </button>
        <button
          className="pt-prof-btn pt-prof-btn-danger"
          onClick={() => navigate("/partner/settings/edit-profile")}
        >
          ✎ Edit Profile
        </button>
      </div>

    </div>
  );
};

export default PartnerProfilePage;