// src/components/user/layout/UserLayout.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../../../context/UserAuthContext';
import logo from '../../../asset/favicon.png';
import './UserLayout.css';

// ─── Navigation Items ──────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { label: 'Home', icon: 'house-fill', path: '/turfs' },
  { label: 'My Bookings', icon: 'calendar-event-fill', path: '/bookings' },
  { label: 'Dashboard', icon: 'person-circle', path: '/dashboard' },
  { label: 'Favorite Turfs', icon: 'heart-fill', path: '/favorites' },
  { label: 'Wallet', icon: 'wallet-fill', path: '/wallet' },
  { label: 'Wallet Transactions', icon: 'arrow-left-right', path: '/wallet/transactions' },
  { label: 'Coin History', icon: 'coin', path: '/coins/history' },
  { label: 'App Info', icon: 'info-circle', path: '/app-info' },
  { label: 'Privacy Policy', icon: 'shield-lock', path: '/privacy' },
  { label: 'Terms & Conditions', icon: 'file-text', path: '/terms' },
  { label: 'Manage Devices', icon: 'devices', path: '/devices' },
];

const BOTTOM_NAV_ITEMS = [
  { label: 'Home', icon: 'house-fill', path: '/turfs' },
  { label: 'Bookings', icon: 'calendar-event-fill', path: '/bookings' },
  { label: 'Dashboard', icon: 'person-circle', path: '/dashboard' },
];

// ─── Icon Component ──────────────────────────────────────────────────────
const Icon = ({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) => (
  <i className={`bi bi-${name} ${className}`} style={{ fontSize: size }} />
);

// ─── Main Component ──────────────────────────────────────────────────────
const UserLayout = () => {
  const { user, logout, walletBalance, gameCoins } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/turfs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="user-layout">
      {/* ─── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="user-layout__header">
        <div className="user-layout__header-inner">
          {/* Left: Logo + Hamburger */}
          <div className="user-layout__brand">
            <button
              type="button"
              className="user-layout__menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              <Icon name={sidebarOpen ? 'x-lg' : 'list'} size={24} />
            </button>
            <Link to="/turfs" className="user-layout__logo">
              <img src={logo} alt="BookYourTurf" height={36} width={36} />
              <span className="user-layout__logo-text">BookYourTurf</span>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <form className="user-layout__search" onSubmit={handleSearch}>
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Search turfs, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
                <i className="bi bi-x-circle-fill" />
              </button>
            )}
          </form>

          {/* Right: Actions */}
          <div className="user-layout__actions">
            {/* Quick Stats */}
            <div className="user-layout__quick-stats">
              <div className="user-layout__stat">
                <Icon name="wallet-fill" size={16} className="text-success" />
                <span>₹{walletBalance.toFixed(2)}</span>
              </div>
              <div className="user-layout__stat-divider" />
              <div className="user-layout__stat">
                <Icon name="coin" size={16} className="text-warning" />
                <span>{gameCoins}</span>
              </div>
            </div>

            {/* Location */}
            <button className="user-layout__location-btn">
              <Icon name="geo-alt-fill" size={16} className="text-success" />
              <span>Chennai</span>
              <Icon name="chevron-down" size={12} />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="user-layout__notif-btn"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <Icon name="bell" size={22} />
              <span className="user-layout__notif-badge">3</span>
            </button>

            {/* User Dropdown */}
            <div className="user-layout__user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="user-layout__user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                <div className="user-layout__avatar">
                  <span className="user-layout__avatar-text">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="user-layout__user-name">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <Icon name="chevron-down" size={12} className="text-muted" />
              </button>

              {dropdownOpen && (
                <div className="user-layout__dropdown" role="menu">
                  <div className="user-layout__dropdown-header">
                    <div className="user-layout__dropdown-avatar">
                      <span>{user?.name?.charAt(0) || 'U'}</span>
                    </div>
                    <div>
                      <div className="fw-bold">{user?.name}</div>
                      <small className="text-muted">{user?.email || user?.number}</small>
                    </div>
                  </div>
                  <hr className="my-2" />
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Icon name="person" size={18} /> Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Icon name="gear" size={18} /> Settings
                  </Link>
                  <hr className="my-2" />
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <Icon name="box-arrow-right" size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <div className="user-layout__body">
        {/* Sidebar */}
        <aside className={`user-layout__sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="user-layout__sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`user-layout__sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            ))}

            <hr className="my-3" />

            {/* Wallet Card */}
            <div className="user-layout__wallet-card">
              <div className="user-layout__wallet-card-header">
                <span>My Wallet</span>
              </div>
              <div className="user-layout__wallet-card-body">
                <div className="user-layout__wallet-balance">
                  <span className="user-layout__wallet-label">Balance</span>
                  <span className="user-layout__wallet-amount">₹{walletBalance.toFixed(2)}</span>
                </div>
                <div className="user-layout__wallet-coins">
                  <span className="user-layout__wallet-label">Game Coins</span>
                  <span className="user-layout__wallet-coin-value">{gameCoins}</span>
                </div>
              </div>
              <Link to="/wallet" className="user-layout__wallet-btn">
                Manage Wallet <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            {/* App Version */}
            <div className="user-layout__app-version">
              App version 2.0.0
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="user-layout__overlay"
            onClick={() => setSidebarOpen(false)}
            role="button"
            aria-label="Close sidebar"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSidebarOpen(false);
              }
            }}
          />
        )}

        {/* Main Content */}
        <main className="user-layout__main">
          <Outlet />
        </main>
      </div>

      {/* ─── Bottom Navigation (Mobile) ──────────────────────────────── */}
      <nav className="user-layout__bottom-nav" aria-label="Mobile bottom navigation">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`user-layout__bottom-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default UserLayout;