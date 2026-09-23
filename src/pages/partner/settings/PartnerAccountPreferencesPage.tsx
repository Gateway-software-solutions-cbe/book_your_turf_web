import React from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import "./PartnerAccountPreferencesPage.css";

const PartnerAccountPreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { partner } = usePartnerAuth();

  if (!partner) return null;

  const initials = (partner.name || "P")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="pt-ap-page">
      <header className="pt-ap-header">
        <button
          className="pt-ap-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ‹
        </button>
        <div>
          <h1>Account Preferences</h1>
          <p>Manage account preferences</p>
        </div>
      </header>

      {/* Identity card */}
      <section className="pt-ap-identity">
        <div className="pt-ap-avatar">
          {partner.profile_image_url ? (
            <img src={partner.profile_image_url} alt={partner.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="pt-ap-identity-body">
          <h2>{partner.name || "Partner"}</h2>
          <p>{partner.email || "—"}</p>
          <span className="pt-ap-tag">Channel Partner</span>
        </div>
      </section>

      {/* Account details */}
      <section className="pt-ap-info">
        <h3 className="pt-ap-section-title">Account Details</h3>

        <div className="pt-ap-row">
          <span className="pt-ap-icon">👤</span>
          <div className="pt-ap-row-body">
            <span className="pt-ap-label">Full Name</span>
            <span className="pt-ap-value">{partner.name || "—"}</span>
          </div>
        </div>

        <div className="pt-ap-row">
          <span className="pt-ap-icon">✉️</span>
          <div className="pt-ap-row-body">
            <span className="pt-ap-label">Email Address</span>
            <span className="pt-ap-value">{partner.email || "—"}</span>
          </div>
        </div>

        <div className="pt-ap-row">
          <span className="pt-ap-icon">📞</span>
          <div className="pt-ap-row-body">
            <span className="pt-ap-label">Mobile Number</span>
            <span className="pt-ap-value">{partner.number}</span>
          </div>
        </div>

        <div className="pt-ap-row">
          <span className="pt-ap-icon">🏢</span>
          <div className="pt-ap-row-body">
            <span className="pt-ap-label">Business Name</span>
            <span className="pt-ap-value">
              {partner.business_name || "—"}
            </span>
          </div>
        </div>

        <div className="pt-ap-row">
          <span className="pt-ap-icon">🏅</span>
          <div className="pt-ap-row-body">
            <span className="pt-ap-label">Account Type</span>
            <span className="pt-ap-value">Channel Partner</span>
          </div>
        </div>

        <div className="pt-ap-row">
          <span className="pt-ap-icon">✓</span>
          <div className="pt-ap-row-body">
            <span className="pt-ap-label">Verification Status</span>
            <span
              className={`pt-ap-value ${
                partner.is_verified ? "pt-ap-verified" : "pt-ap-pending"
              }`}
            >
              {partner.is_verified ? "Verified" : "Pending"}
            </span>
          </div>
        </div>

        <div className="pt-ap-row">
          <span className="pt-ap-icon">✓</span>
          <div className="pt-ap-row-body">
            <span className="pt-ap-label">Account Status</span>
            <span
              className={`pt-ap-value ${
                partner.is_active === false ? "pt-ap-inactive" : "pt-ap-active"
              }`}
            >
              {partner.is_active === false ? "Inactive" : "Active"}
            </span>
          </div>
        </div>
      </section>

      {/* App version */}
      {/* <section className="pt-ap-version">
        <span className="pt-ap-version-icon">ℹ️</span>
        <div className="pt-ap-version-body">
          <span className="pt-ap-version-title">Web Version</span>
          <span className="pt-ap-version-sub">v 1.0.0</span>
        </div>
        <span className="pt-ap-version-badge">Latest</span>
      </section> */}

      {/* Remove account */}
      <button
        className="pt-ap-remove"
        onClick={() => navigate("/partner/settings/remove-account")}
      >
        <span className="pt-ap-remove-icon">🗑</span>
        <div className="pt-ap-remove-body">
          <span className="pt-ap-remove-title">Remove Account</span>
          <span className="pt-ap-remove-sub">
            Permanently deactivate your account
          </span>
        </div>
        <span className="pt-ap-remove-arrow">›</span>
      </button>

      {/* <p className="pt-ap-footer">© 2026 Book Your Turf</p> */}
    </div>
  );
};

export default PartnerAccountPreferencesPage;