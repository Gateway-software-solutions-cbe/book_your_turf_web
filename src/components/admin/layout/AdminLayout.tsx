// src/components/admin/layout/AdminLayout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  return (
    <div className="admin-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <div
        className={`admin-main ${
          sidebarOpen ? 'admin-main-sidebar-open' : ''
        }`}
      >
        <nav className="navbar navbar-light bg-white shadow-sm px-3 py-2 admin-navbar">
          <div className="d-flex align-items-center gap-3 w-100">
            <button
              type="button"
              className="btn btn-light btn-sm border-0 p-2 d-flex align-items-center justify-content-center admin-menu-button"
              onClick={toggleSidebar}
              aria-label={
                sidebarOpen ? 'Close sidebar' : 'Open sidebar'
              }
              aria-expanded={sidebarOpen}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-dark"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Zm0 5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 14.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="flex-grow-1 min-w-0">
              <h5 className="mb-0 fw-semibold text-truncate">
                {document.title || 'Book Your Turf'}
              </h5>
            </div>
          </div>
        </nav>

        <main className="admin-page-content">
          <div className="admin-page-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;