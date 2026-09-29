// src/components/admin/layout/Sidebar.tsx

import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getIconComponent } from './iconMapper';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { admin, sideNav, isLoading, logout, refreshSideNav } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Sidebar Debug:');
  console.log('- Admin:', admin);
  console.log('- SideNav:', sideNav);
  console.log('- IsLoading:', isLoading);
  console.log('- IsAuthenticated:', !!admin);
  console.log('- Current Path:', location.pathname);

  // Refresh sidebar on mount or when token changes
  useEffect(() => {
    if (admin) {
      console.log('Refreshing sidebar for admin:', admin.email);
      refreshSideNav();
    }
  }, [admin, refreshSideNav]);

  const handleLogout = () => {
    logout();
  };

  // Check if current path is accessible
  const isPathAccessible = (path: string): boolean => {
    // Welcome page is accessible after login,
    // but it should NOT activate any sidebar item.
    if (location.pathname === '/welcome') {
      return true;
    }

    return sideNav.some((item) => {
      return (
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + '/')
      );
    });
  };

  // Redirect if current path is not in sidebar
  useEffect(() => {
    // Do not redirect on welcome page
    if (location.pathname === '/welcome') {
      return;
    }

    if (
      !isLoading &&
      sideNav.length > 0 &&
      !isPathAccessible(location.pathname)
    ) {
      // Redirect to first accessible route
      navigate(sideNav[0].path, { replace: true });
    }
  }, [location.pathname, sideNav, isLoading, navigate]);

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <aside
        className="position-fixed top-0 start-0 bottom-0 d-flex flex-column align-items-center justify-content-center bg-dark text-white"
        style={{
          width: '260px',
          zIndex: 1040,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
        }}
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </aside>
    );
  }

  // ─── Empty Sidebar State ────────────────────────────────────────────────────

  if (sideNav.length === 0) {
    return (
      <aside
        className="position-fixed top-0 start-0 bottom-0 d-flex flex-column align-items-center justify-content-center bg-dark text-white"
        style={{
          width: '260px',
          zIndex: 1040,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
        }}
      >
        <div className="text-center p-4">
          <div className="text-muted small mb-3">No menu access</div>

          <button
            className="btn btn-danger btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>
    );
  }

  // ─── Sidebar ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="d-block d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1039,
          }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className="position-fixed top-0 start-0 bottom-0 d-flex flex-column bg-dark text-white"
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
          style={{
            right: '8px',
            top: '8px',
            background: 'transparent',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 1 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 1 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Admin Profile */}
        <div
          className="d-flex align-items-center gap-2 mx-3 my-2 p-2 rounded-3 flex-shrink-0"
          onClick={()=>navigate('/welcome')}
          style={{
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
          }}
        >
          <div
            className="rounded-circle bg-success d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{
              width: '32px',
              height: '32px',
              fontSize: '13px',
            }}
          >
            {admin?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>

          <div className="flex-grow-1 min-w-0">
            <div className="small fw-semibold text-white text-truncate">
              {admin?.name ?? 'Admin'}
            </div>

            {/* <div className="d-flex align-items-center gap-1">
              <span
                className="d-inline-block rounded-circle bg-success"
                style={{
                  width: '5px',
                  height: '5px',
                }}
              />

              <span className="small text-white-50 text-capitalize" style={{ fontSize: '11px' }}>
        {admin?.role?.toLowerCase() === 'super_admin' ? 'Super Admin' : 
         admin?.role?.toLowerCase() === 'cpadmin' ? 'CP Admin' :
         admin?.role?.toLowerCase() === 'accounts' ? 'Accounts' :
         admin?.role?.toLowerCase() === 'userbooking' ? 'Booking Manager' :
         admin?.role || 'Admin'}
      </span>
            </div> */}
          </div>
        </div>

        {/* Navigation - Dynamic from API */}
        <div
          className="flex-grow-1 overflow-y-auto px-2 py-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor:
              'rgba(255,255,255,0.1) transparent',
          }}
        >
          <ul className="nav nav-pills flex-column gap-0.5">
            {sideNav.map((item) => {
              const iconComponent = getIconComponent(item.icon);

              // Dashboard should only be active on exactly /admin.
              // NavLink's `end` handles this for us.
              const isDashboard = item.path === '/admin';

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={isDashboard}
                    className={({ isActive }) => {
                      return `nav-link d-flex align-items-center gap-2 rounded-3 px-3 py-2 text-white ${
                        isActive
                          ? 'active bg-success text-white'
                          : 'text-white-50'
                      }`;
                    }}
                    style={{
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.classList.contains('active')) {
                        e.currentTarget.style.backgroundColor =
                          'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.classList.contains('active')) {
                        e.currentTarget.style.backgroundColor =
                          'transparent';
                        e.currentTarget.style.color = '';
                      }
                    }}
                    onClick={() => {
                      if (window.innerWidth < 992) {
                        onToggle();
                      }
                    }}
                  >
                    {/* Icon */}
                    <span
                      className="flex-shrink-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: '20px',
                        height: '20px',
                      }}
                    >
                      {iconComponent}
                    </span>

                    {/* Title */}
                    <span className="flex-grow-1 small fw-medium">
                      {item.title}
                    </span>

                    {/* Active Indicator */}
                    <span
                      className="d-inline-block rounded-circle bg-white"
                      style={{
                        width: '4px',
                        height: '4px',
                        flexShrink: 0,
                        opacity: 0,
                      }}
                    />
                  </NavLink>
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
              e.currentTarget.style.background =
                'rgba(251, 56, 75, 0.73)';
              e.currentTarget.style.borderColor =
                'rgba(251, 56, 75, 0.73)';
            }}
          >
            <span
              style={{
                width: '18px',
                height: '18px',
                marginTop: '-5px',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Zm9.47 4.22a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97H6.75a.75.75 0 0 1 0-1.5h6.69l-.97-.97a.75.75 0 0 1-1.06-1.06l.97-.97a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>

            <span className="small fw-medium">
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;