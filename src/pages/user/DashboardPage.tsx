// src/pages/user/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useUserAuth } from '../../context/UserAuthContext';

// Icon components using Bootstrap Icons CSS classes
const Icon = ({ name, size = 28, className = '' }: { name: string; size?: number; className?: string }) => (
  <i className={`bi bi-${name} ${className}`} style={{ fontSize: size }} />
);

interface BookingPreview {
  id: number;
  turf_name: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  amount: string;
}

interface TransactionPreview {
  id: number;
  type: 'credit' | 'debit';
  amount: string;
  description: string;
  date: string;
}

interface StatCardProps {
  iconName: string;
  label: string;
  value: string | number;
  bg?: string;
  link?: string;
}

const StatCard = ({ iconName, label, value, bg = 'primary', link = '' }: StatCardProps) => (
  <div className={`col-6 col-md-3`}>
    <div className={`card border-0 shadow-sm h-100 bg-${bg} bg-opacity-10`}>
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="text-muted small">{label}</div>
            <div className="h4 mb-0 fw-bold">{value}</div>
          </div>
          <Icon name={iconName} size={28} className={`text-${bg}`} />
        </div>
        {link && (
          <Link to={link} className="stretched-link text-decoration-none">
            <span className="small">View details</span>
          </Link>
        )}
      </div>
    </div>
  </div>
);

// Status Badge component
interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'cancelled';
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = {
    confirmed: { className: 'bg-success', icon: 'check-circle-fill', label: 'Confirmed' },
    pending: { className: 'bg-warning text-dark', icon: 'clock-fill', label: 'Pending' },
    cancelled: { className: 'bg-danger', icon: 'x-circle-fill', label: 'Cancelled' },
  };

  const { className, icon, label } = config[status];

  return (
    <span className={`badge ${className}`}>
      <i className={`bi bi-${icon} me-1`} style={{ fontSize: '12px' }} />
      {label}
    </span>
  );
};

const DashboardPage = () => {
  const { user, walletBalance, gameCoins } = useUserAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<BookingPreview[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - replace with actual API integration
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In production, fetch from /api/user/dashboard/ or combine multiple endpoints
        // For now, use mock data
        setUpcomingBookings([
          {
            id: 1,
            turf_name: 'FF Turf, Chennai',
            date: '2026-08-15',
            time: '06:00 - 07:00',
            status: 'confirmed',
            amount: '₹650',
          },
          {
            id: 2,
            turf_name: 'Dusa Pickleball, Madurai',
            date: '2026-08-20',
            time: '18:00 - 19:00',
            status: 'pending',
            amount: '₹600',
          },
        ]);

        setRecentTransactions([
          {
            id: 1,
            type: 'credit',
            amount: '₹500',
            description: 'Wallet recharge via UPI',
            date: '2026-08-10',
          },
          {
            id: 2,
            type: 'debit',
            amount: '₹650',
            description: 'Booking payment - FF Turf',
            date: '2026-08-09',
          },
          {
            id: 3,
            type: 'credit',
            amount: '₹50',
            description: 'Referral bonus',
            date: '2026-08-08',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const activeBookings = upcomingBookings.filter((b) => b.status !== 'cancelled').length;

  return (
    <div className="container-fluid px-0">
      {/* Welcome Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
        <div>
          <h4 className="mb-1">Welcome back, {user?.name}!</h4>
          <p className="text-muted mb-0">Here's what's happening with your account</p>
        </div>
        <Link to="/bookings/new" className="btn btn-success rounded-pill mt-2 mt-md-0">
          <i className="bi bi-plus-circle me-1" /> Book a Turf
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <StatCard
          iconName="wallet-fill"
          label="Wallet Balance"
          value={`₹${walletBalance.toFixed(2)}`}
          bg="success"
          link="/wallet"
        />
        <StatCard
          iconName="coin"
          label="Game Coins"
          value={gameCoins}
          bg="warning"
        />
        <StatCard
          iconName="calendar-event-fill"
          label="Upcoming Bookings"
          value={activeBookings}
          bg="primary"
          link="/bookings"
        />
        <StatCard
          iconName="gift-fill"
          label="Referral Code"
          value={user?.referral_code || 'N/A'}
          bg="info"
        />
      </div>

      {/* Quick Actions */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <h6 className="mb-3">Quick Actions</h6>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/bookings/new" className="btn btn-outline-success rounded-pill">
              <i className="bi bi-search me-1" /> Find a Turf
            </Link>
            <Link to="/wallet/recharge" className="btn btn-outline-success rounded-pill">
              <i className="bi bi-plus-circle me-1" /> Add Funds
            </Link>
            <Link to="/profile" className="btn btn-outline-success rounded-pill">
              <i className="bi bi-person me-1" /> Edit Profile
            </Link>
            <Link to="/notifications" className="btn btn-outline-success rounded-pill">
              <i className="bi bi-bell me-1" /> Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings & Recent Transactions */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Upcoming Bookings</h6>
                <Link to="/bookings" className="text-success text-decoration-none small">
                  View all <i className="bi bi-arrow-right" style={{ fontSize: '14px' }} />
                </Link>
              </div>

              {upcomingBookings.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">
                  No upcoming bookings. <Link to="/bookings/new" className="text-success">Book now</Link>
                </p>
              ) : (
                upcomingBookings.map((booking) => (
                  <div key={booking.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <div className="fw-semibold small">{booking.turf_name}</div>
                      <div className="text-muted small">
                        {booking.date} · {booking.time}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold small">{booking.amount}</div>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Recent Transactions</h6>
                <Link to="/wallet" className="text-success text-decoration-none small">
                  View all <i className="bi bi-arrow-right" style={{ fontSize: '14px' }} />
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">No recent transactions.</p>
              ) : (
                recentTransactions.map((txn) => (
                  <div key={txn.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                      <div className="fw-semibold small">{txn.description}</div>
                      <div className="text-muted small">{txn.date}</div>
                    </div>
                    <div className={txn.type === 'credit' ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                      {txn.type === 'credit' ? '+' : '-'}{txn.amount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;   