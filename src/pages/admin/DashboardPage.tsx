// src/pages/admin/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import type { DashboardStats } from '../../types/dashboard';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (val: string) => {
  const num = parseFloat(val || '0');
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(2)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(2)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const formatNumber = (n: number) => (n ?? 0).toLocaleString('en-IN');

// ─── Stat Card Component ─────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'purple' | 'teal' | 'orange' | 'rose';
  delay?: number;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  sub, 
  color = 'blue', 
  delay = 0,
  onClick 
}) => {
  const colorMap = {
    blue: { bg: 'bg-primary bg-opacity-10', border: 'border-primary', icon: 'text-primary', val: 'text-primary', shadow: 'shadow-primary' },
    green: { bg: 'bg-success bg-opacity-10', border: 'border-success', icon: 'text-success', val: 'text-success', shadow: 'shadow-success' },
    purple: { bg: 'bg-purple bg-opacity-10', border: 'border-purple', icon: 'text-purple', val: 'text-purple', shadow: 'shadow-purple' },
    teal: { bg: 'bg-teal bg-opacity-10', border: 'border-teal', icon: 'text-teal', val: 'text-teal', shadow: 'shadow-teal' },
    orange: { bg: 'bg-orange bg-opacity-10', border: 'border-orange', icon: 'text-orange', val: 'text-orange', shadow: 'shadow-orange' },
    rose: { bg: 'bg-rose bg-opacity-10', border: 'border-rose', icon: 'text-rose', val: 'text-rose', shadow: 'shadow-rose' },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`card shadow-sm h-100 border ${c.border} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      }}
      onClick={onClick}
    >
      <div className={`card-body ${c.bg} rounded-3`}>
        <div className="d-flex align-items-center gap-3">
          <div className={`fs-1 ${c.icon} d-flex align-items-center justify-content-center`}>
            <i className={`bi bi-${icon}`}></i>
          </div>
          <div className="flex-grow-1 min-w-0">
            <div className={`fs-2 fw-bold ${c.val} count-up`}>{value}</div>
            <div className="small fw-semibold text-secondary">{label}</div>
            {sub && <div className="small text-secondary mt-1">{sub}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Revenue Card Component ─────────────────────────────────────────────────

interface RevenueCardProps {
  label: string;
  value: string;
  icon: string;
  sub?: string;
  variant?: 'default' | 'coins';
  delay?: number;
}

const RevenueCard: React.FC<RevenueCardProps> = ({ 
  label, 
  value, 
  icon, 
  sub, 
  variant = 'default',
  delay = 0 
}) => {
  if (variant === 'coins') {
    return (
      <div 
        className="card shadow-sm h-100 border-0"
        style={{ 
          background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
          animation: `fadeInUp 0.6s ease-out ${delay}s both`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        }}
      >
        <div className="card-body text-center">
          <div className="fs-1 mb-2">
            <i className={`bi bi-${icon} text-warning`}></i>
          </div>
          <div className="fs-2 fw-bold text-warning count-up">{formatNumber(parseInt(value) || 0)}</div>
          <div className="small fw-semibold text-secondary">{label}</div>
          {sub && <div className="small text-secondary mt-1">{sub}</div>}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card shadow-sm h-100"
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      }}
    >
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="fs-5"><i className={`bi bi-${icon} text-success`}></i></span>
          <span className="small fw-semibold text-uppercase text-secondary">{label}</span>
        </div>
        <div className="fs-3 fw-bold text-success count-up">{formatCurrency(value)}</div>
        <div className="small text-secondary">
          ₹{parseFloat(value || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        {sub && <div className="small text-secondary mt-2 border-top pt-2">{sub}</div>}
      </div>
    </div>
  );
};

// ─── Quick Action Button ────────────────────────────────────────────────────

interface QuickActionProps {
  icon: string;
  label: string;
  path: string;
  delay: number;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, path, delay, onClick }) => (
  <button
    className="btn d-flex flex-column align-items-center justify-content-center gap-2 p-3 h-100 w-100 border"
    onClick={onClick}
    style={{
      background: 'white',
      borderColor: '#e5e7eb',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      animation: `fadeInUp 0.6s ease-out ${delay}s both`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#198754';
      e.currentTarget.style.background = '#f0fdf4';
      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(25, 135, 84, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#e5e7eb';
      e.currentTarget.style.background = 'white';
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <span className="fs-2 text-success"><i className={`bi bi-${icon}`}></i></span>
    <span className="small fw-semibold text-secondary">{label}</span>
  </button>
);

// ─── DashboardPage ─────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to load dashboard stats.';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // Custom styles for animations and colors
  const styles = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .text-purple { color: #7c3aed; }
    .text-teal { color: #0d9488; }
    .text-orange { color: #ea580c; }
    .text-rose { color: #e11d48; }
    
    .bg-purple { background-color: #7c3aed; }
    .bg-teal { background-color: #0d9488; }
    .bg-orange { background-color: #ea580c; }
    .bg-rose { background-color: #e11d48; }
    
    .border-purple { border-color: #7c3aed !important; }
    .border-teal { border-color: #0d9488 !important; }
    .border-orange { border-color: #ea580c !important; }
    .border-rose { border-color: #e11d48 !important; }
    
    .bg-purple.bg-opacity-10 { background-color: rgba(124, 58, 237, 0.1); }
    .bg-teal.bg-opacity-10 { background-color: rgba(13, 148, 136, 0.1); }
    .bg-orange.bg-opacity-10 { background-color: rgba(234, 88, 12, 0.1); }
    .bg-rose.bg-opacity-10 { background-color: rgba(225, 29, 72, 0.1); }
    
    .shadow-purple { box-shadow: 0 4px 14px rgba(124, 58, 237, 0.15); }
    .shadow-teal { box-shadow: 0 4px 14px rgba(13, 148, 136, 0.15); }
    .shadow-orange { box-shadow: 0 4px 14px rgba(234, 88, 12, 0.15); }
    .shadow-rose { box-shadow: 0 4px 14px rgba(225, 29, 72, 0.15); }
    
    .cursor-pointer { cursor: pointer; }
    
    .count-up {
      animation: pulse 2s ease-in-out infinite;
    }
  `;

  return (
    <div className="container-fluid px-4 py-4">
      <style>{styles}</style>

      {/* Welcome header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            {greeting}, {admin?.name?.split(' ')[0] ?? 'Admin'} 👋
          </h1>
          <p className="text-secondary mb-0" style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
            Here's what's happening on BookYourTurf today.
          </p>
        </div>
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <span className="badge bg-success rounded-pill px-3 py-2">
            <span className="d-inline-block rounded-circle bg-white me-1" style={{ width: '6px', height: '6px' }}></span>
            {admin?.role ?? 'Admin'}
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary">Loading dashboard…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <span>{error}</span>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              getDashboardStats()
                .then(setStats)
                .catch(() => setError('Failed to load dashboard.'))
                .finally(() => setIsLoading(false));
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && !isLoading && (
        <>
          {/* ── Row 1: Users & Partners ────────────────────────────────────── */}
          <h6 className="text-uppercase text-secondary fw-bold small mb-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
            <i className="bi bi-people me-1"></i> Users & Partners
          </h6>
          <div className="row g-3 mb-4">
            <div className="col-xl-3 col-lg-6 col-md-6">
              <StatCard
                icon="people"
                label="Total Users"
                value={formatNumber(stats.total_users)}
                sub={`${formatNumber(stats.active_users)} active`}
                color="blue"
                delay={0.1}
                onClick={() => navigate('/admin/users')}
              />
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <StatCard
                icon="check-circle"
                label="Active Users"
                value={formatNumber(stats.active_users)}
                sub={`of ${formatNumber(stats.total_users)} total`}
                color="green"
                delay={0.2}
                onClick={() => navigate('/admin/users')}
              />
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <StatCard
                icon="handshake"
                label="Total Partners"
                value={formatNumber(stats.total_partners)}
                sub={`${formatNumber(stats.active_partners)} active`}
                color="purple"
                delay={0.3}
                onClick={() => navigate('/admin/partners')}
              />
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <StatCard
                icon="building"
                label="Active Partners"
                value={formatNumber(stats.active_partners)}
                sub={`of ${formatNumber(stats.total_partners)} total`}
                color="teal"
                delay={0.4}
                onClick={() => navigate('/admin/partners')}
              />
            </div>
          </div>

          {/* ── Row 2: Revenue & Holdings ──────────────────────────────────── */}
          <h6 className="text-uppercase text-secondary fw-bold small mb-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}>
            <i className="bi bi-cash-stack me-1"></i> Revenue & Holdings
          </h6>
          <div className="row g-3 mb-4">
            <div className="col-xl-3 col-lg-6 col-md-6">
              <RevenueCard
                icon="credit-card"
                label="All-time Razorpay Revenue"
                value={stats.razorpay_revenue_all}
                sub="Total collected via Razorpay"
                delay={0.1}
              />
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <RevenueCard
                icon="calendar-date"
                label="This Month's Revenue"
                value={stats.razorpay_revenue_month}
                sub="Razorpay revenue for current month"
                delay={0.2}
              />
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <RevenueCard
                icon="wallet"
                label="Wallet Holdings"
                value={stats.wallet_holdings}
                sub="Total balance held in user wallets"
                delay={0.3}
              />
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <RevenueCard
                icon="coin"
                label="Game Coin Holdings"
                value={stats.game_coin_holdings.toString()}
                sub="Total coins held by users"
                variant="coins"
                delay={0.4}
              />
            </div>
          </div>

          {/* ── Row 3: Quick Actions ───────────────────────────────────────── */}
          <h6 className="text-uppercase text-secondary fw-bold small mb-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.7s both' }}>
            <i className="bi bi-lightning-charge me-1"></i> Quick Actions
          </h6>
          <div className="row g-3">
            {[
              { icon: 'person-plus', label: 'Add Partner', path: '/admin/partners/new' },
              { icon: 'plus-circle', label: 'Add Turf', path: '/admin/turfs/new' },
              { icon: 'plus-square', label: 'Add Mock Turf', path: '/admin/mock-turfs/new' },
              { icon: 'send', label: 'Send Notification', path: '/admin/notifications' },
              { icon: 'gear', label: 'Game Coin Settings', path: '/admin/settings' },
              { icon: 'arrow-repeat', label: 'Bulk Update Turfs', path: '/admin/settings' },
            ].map((action, index) => (
              <div key={action.path} className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                <QuickAction
                  icon={action.icon}
                  label={action.label}
                  path={action.path}
                  delay={0.1 * (index + 1)}
                  onClick={() => navigate(action.path)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;