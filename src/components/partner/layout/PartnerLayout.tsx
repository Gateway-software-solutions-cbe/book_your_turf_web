
import React, { useEffect, useState } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useRegisterPartnerDevice();

  useEffect(() => {
    if (location.pathname.startsWith("/partner/settings")) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  // Close the mobile navigation when the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Close the menu when the viewport returns to desktop.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/partner/auth");
  };

  const displayName = partner?.name?.trim() || "Partner";

  const navItems = [
    {
      to: "/partner/dashboard",
      label: "Dashboard",
      icon: "▦",
    },
    {
      to: "/partner/venues",
      label: "My Venues",
      icon: "⌖",
    },
    ...(!isGuest
      ? [
          {
            to: "/partner/slots",
            label: "Slots",
            icon: "▣",},
          {
            to: "/partner/bookings",
            label: "Bookings",
            icon: "▤",
          },
        ]
      : []),
    {
      to: "/partner/profile",
      label: "Profile",
      icon: "♙",
    },
    {
      to: "/partner/analytics",
      label: "Analytics",
      icon: "▥",
    },
    {
      to: "/partner/staff",
      label: "Staff",
      icon: "♧",
    },
    {
      to: "/partner/expenses",
      label: "Expenses",
      icon: "₹",
    },
  ];

  return (
    <div className="partner-layout">
      {/* Mobile navigation backdrop */}
      {mobileNavOpen && (
        <button
          type="button"
          className="partner-mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`partner-sidebar ${
          mobileNavOpen ? "partner-sidebar-mobile-open" : ""
        }`}
      >
        {/* Brand */}
        {/* <div className="partner-brand">
          <NavLink
            to="/partner/dashboard"
            className="partner-brand-link"
            aria-label="BookYourTurf Partner Dashboard"
          >
            <img
              src="/src/asset/cp.jpeg"
              alt="BookYourTurf"
              className="partner-brand-logo"
            />
          </NavLink>

          <button
            type="button"
            className="partner-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            ×
          </button>
        </div> */}

        {/* Workspace identity */}
        <div className="partner-workspace">
          {/* <span className="partner-workspace-label">
            PARTNER WORKSPACE
          </span> */}

          <div className="partner-workspace-profile">
            <div className="partner-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="partner-workspace-info">
              <span className="partner-workspace-name">
                {displayName}
              </span>
              <span className="partner-workspace-role">
                {isGuest ? "Guest access" : "Turf partner"}
              </span>
            </div>

            <span className="partner-status-dot" title="Active" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="partner-nav" aria-label="Partner navigation">
          <span className="partner-nav-heading">MENU</span>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/partner/dashboard"}
              className={({ isActive }) =>
                `partner-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="partner-nav-icon" aria-hidden="true">
                {item.icon}
              </span>

              <span className="partner-nav-label">
                {item.label}
              </span>

              <span className="partner-nav-arrow" aria-hidden="true">
                ›
              </span>
            </NavLink>
          ))}

          {/* Settings */}
          <button
            type="button"
            className={`partner-nav-link partner-nav-dropdown ${
              settingsOpen ? "partner-nav-open" : ""
            } ${
              location.pathname.startsWith("/partner/settings")
                ? "partner-settings-active"
                : ""
            }`}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((value) => !value)}
          >
            <span className="partner-nav-icon" aria-hidden="true">
              ⚙
            </span>

            <span className="partner-nav-label">Settings</span>

            <span
              className={`partner-nav-caret ${
                settingsOpen ? "pt-open" : ""
              }`}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>

          {settingsOpen && (
            <div className="partner-subnav">
              <NavLink
                to="/partner/settings/edit-profile"
                className={({ isActive }) =>
                  `partner-subnav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="partner-subnav-bullet">↗</span>
                Edit Profile
              </NavLink>

              <NavLink
                to="/partner/settings/customer-care"
                className={({ isActive }) =>
                  `partner-subnav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="partner-subnav-bullet">♡</span>
                Customer Care
              </NavLink>

              <NavLink
                to="/partner/settings/account-preferences"
                className={({ isActive }) =>
                  `partner-subnav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="partner-subnav-bullet">⚙</span>
                Account Preferences
              </NavLink>

              <button
                type="button"
                className="partner-subnav-link partner-subnav-logout"
                onClick={() => setConfirmLogout(true)}
              >
                <span className="partner-subnav-bullet">↪</span>
                Logout
              </button>
            </div>
          )}
        </nav>

        {/* Guest account card */}
        {isGuest && (
          <div className="partner-sidebar-guest">
            <div className="partner-guest-icon">✦</div>

            <div className="partner-guest-copy">
              <strong>Unlock your workspace</strong>
              <span>Complete your profile to access partner features.</span>
            </div>

            <button
              type="button"
              onClick={() => openCompleteProfile()}
            >
              Complete Profile <span>→</span>
            </button>
          </div>
        )}

        {/* Sidebar footer */}
        <div className="partner-sidebar-footer">
          <span className="partner-footer-indicator" />
          <span>Made for the love of the game</span>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="partner-main">
        {/* Top header */}
        <header className="partner-header">
          <div className="partner-header-left">
            <button
              type="button"
              className="partner-menu-toggle"
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="partner-header-greeting">
              {/* <span className="partner-header-eyebrow">
                YOUR PARTNER WORKSPACE
              </span> */}

              <span className="partner-header-name">
                Welcome back,{" "}
                <strong>{displayName}</strong>
              </span>
            </div>
          </div>

          <div className="partner-header-right">
            <span className="partner-header-date-label">
              PLAY. MANAGE. GROW.
            </span>

            <div className="partner-notification-wrapper">
              <PartnerNotificationBell />
            </div>
          </div>
        </header>

        {/* Guest notification */}
        {isGuest && (
          <div className="pt-guest-banner">
            <div className="pt-guest-banner-content">
              <span className="pt-guest-banner-icon">✦</span>

              <div>
                <strong>You're browsing in guest mode</strong>
                <p>
                  Complete your profile to unlock bookings, slot
                  management, and more.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openCompleteProfile()}
            >
              Complete Now <span>→</span>
            </button>
          </div>
        )}

        {/* Route content */}
        <div className="partner-content">
          <Outlet />
        </div>
      </main>

      {/* Logout confirmation modal */}
      {confirmLogout && (
        <div
          className="partner-logout-overlay"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="partner-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="partner-logout-modal-icon">↗</div>

            <h3 id="partner-logout-title">Leaving the field?</h3>

            <p>
              Are you sure you want to sign out of your
              BookYourTurf partner account?
            </p>

            <div className="partner-logout-actions">
              <button
                type="button"
                className="partner-logout-cancel"
                onClick={() => setConfirmLogout(false)}
              >
                Stay here
              </button>

              <button
                type="button"
                className="partner-logout-confirm"
                onClick={handleLogout}
              >
                Yes, sign out <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerLayout;