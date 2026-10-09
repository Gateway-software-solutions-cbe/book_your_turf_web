// src/pages/admin/AnalyticsPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsOverview } from '../../api/admin/analytics';
import type {
  AnalyticsOverview,
  AnalyticsClickKey,
  AnalyticsPeriod,
} from '../../types/admin/analytics';
import { exportData } from '../../utils/exportUtils';
import './tbm-theme.css';

// ─── Constants ──────────────────────────────────────────────────────────────
const THEME_KEY = 'tbm-theme';
const TODAY = new Date().toISOString().split('T')[0];

// Group the 19 click keys into readable dashboard sections
const GROUPS: { label: string; icon: string; keys: AnalyticsClickKey[] }[] = [
  {
    label: 'Login & OTP',
    icon: '🔐',
    keys: ['otp_send', 'otp_new_user', 'otp_relogin', 'otp_fail'],
  },
  {
    label: 'Discovery',
    icon: '🔍',
    keys: ['turf_list', 'calendar_open', 'turf_favorite'],
  },
  {
    label: 'Payments',
    icon: '💳',
    keys: [
      'razorpay_click',
      'payment_success',
      'payment_failure',
      'wallet_topup_click',
      'wallet_topup_success',
      'wallet_topup_failure',
    ],
  },
  {
    label: 'Bookings',
    icon: '📅',
    keys: [
      'booking_create',
      'advance_pay',
      'full_pay',
      'pay_balance_click',
      'wallet_book',
      'booking_cancel',
    ],
  },
];

// Friendly labels (fallback to key if not present)
const KEY_LABELS: Record<AnalyticsClickKey, string> = {
  otp_send: 'OTP Sent',
  otp_new_user: 'New User OTP Login',
  otp_relogin: 'Relogin OTP Success',
  otp_fail: 'OTP Failed',
  turf_list: 'Turf List Opened',
  calendar_open: 'Calendar Opened',
  razorpay_click: 'Razorpay Checkout Started',
  payment_success: 'Payment Success',
  payment_failure: 'Payment Failure',
  booking_create: 'Booking Created',
  advance_pay: 'Advance Paid',
  full_pay: 'Fully Paid',
  pay_balance_click: 'Pay Balance Started',
  wallet_book: 'Wallet Booking',
  wallet_topup_click: 'Wallet Top-up Started',
  wallet_topup_success: 'Wallet Top-up Success',
  wallet_topup_failure: 'Wallet Top-up Failure',
  booking_cancel: 'Booking Cancelled',
  turf_favorite: 'Turf Favorited',
};

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType }

// ─── Page ───────────────────────────────────────────────────────────────────
const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Theme (shared with BookingsPage)
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light',
  );
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  // ── Data state
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filters
  const [period, setPeriod] = useState<AnalyticsPeriod | 'custom'>('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [turfId, setTurfId] = useState('');
  const [area, setArea] = useState('');
  const [applied, setApplied] = useState<{
    period: AnalyticsPeriod | 'custom';
    from: string;
    to: string;
    turfId: string;
    area: string;
  }>({ period: 'today', from: '', to: '', turfId: '', area: '' });

  // ── Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  // ── Fetch
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query =
        applied.period === 'custom' && applied.from && applied.to
          ? {
              from: applied.from,
              to: applied.to,
              turf_id: applied.turfId ? Number(applied.turfId) : undefined,
              area: applied.area || undefined,
            }
          : {
              period: applied.period === 'custom' ? 'today' : applied.period,
              turf_id: applied.turfId ? Number(applied.turfId) : undefined,
              area: applied.area || undefined,
            };

      const res = await getAnalyticsOverview(query);
      setData(res);
    } catch (e) {
      console.error('Analytics fetch error:', e);
      setError('Failed to load analytics. Please try again.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [applied]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Apply / Reset
  const applyFilters = () => {
    if (period === 'custom' && (!from || !to)) {
      pushToast('Please select both From and To dates', 'error');
      return;
    }
    if (period === 'custom' && from > to) {
      pushToast('From date must be before To date', 'error');
      return;
    }
    setApplied({ period, from, to, turfId, area });
    pushToast('🔍 Filters applied', 'success');
  };

  const resetFilters = () => {
    setPeriod('today');
    setFrom('');
    setTo('');
    setTurfId('');
    setArea('');
    setApplied({ period: 'today', from: '', to: '', turfId: '', area: '' });
    pushToast('↩️ Filters reset', 'info');
  };

  // Quick period buttons
  const setQuickPeriod = (p: AnalyticsPeriod) => {
    setPeriod(p);
    setFrom('');
    setTo('');
    setApplied((prev) => ({ ...prev, period: p, from: '', to: '' }));
  };

  // ── Export
  const handleExport = (format: 'excel' | 'csv') => {
    if (!data) {
      pushToast('No data to export', 'error');
      return;
    }
    // Build rows: one per click key + a total row
    const rows = Object.entries(data.clicks).map(([key, value]) => ({
      'Click Key': key,
      'Description': KEY_LABELS[key as AnalyticsClickKey] ?? key,
      'Count': value,
    }));
    rows.push({
      'Click Key': 'TOTAL',
      'Description': 'Total Clicks',
      'Count': data.total_clicks,
    });

    exportData(rows, {
      fileName: `analytics-${data.from}_to_${data.to}`,
      format,
      sheetName: 'Analytics',
    });
    pushToast(`📥 Exported analytics (${format.toUpperCase()})`, 'success');
  };

  // ── Derived stats
  const successRate = useMemo(() => {
    if (!data) return 0;
    const attempts = data.clicks.payment_success + data.clicks.payment_failure;
    if (attempts === 0) return 0;
    return (data.clicks.payment_success / attempts) * 100;
  }, [data]);

  const conversionRate = useMemo(() => {
    if (!data || data.clicks.turf_list === 0) return 0;
    return (data.clicks.booking_create / data.clicks.turf_list) * 100;
  }, [data]);

  const otpSuccessRate = useMemo(() => {
    if (!data) return 0;
    const total = data.clicks.otp_send;
    if (total === 0) return 0;
    const ok = data.clicks.otp_new_user + data.clicks.otp_relogin;
    return (ok / total) * 100;
  }, [data]);

  // ── Render
  return (
    <div className="tbm-app" data-theme={theme === 'dark' ? 'dark' : undefined}>
      {/* Toasts */}
      <div className="tbm-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`tbm-toast ${t.type}`}>
            <span className="tbm-toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      <div className="tbm-container">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="tbm-header">
          <div className="tbm-header-top">
            <div className="tbm-logo-section">
              <div className="tbm-logo-icon">📊</div>
              <div className="tbm-header-title">
                <h1>User Analytics</h1>
                <p>Click-through insights • Real-time funnel tracking</p>
              </div>
            </div>
            <div className="tbm-header-controls">
              <button
                className="tbm-theme-toggle"
                onClick={toggleTheme}
                title="Toggle Light/Dark Theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button
                className="tbm-btn-refresh"
                onClick={fetchData}
                disabled={isLoading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Date range display */}
          {data && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              📅 Showing data from <strong>{data.from}</strong> to{' '}
              <strong>{data.to}</strong>
            </div>
          )}

          {/* Hero KPI cards */}
          <div className="tbm-stats-grid" style={{ marginTop: 16 }}>
            <div className="tbm-stat-card">
              <div className="tbm-stat-header">
                <div className="tbm-stat-icon total">👆</div>
                <span className="tbm-stat-trend up">TOTAL</span>
              </div>
              <div className="tbm-stat-value">
                {data ? data.total_clicks.toLocaleString('en-IN') : '—'}
              </div>
              <div className="tbm-stat-label">Total Clicks</div>
            </div>

            <div className="tbm-stat-card">
              <div className="tbm-stat-header">
                <div className="tbm-stat-icon today">🔐</div>
                <span className="tbm-stat-trend up">OTP</span>
              </div>
              <div className="tbm-stat-value">
                {data ? `${otpSuccessRate.toFixed(1)}%` : '—'}
              </div>
              <div className="tbm-stat-label">OTP Success Rate</div>
            </div>

            <div className="tbm-stat-card">
              <div className="tbm-stat-header">
                <div className="tbm-stat-icon revenue">💳</div>
                <span className="tbm-stat-trend up">PAY</span>
              </div>
              <div className="tbm-stat-value">
                {data ? `${successRate.toFixed(1)}%` : '—'}
              </div>
              <div className="tbm-stat-label">Payment Success Rate</div>
            </div>

            <div className="tbm-stat-card">
              <div className="tbm-stat-header">
                <div className="tbm-stat-icon pending">📈</div>
                <span className="tbm-stat-trend up">CV</span>
              </div>
              <div className="tbm-stat-value">
                {data ? `${conversionRate.toFixed(1)}%` : '—'}
              </div>
              <div className="tbm-stat-label">Turf → Booking Conv.</div>
            </div>
          </div>
        </header>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div className="tbm-filters">
          <div className="tbm-section-title">
            <div className="tbm-section-title-icon">🔍</div>
            Filter Analytics
          </div>

          <div className="tbm-filters-grid">
            {/* Period */}
            <div className="tbm-filter-group">
              <label className="tbm-filter-label">⏱ Period</label>
              <select
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value as AnalyticsPeriod | 'custom')
                }
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* From / To (only when custom) */}
            {period === 'custom' && (
              <div className="tbm-filter-group tbm-date-range">
                <label className="tbm-filter-label">📆 Date Range</label>
                <div>
                  <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    to
                  </span>
                  <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Turf ID */}
            <div className="tbm-filter-group">
              <label className="tbm-filter-label">🏟 Turf ID</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 431"
                value={turfId}
                onChange={(e) =>
                  setTurfId(e.target.value.replace(/[^0-9]/g, ''))
                }
              />
            </div>

            {/* Area */}
            <div className="tbm-filter-group">
              <label className="tbm-filter-label">📍 Area</label>
              <input
                type="text"
                placeholder="e.g. Coimbatore"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </div>

          {/* Quick period pills */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            {(['today', 'yesterday', 'month', 'year'] as AnalyticsPeriod[]).map(
              (p) => (
                <button
                  key={p}
                  className={`tbm-btn ${
                    period === p ? 'tbm-btn-primary' : 'tbm-btn-outline'
                  }`}
                  onClick={() => setQuickPeriod(p)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {p === 'month'
                    ? 'This Month'
                    : p === 'year'
                    ? 'This Year'
                    : p}
                </button>
              ),
            )}
          </div>

          <div className="tbm-action-buttons">
            <button className="tbm-btn tbm-btn-primary" onClick={applyFilters}>
              🔍 Apply Filters
            </button>
            <button className="tbm-btn tbm-btn-outline" onClick={resetFilters}>
              ↩️ Reset Filters
            </button>
            <button
              className="tbm-btn tbm-btn-export"
              onClick={() => handleExport('excel')}
              disabled={!data}
            >
              📥 Export Excel
            </button>
            <button
              className="tbm-btn tbm-btn-outline"
              onClick={() => handleExport('csv')}
              disabled={!data}
            >
              📄 Export CSV
            </button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────── */}
        {error && !isLoading && (
          <div
            className="tbm-card"
            style={{
              padding: 16,
              borderLeft: '3px solid var(--danger)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                ⚠️ {error}
              </span>
              <button
                className="tbm-btn tbm-btn-outline"
                onClick={fetchData}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────── */}
        {isLoading && (
          <div className="tbm-card" style={{ padding: 60, textAlign: 'center' }}>
            <div className="tbm-loader"></div>
            <div className="tbm-loader-text">Loading analytics…</div>
          </div>
        )}

        {/* ── Grouped click cards ───────────────────────────────── */}
        {!isLoading && data && (
          <>
            {GROUPS.map((group) => {
              const groupTotal = group.keys.reduce(
                (sum, k) => sum + (data.clicks[k] ?? 0),
                0,
              );
              return (
                <div
                  key={group.label}
                  className="tbm-card"
                  style={{ marginBottom: 16 }}
                >
                  <div className="tbm-card-header">
                    <h3>
                      <span style={{ fontSize: 18 }}>{group.icon}</span>
                      {group.label}
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--primary)',
                          background: 'rgba(22, 163, 74, 0.10)',
                          padding: '3px 10px',
                          borderRadius: 10,
                        }}
                      >
                        {groupTotal.toLocaleString('en-IN')}
                      </span>
                    </h3>
                  </div>
                  <div className="tbm-card-body">
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 12,
                      }}
                    >
                      {group.keys.map((k) => (
                        <div
                          key={k}
                          className="tbm-detail-item"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <div className="tbm-detail-label">
                            {KEY_LABELS[k]}
                          </div>
                          <div
                            className="tbm-detail-value"
                            style={{
                              fontSize: 22,
                              fontWeight: 800,
                              color:
                                (data.clicks[k] ?? 0) > 0
                                  ? 'var(--primary)'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {(data.clicks[k] ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: 'var(--text-muted)',
                              fontFamily: 'SF Mono, Monaco, monospace',
                            }}
                          >
                            {k}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Use-case reference table ─────────────────────── */}
            <div className="tbm-table-section" style={{ marginTop: 20 }}>
              <div className="tbm-table-header-bar">
                <div className="tbm-results-info">
                  📖 <strong>Use Case Reference</strong> — what each click key
                  maps to
                </div>
              </div>
              <div className="tbm-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Click Key</th>
                      <th>When</th>
                      <th>API</th>
                      <th style={{ textAlign: 'right' }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.use_cases.map((uc) => {
                      const count = (data.clicks as any)[uc.click] ?? 0;
                      return (
                        <tr key={uc.click}>
                          <td>
                            <span className="tbm-booking-code">
                              {uc.click}
                            </span>
                          </td>
                          <td>{uc.when}</td>
                          <td
                            style={{
                              fontFamily: 'SF Mono, Monaco, monospace',
                              fontSize: 10,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {uc.api}
                          </td>
                          <td
                            className="tbm-amount-cell"
                            style={{
                              textAlign: 'right',
                              color:
                                count > 0
                                  ? 'var(--primary)'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {count.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Empty (all zero) notice */}
            {data.total_clicks === 0 && (
              <div className="tbm-empty-state">
                <div className="tbm-empty-icon">📊</div>
                <div className="tbm-empty-title">No activity in this range</div>
                <div className="tbm-empty-desc">
                  Try widening the date range or removing the turf / area
                  filters.
                </div>
              </div>
            )}
          </>
        )}

        {/* Back button (nice for detail flow) */}
        <div style={{ marginTop: 20 }}>
          <button
            className="tbm-back-btn"
            onClick={() => navigate('/welcome')}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;