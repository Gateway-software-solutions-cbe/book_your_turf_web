// src/components/admin/layout/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NavLeaf {
  type: 'leaf';
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavGroup {
  type: 'group';
  label: string;
  icon: React.ReactNode;
  children: { label: string; path: string }[];
}

type NavItem = NavLeaf | NavGroup;

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────────

const Icon = {
  Dashboard: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10Zm8-3a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2H10Zm-4 6a1 1 0 0 0 1 1h6a1 1 0 0 0 0-2H7a1 1 0 0 0-1 1Z"/>
    </svg>
  ),
  Users: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.808A7.47 7.47 0 0 1 14.5 16Z"/>
    </svg>
  ),
  Partners: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6A3 3 0 1 1 7 6a3 3 0 0 1 6 0ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM15.22 15.126A3.001 3.001 0 0 0 12 13H8a3 3 0 0 0-3.22 2.126 8.994 8.994 0 0 0 10.44 0ZM19.078 14.123A5.01 5.01 0 0 0 15 12a4.98 4.98 0 0 0-1.952.393A5.012 5.012 0 0 1 15.172 17H19a1 1 0 0 0 .914-1.406 5.01 5.01 0 0 0-.836-1.471ZM4.952 12.392A5.01 5.01 0 0 0 1 17a1 1 0 0 0 .914 1.406h3.828a5.012 5.012 0 0 1 2.124-4.607A4.98 4.98 0 0 0 6 13a5.01 5.01 0 0 0-1.048.392Z"/>
    </svg>
  ),
  Turfs: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.674 2.075a.75.75 0 0 1 .652 0l7.25 3.5A.75.75 0 0 1 17 6.957V16.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.957a.75.75 0 0 1-.576-.382l7.25-3.5ZM11 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd"/>
    </svg>
  ),
  Bookings: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd"/>
    </svg>
  ),
  Transactions: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 0 0-2 2v1h16V6a2 2 0 0 0-2-2H4Z"/>
      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM4 13a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm5-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H9Z" clipRule="evenodd"/>
    </svg>
  ),
  Discounts: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5.25 2A2.25 2.25 0 0 0 3 4.25v11.5C3 17.216 4.784 19 6.75 19h6.5c1.966 0 3.75-1.784 3.75-3.75V4.25C17 2.784 15.216 1 13.25 1h-6.5Zm-.75 4a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm2.5-.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 .102 1.493l-.102.007h-6a.75.75 0 0 1-.75-.75Zm-.75 4a.75.75 0 0 1 .102-1.493l.098-.007h6a.75.75 0 0 1 .102 1.493l-.102.007h-6Zm-.102-4A2.25 2.25 0 0 0 4.25 4v11c0 .966.784 1.75 1.75 1.75h6c.966-.001 1.749-.785 1.749-1.751V4c0-1.242-1-2-2-2h-6Z"/>
    </svg>
  ),
  Analytics: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM10.5 6A1.5 1.5 0 0 0 9 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 10.5 6ZM5.5 10A1.5 1.5 0 0 0 4 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 5.5 10Z"/>
    </svg>
  ),
  Counts: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .572.729 6.016 6.016 0 0 0 2.856 0A.75.75 0 0 0 12 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM8.863 17.414a.75.75 0 0 0-.226 1.483 9.066 9.066 0 0 0 2.726 0 .75.75 0 0 0-.226-1.483 7.553 7.553 0 0 1-2.274 0Z"/>
    </svg>
  ),
  Notifications: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6Zm3.707 9.293a1 1 0 0 1-1.414 1.414L12.586 12H7.414l-.707.707a1 1 0 0 1-1.414-1.414L5.586 11H14.414l-.707-.707ZM10 18a2.5 2.5 0 0 0-2.45-2h4.9A2.5 2.5 0 0 0 10 18Z"/>
    </svg>
  ),
  AppVersion: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 1a9 9 0 1 0 9 9A9.01 9.01 0 0 0 10 1Zm3.5 10a3.5 3.5 0 1 1-7 0v-.25a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 .75.75V11Zm-6-2v2a2.5 2.5 0 1 0 5 0v-2h-5Z" clipRule="evenodd"/>
    </svg>
  ),
  Settings: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .205 1.251l-1.18 2.044a1 1 0 0 1-1.186.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.205-1.251l1.18-2.044a1 1 0 0 1 1.186-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd"/>
    </svg>
  ),
  Logout: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Zm9.47 4.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H6.75a.75.75 0 0 1 0-1.5h6.69l-.97-.97a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
    </svg>
  ),
  Chevron: (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd"/>
    </svg>
  ),
  Close: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" clipRule="evenodd"/>
    </svg>
  ),
};

// ─── Nav Config ─────────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  {
    type: 'leaf',
    label: 'Dashboard',
    path: '/admin',
    icon: Icon.Dashboard,
  },
  {
    type: 'group',
    label: 'Users',
    icon: Icon.Users,
    children: [
      { label: 'All Users', path: '/admin/users' },
      { label: 'Add User', path: '/admin/users/new' },
    ],
  },
  {
    type: 'group',
    label: 'Channel Partners',
    icon: Icon.Partners,
    children: [
      { label: 'All Partners', path: '/admin/partners' },
      { label: 'Add Partner', path: '/admin/partners/new' },
    ],
  },
  {
    type: 'leaf',
    label: 'All Turfs',
    path: '/admin/turfs',
    icon: Icon.Turfs,
  },
  {
    type: 'leaf',
    label: 'Mock Turfs',
    path: '/admin/mock-turfs',
    icon: Icon.Turfs,
  },
  {
    type: 'leaf',
    label: 'Bookings',
    path: '/admin/bookings',
    icon: Icon.Bookings,
  },
  {
    type: 'leaf',
    label: 'Transactions',
    path: '/admin/transactions',
    icon: Icon.Transactions,
  },
  {
    type: 'leaf',
    label: 'Discounts',
    path: '/admin/discounts',
    icon: Icon.Discounts,
  },
  {
    type: 'leaf',
    label: 'Analytics',
    path: '/admin/analytics',
    icon: Icon.Analytics,
  },
  {
    type: 'leaf',
    label: 'Active Counts Summary',
    path: '/admin/counts-summary',
    icon: Icon.Counts,
  },
  {
    type: 'leaf',
    label: 'Notifications',
    path: '/admin/notifications',
    icon: Icon.Notifications,
  },
  {
    type: 'leaf',
    label: 'App Version',
    path: '/admin/appversion',
    icon: Icon.AppVersion,
  },
  {
    type: 'leaf',
    label: 'Settings',
    path: '/admin/settings',
    icon: Icon.Settings,
  },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    NAV.forEach((item) => {
      if (item.type === 'group') {
        const isChildActive = item.children.some((c) =>
          location.pathname.startsWith(c.path)
        );
        if (isChildActive) initial.add(item.label);
      }
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Hover style for nav items
  const navHoverStyle = {
    transition: 'all 0.15s ease',
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="d-block d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1039 }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`position-fixed top-0 start-0 bottom-0 d-flex flex-column bg-dark text-white`}
        style={{
          width: '260px',
          zIndex: 1040,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
        }}
      >
        {/* Close button (mobile) */}
        <button
          className="d-lg-none position-absolute top-0 end-0 btn text-white p-2 border-0"
          onClick={onToggle}
          style={{ right: '8px', top: '8px', background: 'transparent' }}
        >
          {Icon.Close}
        </button>

        {/* Brand */}
        {/* <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom border-secondary flex-shrink-0">
          <div className="bg-success bg-gradient rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: '38px', height: '38px', fontSize: '18px' }}>
            ⚽
          </div>
          <div className="min-w-0">
            <div className="fw-bold fs-6 text-white lh-1">BookYourTurf</div>
            <div className="small text-white-50" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Admin Panel</div>
          </div>
        </div> */}

        {/* Admin Profile */}
        <div className="d-flex align-items-center gap-2 mx-3 my-2 p-2 rounded-3 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="rounded-circle bg-success d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
            {admin?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="flex-grow-1 min-w-0">
            <div className="small fw-semibold text-white text-truncate">{admin?.name ?? 'Admin'}</div>
            <div className="d-flex align-items-center gap-1">
              <span className="d-inline-block rounded-circle bg-success" style={{ width: '5px', height: '5px' }}></span>
              <span className="small text-white-50 text-capitalize" style={{ fontSize: '11px' }}>{admin?.role ?? 'Admin'}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-grow-1 overflow-y-auto px-2 py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          <ul className="nav nav-pills flex-column gap-0.5">
            {NAV.map((item) => {
              if (item.type === 'leaf') {
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) =>
                        `nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-white ${
                          isActive
                            ? 'active bg-success text-white'
                            : 'text-white-50'
                        }`
                      }
                      style={navHoverStyle}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '';
                        }
                      }}
                      onClick={() => {
                        if (window.innerWidth < 992) onToggle();
                      }}
                    >
                      <span className="flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }}>
                        {item.icon}
                      </span>
                      <span className="flex-grow-1 small fw-medium">{item.label}</span>
                      {location.pathname === item.path && (
                        <span className="d-inline-block rounded-circle bg-white" style={{ width: '4px', height: '4px', flexShrink: 0 }}></span>
                      )}
                    </NavLink>
                  </li>
                );
              }

              const isOpenGroup = openGroups.has(item.label);
              const isGroupActive = item.children.some((c) =>
                location.pathname.startsWith(c.path)
              );

              return (
                <li key={item.label}>
                  <button
                    className={`btn d-flex align-items-center gap-2 w-100 rounded-3 px-3 py-2 text-start text-white ${
                      isGroupActive
                        ? 'bg-success bg-opacity-15 text-white'
                        : 'text-white-50'
                    }`}
                    onClick={() => toggleGroup(item.label)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.classList.contains('bg-success')) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.classList.contains('bg-success')) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '';
                      }
                    }}
                  >
                    <span className="flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }}>
                      {item.icon}
                    </span>
                    <span className="flex-grow-1 small fw-medium text-start">{item.label}</span>
                    <span
                      className="d-inline-block flex-shrink-0"
                      style={{
                        transform: isOpenGroup ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      {Icon.Chevron}
                    </span>
                  </button>
                  <div
                    className="overflow-hidden"
                    style={{
                      maxHeight: isOpenGroup ? '200px' : '0',
                      opacity: isOpenGroup ? 1 : 0,
                      transition: 'max-height 0.25s ease, opacity 0.25s ease',
                    }}
                  >
                    <ul className="nav flex-column ps-3 mt-0.5 border-start border-secondary ms-2">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `nav-link py-1 px-3 small rounded-2 text-white ${
                                isActive
                                  ? 'text-success fw-semibold bg-success bg-opacity-10'
                                  : 'text-white-50'
                              }`
                            }
                            style={navHoverStyle}
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.classList.contains('bg-success')) {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#ffffff';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!e.currentTarget.classList.contains('bg-success')) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '';
                              }
                            }}
                            onClick={() => {
                              if (window.innerWidth < 992) onToggle();
                            }}
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Logout */}
        <div className="px-2 py-2 border-top border-secondary flex-shrink-0">
          <button
            className="btn w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 py-2 text-white"
            onClick={handleLogout}
            style={{
              background: 'rgba(251, 56, 75, 0.73)',
              color: '#fffdfd',
              border: '1px solid rgba(251, 56, 75, 0.73)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgb(255, 0, 25)';
              e.currentTarget.style.borderColor = 'rgb(255, 0, 25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(251, 56, 75, 0.73)';
              e.currentTarget.style.borderColor = 'rgba(251, 56, 75, 0.73)';
            }}
          >
            <span style={{ width: '18px', height: '18px', marginTop: "-5px" }}>{Icon.Logout}</span>
            <span className="small fw-medium">Logout</span>
          </button>
        </div>

        {/* Version */}
        {/* <div className="text-center text-white-50 py-1 flex-shrink-0" style={{ fontSize: '9px', letterSpacing: '1px' }}>
          v2.0.0
        </div> */}
      </aside>
    </>
  );
};

export default Sidebar;