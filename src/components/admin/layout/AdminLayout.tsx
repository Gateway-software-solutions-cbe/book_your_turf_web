// src/components/admin/layout/AdminLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// ─── AdminLayout ───────────────────────────────────────────────────────────────

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: sidebarOpen ? '260px' : '0',
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        {/* Top Navbar with Hamburger */}
        <nav className="navbar navbar-light bg-white shadow-sm px-3 py-2 flex-shrink-0" style={{ zIndex: 1020 }}>
          <div className="d-flex align-items-center gap-3 w-100">
            <button
              className="btn btn-light btn-sm border-0 p-2 d-flex align-items-center justify-content-center"
              onClick={toggleSidebar}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid #e5e7eb',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-dark">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Zm0 5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 14.75Z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex-grow-1">
              <h5 className="mb-0 fw-semibold text-truncate">
                {document.title || 'Book Your Turf'}
              </h5>
            </div>

            {/* Right side - can add user avatar, notifications, etc. */}
            {/* <div className="d-none d-md-flex align-items-center gap-2">
              <span className="badge bg-success rounded-pill px-3 py-2">
                <span className="d-inline-block rounded-circle bg-white me-1" style={{ width: '6px', height: '6px' }}></span>
                Live
              </span>
            </div> */}
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-grow-1 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;