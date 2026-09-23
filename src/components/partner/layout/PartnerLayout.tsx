import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import { useProfileGuard } from "../../../context/ProfileGuardContext";
import { useRegisterPartnerDevice } from "../../../hooks/useRegisterPartnerDevice";
import PartnerNotificationBell from "../PartnerNotificationBell";
import "./PartnerLayout.css";

const PartnerLayout: React.FC = () => {
  const { partner, logout, isGuest } = usePartnerAuth();
  const { openCompleteProfile } = useProfileGuard();
  const navigate = useNavigate();
  const location = useLocation();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  useRegisterPartnerDevice();

  // Auto-expand Settings when on any settings route
  useEffect(() => {
    if (location.pathname.startsWith("/partner/settings")) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/partner/auth");
  };

  const displayName = partner?.name?.trim() || "Partner";

  return (
    <div className="partner-layout">
      <aside className="partner-sidebar">
        <div className="partner-brand">
          <span className="partner-brand-dot" />
          BookYourTurf
        </div>

        <nav className="partner-nav">
          <NavLink to="/partner/dashboard" className="partner-nav-link">
            <span className="partner-nav-icon">🏠</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/partner/venues" className="partner-nav-link">
            <span className="partner-nav-icon">📍</span>
            <span>My Venues</span>
          </NavLink>

          {!isGuest && (
            <>
              <NavLink to="/partner/slots" className="partner-nav-link">
                <span className="partner-nav-icon">📅</span>
                <span>Slots</span>
              </NavLink>
              <NavLink to="/partner/bookings" className="partner-nav-link">
                <span className="partner-nav-icon">📖</span>
                <span>Bookings</span>
              </NavLink>
            </>
          )}

          <NavLink to="/partner/profile" className="partner-nav-link">
            <span className="partner-nav-icon">👤</span>
            <span>Profile</span>
          </NavLink>
          <NavLink to="/partner/analytics" className="partner-nav-link">
            <span className="partner-nav-icon">📊</span>
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/partner/staff" className="partner-nav-link">
            <span className="partner-nav-icon">👥</span>
            <span>Staff</span>
          </NavLink>
          <NavLink to="/partner/expenses" className="partner-nav-link">
            <span className="partner-nav-icon">💰</span>
            <span>Expenses</span>
          </NavLink>

          {/* Settings dropdown */}
          <button
            type="button"
            className={`partner-nav-link partner-nav-dropdown ${
              settingsOpen ? "partner-nav-open" : ""
            }`}
            onClick={() => setSettingsOpen((v) => !v)}
          >
            <span className="partner-nav-icon">⚙</span>
            <span>Settings</span>
            <span
              className={`partner-nav-caret ${settingsOpen ? "pt-open" : ""}`}
            >
              ▾
            </span>
          </button>

          {settingsOpen && (
            <div className="partner-subnav">
              <NavLink
                to="/partner/settings/edit-profile"
                className="partner-subnav-link"
              >
                ✏️ Edit Profile
              </NavLink>
              <NavLink
                to="/partner/settings/customer-care"
                className="partner-subnav-link"
              >
                🎧 Customer Care
              </NavLink>
              <NavLink
                to="/partner/settings/account-preferences"
                className="partner-subnav-link"
              >
                👤 Account Preferences
              </NavLink>
              <button
                type="button"
                className="partner-subnav-link partner-subnav-logout"
                onClick={() => setConfirmLogout(true)}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </nav>

        {isGuest && (
          <div className="partner-sidebar-guest">
            <span>Guest mode</span>
            <button onClick={() => openCompleteProfile()}>
              Complete Profile
            </button>
          </div>
        )}
      </aside>

      <main className="partner-main">
        <header className="partner-header">
          <span className="partner-header-name">
            Welcome, <strong>{displayName}</strong>
          </span>
          <PartnerNotificationBell />
        </header>

        {isGuest && (
          <div className="pt-guest-banner">
            <span>
              You're browsing as guest. Complete your profile to unlock all
              features.
            </span>
            <button onClick={() => openCompleteProfile()}>Complete Now</button>
          </div>
        )}

        <div className="partner-content">
          <Outlet />
        </div>
      </main>

      {/* Logout confirmation */}
      {confirmLogout && (
        <div
          className="partner-logout-overlay"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="partner-logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="partner-logout-actions">
              <button
                className="partner-logout-cancel"
                onClick={() => setConfirmLogout(false)}
              >
                Cancel
              </button>
              <button
                className="partner-logout-confirm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerLayout;