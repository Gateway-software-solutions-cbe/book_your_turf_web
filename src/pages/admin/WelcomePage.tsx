// src/pages/admin/WelcomePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Email to Role Mapping ────────────────────────────────────────────────────

const EMAIL_ROLE_MAP: Record<string, string> = {
  'bytsuperadmin@gmail.com': 'super_admin',
  'bytcpadmin@gmail.com': 'cpadmin',
  'bytuserbooking@gmail.com': 'userbooking',
  'bytaccounts@gmail.com': 'accounts'
};

// ─── Role Configurations ──────────────────────────────────────────────────────

interface RoleConfig {
  displayName: string;
  description: string;
  quickActions: string[]; // Titles of quick actions this role can see
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  super_admin: {
    displayName: 'Super Admin',
    description: 'You have full access to all modules and settings.',
    quickActions: [
      'Dashboard',
      'Manage Users',
      'Partners',
      'Bookings',
      'Settings',
      'Discounts',
      'Admin Registration',
      'Enquiries',
      'Notifications',
      'Transactions',
      'Analytics',
      'Counts Summary',
      'Referrals',
      'Mock Turfs'
    ]
  },
  admin: {
    displayName: 'Admin',
    description: 'You can manage users, partners, and content.',
    quickActions: [
      'Dashboard',
      'Manage Users',
      'Partners',
      'Bookings',
      'Settings',
      'Discounts',
      'Enquiries',
      'Notifications',
      'Transactions',
      'Analytics',
      'Counts Summary',
      'Referrals',
      'Mock Turfs'
    ]
  },
  cpadmin: {
    displayName: 'Channel Partner Admin',
    description: 'You can generate reports, invoices, and manage partners.',
    quickActions: [
      'Partners',
      'Revenue Reports',
      'Bank Settlement',
      'Turf Invoices'
    ]
  },
  accounts: {
    displayName: 'Accounts Manager',
    description: 'You can view completed revenue and generate settlement reports.',
    quickActions: [
      'Revenue Reports',
      'Bank Settlement',
      'Turf Invoices'
    ]
  },
  userbooking: {
    displayName: 'Booking Manager',
    description: 'You can view and manage all bookings.',
    quickActions: [
      'Bookings'
    ]
  }
};

// ─── All Available Quick Actions ─────────────────────────────────────────────

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  path: string;
}

const ALL_QUICK_ACTIONS: QuickAction[] = [
  {
    icon: 'bi-graph-up',
    title: 'Dashboard',
    description: 'View analytics and metrics',
    path: '/admin'
  },
  {
    icon: 'bi-people',
    title: 'Manage Users',
    description: 'View and manage users',
    path: '/admin/users'
  },
  {
    icon: 'bi-building',
    title: 'Partners',
    description: 'Manage channel partners',
    path: '/admin/partners'
  },
  {
    icon: 'bi-calendar-check',
    title: 'Bookings',
    description: 'View all bookings',
    path: '/admin/bookings'
  },
  {
    icon: 'bi-cash-stack',
    title: 'Revenue Reports',
    description: 'Generate revenue reports',
    path: '/admin/reports'
  },
  {
    icon: 'bi-file-spreadsheet',
    title: 'Bank Settlement',
    description: 'Excel reports for settlements',
    path: '/admin/settlement'
  },
  {
    icon: 'bi-receipt',
    title: 'Turf Invoices',
    description: 'Generate turf-wise invoices',
    path: '/admin/turf-invoices'
  },
  {
    icon: 'bi-gear',
    title: 'Settings',
    description: 'Configure your preferences',
    path: '/admin/settings'
  },
  {
    icon: 'bi-tags',
    title: 'Discounts',
    description: 'Manage discounts & offers',
    path: '/admin/discounts'
  },
  {
    icon: 'bi-people-fill',
    title: 'Admin Registration',
    description: 'Add new admin users',
    path: '/admin/admins/register'
  },
  {
    icon: 'bi-envelope',
    title: 'Enquiries',
    description: 'View and manage enquiries',
    path: '/admin/enquiries'
  },
  {
    icon: 'bi-bell',
    title: 'Notifications',
    description: 'Send and manage notifications',
    path: '/admin/notifications'
  },
  {
    icon: 'bi-currency-dollar',
    title: 'Transactions',
    description: 'View all transactions',
    path: '/admin/transactions'
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Analytics',
    description: 'Advanced analytics',
    path: '/admin/analytics'
  },
  {
    icon: 'bi-grid-3x3-gap-fill',
    title: 'Counts Summary',
    description: 'View active counts summary',
    path: '/admin/counts-summary'
  },
  {
    icon: 'bi-clipboard-data',
    title: 'Referrals',
    description: 'View user referrals',
    path: '/admin/users/referrals'
  },
  {
    icon: 'bi-file-earmark-text',
    title: 'Mock Turfs',
    description: 'Manage mock turfs',
    path: '/admin/mock-turfs'
  }
];

// ─── Stat Interface ──────────────────────────────────────────────────────────

interface StatItem {
  icon: string;
  label: string;
  value: string | number;
  loading?: boolean;
}

// ─── WelcomePage ───────────────────────────────────────────────────────────────

const WelcomePage: React.FC = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  
  // State for dynamic stats
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get user email and role
  const userEmail = admin?.email?.toLowerCase() || '';
  
  const getRoleFromEmail = (email: string): string => {
    for (const [emailPattern, role] of Object.entries(EMAIL_ROLE_MAP)) {
      if (email.includes(emailPattern) || email === emailPattern) {
        return role;
      }
    }
    return 'super_admin';
  };
  
  const userRole = getRoleFromEmail(userEmail);
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.super_admin;

  // ─── Generate Demo Data (Replace with API calls when ready) ──────────────

  const generateDemoStats = (role: string): StatItem[] => {
    // Randomize values slightly for demo purposes
    const random = (min: number, max: number) => 
      Math.floor(Math.random() * (max - min + 1)) + min;
    
    const formatCurrency = (amount: number) => 
      `₹${amount.toLocaleString('en-IN')}`;

    switch (role) {
      case 'super_admin':
      case 'admin':
        return [
          { icon: 'bi-people', label: 'Total Users', value: random(2, 150) },
          { icon: 'bi-building', label: 'Total Partners', value: random(10, 50) },
          { icon: 'bi-calendar-check', label: 'Total Bookings', value: random(100, 500) },
          { icon: 'bi-cash-stack', label: 'Revenue', value: formatCurrency(random(10000, 50000)) }
        ];
      
      case 'cpadmin':
        return [
          { icon: 'bi-building', label: 'Active Partners', value: random(8, 25) },
          { icon: 'bi-receipt', label: 'Invoices Generated', value: random(30, 100) },
          { icon: 'bi-file-spreadsheet', label: 'Settlement Reports', value: random(5, 20) },
          { icon: 'bi-currency-dollar', label: 'Revenue (Excl. Comm.)', value: formatCurrency(random(20000, 80000)) }
        ];
      
      case 'accounts':
        return [
          { icon: 'bi-cash-stack', label: 'Completed Revenue', value: formatCurrency(random(15000, 60000)) },
          { icon: 'bi-receipt', label: 'Turf Invoices', value: random(20, 60) },
          { icon: 'bi-file-spreadsheet', label: 'Bank Settlements', value: random(8, 25) },
          { icon: 'bi-calendar-check', label: 'Completed Bookings', value: random(80, 300) }
        ];
      
      case 'userbooking':
        return [
          { icon: 'bi-calendar-check', label: 'Total Bookings', value: random(100, 500) },
          { icon: 'bi-clock', label: 'Online Bookings', value: random(60, 300) },
          { icon: 'bi-phone', label: 'Offline Bookings', value: random(30, 150) },
          { icon: 'bi-x-circle', label: 'Cancelled', value: random(5, 30) }
        ];
      
      default:
        return [];
    }
  };

  // ─── Fetch Stats ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // ─── TODO: Replace with real API call when available ────────────────
        // const response = await apiClient.get('/api/admin/dashboard/stats/');
        // const data = response.data;
        // 
        // // Transform API data based on role
        // let transformedStats = transformApiData(data, userRole);
        // setStats(transformedStats);
        
        // ─── Using Demo Data for now ────────────────────────────────────────
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const demoStats = generateDemoStats(userRole);
        setStats(demoStats);
        
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to empty stats
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userRole]);

  // ─── Get current time greeting ─────────────────────────────────────────────

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ─── Get filtered actions based on role ────────────────────────────────────

  const getFilteredActions = () => {
    const actionTitles = roleConfig.quickActions;
    return ALL_QUICK_ACTIONS.filter(action => 
      actionTitles.includes(action.title)
    );
  };

  // ─── Get available tabs count from sidebar ─────────────────────────────────

  const getAvailableTabsCount = () => {
    // This will come from your sidebar API
    // For now, return a demo value based on role
    const counts: Record<string, number> = {
      super_admin: 15,
      admin: 13,
      cpadmin: 4,
      accounts: 3,
      userbooking: 1
    };
    return counts[userRole] || 0;
  };

  // ─── Handle action click ────────────────────────────────────────────────────

  const handleActionClick = (path: string) => {
    navigate(path);
  };

  const filteredActions = getFilteredActions();

  // ─── Show loading state ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="text-muted mt-2">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 bg-success bg-opacity-10 rounded-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                     style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-person-check fs-1 text-white"></i>
                </div>
                <div>
                  <h2 className="fw-bold mb-1">
                    {getGreeting()}, {admin?.name || 'Admin'}! 👋
                  </h2>
                  <p className="text-muted mb-0">
                    <span className="badge bg-success me-2">{roleConfig.displayName}</span>
                    {roleConfig.description}
                  </p>
                  <small className="text-muted">
                    <i className="bi bi-grid-3x3-gap-fill me-1"></i>
                    {getAvailableTabsCount()} modules available
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Stats */}
      {stats.length > 0 && (
        <div className="row g-3 mb-4">
          {stats.map((stat, index) => (
            <div className="col-md-3 col-6" key={index}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <i className={`bi ${stat.icon} fs-2 text-success`}></i>
                  <h5 className="fw-bold mt-2 mb-0">{stat.value}</h5>
                  <small className="text-muted">{stat.label}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <h5 className="fw-semibold mb-3">
            <i className="bi bi-lightning-fill text-success me-2"></i>
            Quick Actions
          </h5>
        </div>
        {filteredActions.length > 0 ? (
          filteredActions.map((action, index) => (
            <div className="col-md-3 col-6 mb-3" key={index}>
              <div 
                className="card border-0 shadow-sm h-100 cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={() => handleActionClick(action.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.transition = 'transform 0.2s ease';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="card-body text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                       style={{ width: '48px', height: '48px' }}>
                    <i className={`bi ${action.icon} fs-4 text-success`}></i>
                  </div>
                  <h6 className="fw-semibold mb-1">{action.title}</h6>
                  <small className="text-muted d-none d-md-block">{action.description}</small>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="card border-0 bg-light">
              <div className="card-body text-center py-4">
                <i className="bi bi-info-circle fs-2 text-muted"></i>
                <p className="text-muted mt-2">No quick actions available for your role.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role-Specific Information */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-info-circle text-success"></i>
                <small className="text-muted">
                  <strong>Role Access:</strong> You have access to {filteredActions.length} quick actions 
                  and {getAvailableTabsCount()} sidebar modules based on your {roleConfig.displayName} role.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;