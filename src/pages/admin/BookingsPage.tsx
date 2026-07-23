// src/pages/admin/BookingsPage.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBookings } from '../../api/bookings';
import type { Booking, BookingType, PaymentStatus, ListBookingsParams } from '../../types/booking';
import { exportData, sanitizeForExport, formatDateForExport, formatCurrencyForExport } from '../../utils/exportUtils';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const TODAY = new Date().toISOString().split('T')[0];

const formatCurrency = (val: string | number) => {
  const n = typeof val === 'string' ? parseFloat(val || '0') : val;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

// ─── Badges ────────────────────────────────────────────────────────────────────
const PaymentBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const config = {
    'Fully Paid': { class: 'bg-success', label: 'FULLY PAID' },
    'Advance Paid': { class: 'bg-primary', label: 'ADVANCE PAID' },
    'Pending': { class: 'bg-warning text-dark', label: 'PENDING' },
  };
  const c = config[status] || config.Pending;
  return (
    <span className={`badge rounded-pill ${c.class}`}>
      <span className={`d-inline-block rounded-circle me-1 ${status === 'Fully Paid' ? 'bg-white' : status === 'Advance Paid' ? 'bg-white' : 'bg-dark'}`} style={{ width: '6px', height: '6px' }}></span>
      {c.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: BookingType }> = ({ type }) => {
  const config = {
    Online: { class: 'bg-primary', label: 'ONLINE' },
    Offline: { class: 'bg-secondary', label: 'OFFLINE' },
    'Walk-in': { class: 'bg-info text-dark', label: 'WALK-IN' },
  };
  const c = config[type] || config.Offline;
  return <span className={`badge rounded-pill ${c.class}`}>{c.label}</span>;
};

// ─── Stats Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <div className="card border-0 shadow-sm h-100 animate__animated animate__fadeInUp" style={{ borderRadius: '12px', borderLeft: `4px solid ${color}` }}>
    <div className="card-body p-3 p-md-4">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <div className="text-secondary small text-uppercase fw-semibold">{label}</div>
          <div className="fs-4 fw-bold mt-1">{value}</div>
          {sub && <div className="small text-secondary mt-1">{sub}</div>}
        </div>
        <div className="rounded-circle p-2" style={{ background: `${color}15` }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination: React.FC<{
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Bookings pagination">
      <ul className="pagination pagination-sm mb-0 flex-wrap">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link rounded-start" disabled={page === 1} onClick={() => onChange(page - 1)}>
            <i className="bi bi-chevron-left"></i>
          </button>
        </li>
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`e${i}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onChange(p as number)}>
                {p}
              </button>
            </li>
          )
        )}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button className="page-link rounded-end" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ─── BookingsPage ──────────────────────────────────────────────────────────────
type TabType = 'today' | 'all';

const BookingsPage: React.FC = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [bookingType, setBookingType] = useState<BookingType | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [isCancelled, setIsCancelled] = useState<'' | 'true' | 'false'>('');
  const [dateFilter, setDateFilter] = useState('');

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      setDebSearch(val);
      setPage(1);
    }, 400);
  };

  const resetFilters = () => {
    setSearch('');
    setDebSearch('');
    setBookingType('');
    setPaymentStatus('');
    setIsCancelled('');
    setDateFilter('');
    setPage(1);
    setFiltersApplied(false);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: ListBookingsParams = { page, page_size: pageSize };
      if (debSearch) params.search = debSearch;
      if (bookingType) params.booking_type = bookingType;
      if (paymentStatus) params.payment_status = paymentStatus;
      if (isCancelled) params.is_cancelled = isCancelled === 'true';
      if (activeTab === 'today') params.slot_date = TODAY;
      else if (dateFilter) params.slot_date = dateFilter;

      const data = await listBookings(params);
      setBookings(data.results ?? []);
      setTotalCount(data.count ?? 0);
      setFiltersApplied(!!(debSearch || bookingType || paymentStatus || isCancelled || dateFilter));
    } catch {
      setError('Failed to load bookings.');
      setBookings([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debSearch, bookingType, paymentStatus, isCancelled, activeTab, dateFilter]);

  const fetchTodayCount = useCallback(async () => {
    try {
      const data = await listBookings({ slot_date: TODAY, page: 1, page_size: 1 });
      setTodayCount(data.count ?? 0);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  useEffect(() => {
    fetchTodayCount();
  }, [fetchTodayCount]);
  useEffect(() => {
    setPage(1);
  }, [activeTab, bookingType, paymentStatus, isCancelled, dateFilter]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => bookings.reduce((s, b) => s + parseFloat(b.paid_amount || '0'), 0),
    [bookings]
  );
  const totalPending = useMemo(
    () => bookings.reduce((s, b) => s + parseFloat(b.pending_amount || '0'), 0),
    [bookings]
  );

  // ── Export Data ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (bookings.length === 0) {
      alert('No bookings to export.');
      return;
    }

    setIsExporting(true);
    try {
      const exportDataArray = sanitizeForExport(
        bookings.map(b => {
          // Format slots
          const slotsFormatted = b.slots?.map(s => 
            `${new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ${s.start_time}-${s.end_time}${s.is_next_day ? ' +1' : ''}`
          ).join('; ') || '';

          return {
            'Booking ID': b.id,
            'Booking Code': b.booking_code || '',
            'Booking Type': b.booking_type || '',
            'Customer Name': b.customer?.name || '',
            'Customer Email': b.customer?.email || '',
            'Customer Phone': b.customer?.number || '',
            'Partner': b.partner_name || '',
            'Turf': b.turf_name || '',
            'Court Number': b.court_number || '',
            'Slots': slotsFormatted,
            'Total Amount': formatCurrencyForExport(b.total_amount),
            'Paid Amount': formatCurrencyForExport(b.paid_amount),
            'Pending Amount': formatCurrencyForExport(b.pending_amount),
            'Payment Status': b.payment_status || '',
            'Booking Status': b.is_cancelled ? 'Cancelled' : 'Active',
            'Created Date': formatDateForExport(b.created_at),
          };
        })
      );

      exportData(exportDataArray, {
        fileName: `bookings_export_${new Date().toISOString().split('T')[0]}`,
        format: 'excel',
        sheetName: 'Bookings',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const safeCount = totalCount ?? 0;
  const totalPages = Math.ceil(safeCount / pageSize);
  const start = safeCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, safeCount);

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div>
          <h3 className="h3 mb-0">
            <i className="bi bi-calendar2-week text-success me-2"></i>Bookings
          </h3>
          <p className="text-secondary small mb-0">
            {isLoading ? 'Loading…' : `${safeCount.toLocaleString()} total bookings`}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success rounded-pill px-3"
            onClick={handleExport}
            disabled={isLoading || bookings.length === 0 || isExporting}
            style={{ fontWeight: 500 }}
          >
            {isExporting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Exporting...
              </>
            ) : (
              <>
                <i className="bi bi-download me-1"></i>
                Export
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="row g-2 g-md-3 mb-3">
        <div className="col-6 col-xl-3">
          <StatCard
            label="Total Bookings"
            value={safeCount.toLocaleString('en-IN')}
            icon="📋"
            color="#22c55e"
            sub={`${todayCount} today`}
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="Today's Bookings"
            value={todayCount.toLocaleString('en-IN')}
            icon="📅"
            color="#3b82f6"
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            icon="💰"
            color="#f59e0b"
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="Pending Amount"
            value={formatCurrency(totalPending)}
            icon="⏳"
            color="#ef4444"
          />
        </div>
      </div>

      {/* ── Premium Toolbar ────────────────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3 p-2 bg-white rounded-3 shadow-sm" style={{ border: '1px solid #e9ecef' }}>
        <div className="btn-group btn-group-sm" role="group" style={{ background: '#f1f3f5', borderRadius: '50px', padding: '3px' }}>
          <button
            className={`btn rounded-pill px-3 ${activeTab === 'today' ? 'btn-success text-white shadow-sm' : 'btn-ghost text-secondary'}`}
            onClick={() => setActiveTab('today')}
            style={{ 
              fontWeight: 500,
              border: 'none',
              transition: 'all 0.2s ease',
              background: activeTab === 'today' ? '#198754' : 'transparent'
            }}
          >
            <i className="bi bi-calendar-day me-1"></i> Today
            <span className={`badge ms-1 rounded-pill ${activeTab === 'today' ? 'bg-white text-success' : 'bg-light text-secondary'}`}>
              {todayCount}
            </span>
          </button>
          <button
            className={`btn rounded-pill px-3 ${activeTab === 'all' ? 'btn-success text-white shadow-sm' : 'btn-ghost text-secondary'}`}
            onClick={() => setActiveTab('all')}
            style={{ 
              fontWeight: 500,
              border: 'none',
              transition: 'all 0.2s ease',
              background: activeTab === 'all' ? '#198754' : 'transparent'
            }}
          >
            <i className="bi bi-list-ul me-1"></i> All
            <span className={`badge ms-1 rounded-pill ${activeTab === 'all' ? 'bg-white text-success' : 'bg-light text-secondary'}`}>
              {safeCount}
            </span>
          </button>
        </div>

        <div className="flex-grow-1"></div>

        <button
          className={`btn rounded-pill px-3 ${showFilters ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => setShowFilters(!showFilters)}
          style={{ 
            fontWeight: 500,
            transition: 'all 0.2s ease',
            boxShadow: showFilters ? '0 2px 8px rgba(25, 135, 84, 0.2)' : 'none'
          }}
        >
          <i className="bi bi-funnel me-1"></i> 
          {showFilters ? 'Hide Filters' : 'Filter'}
          {filtersApplied && (
            <span className="badge bg-danger rounded-pill ms-1" style={{ fontSize: '8px', padding: '2px 6px' }}>!</span>
          )}
        </button>
      </div>

      {/* ── Filter panel ──────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="card border-0 shadow-sm mb-3 animate__animated animate__fadeIn" style={{ borderRadius: '12px' }}>
          <div className="card-body p-3">
            <div className="row g-2">
              <div className="col-12 col-md-4">
                <input
                  className="form-control form-control-sm rounded-pill"
                  type="search"
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {activeTab === 'all' && (
                <div className="col-6 col-md-2">
                  <input
                    className="form-control form-control-sm rounded-pill"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Date"
                  />
                </div>
              )}

              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm rounded-pill"
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value as PaymentStatus | '');
                    setPage(1);
                  }}
                >
                  <option value="">Payment</option>
                  <option value="Pending">Pending</option>
                  <option value="Advance Paid">Advance Paid</option>
                  <option value="Fully Paid">Fully Paid</option>
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm rounded-pill"
                  value={bookingType}
                  onChange={(e) => {
                    setBookingType(e.target.value as BookingType | '');
                    setPage(1);
                  }}
                >
                  <option value="">Type</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Walk-in">Walk-in</option>
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select
                  className="form-select form-select-sm rounded-pill"
                  value={isCancelled}
                  onChange={(e) => {
                    setIsCancelled(e.target.value as '' | 'true' | 'false');
                    setPage(1);
                  }}
                >
                  <option value="">Status</option>
                  <option value="false">Active</option>
                  <option value="true">Cancelled</option>
                </select>
              </div>

              <div className="col-12">
                <button className="btn btn-success btn-sm rounded-pill px-3 me-2" onClick={fetchBookings}>
                  <i className="bi bi-check2 me-1"></i> Apply
                </button>
                <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={resetFilters}>
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 animate__animated animate__fadeIn">
          <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary small">Loading bookings…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between animate__animated animate__shakeX" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={fetchBookings}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="d-flex justify-content-between flex-wrap gap-2 text-secondary small mb-2">
            <span>
              <i className="bi bi-info-circle me-1"></i>
              Showing <strong>{start}–{end}</strong> of <strong>{safeCount.toLocaleString()}</strong> bookings
            </span>
            <span>Page {page} of {totalPages || 1}</span>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-5 animate__animated animate__fadeIn">
              <div className="text-secondary">
                <i className="bi bi-calendar-x fs-1 d-block mb-3"></i>
                <p className="fw-semibold mb-1">No bookings found.</p>
                <p className="small">Try adjusting your filters or search terms.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="card border-0 shadow-sm animate__animated animate__fadeInUp" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible', WebkitOverflowScrolling: 'touch' }}>
                  <table className="table table-hover align-middle mb-0" style={{ minWidth: '1100px', fontSize: '0.9rem', width: '100%' }}>
                    <thead className="bg-light">
                      <tr>
                        <th className="text-uppercase text-secondary fw-bold small ps-3" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '40px' }}>#</th>
                        <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '140px' }}>Booking</th>
                        <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '70px' }}>Type</th>
                        <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '130px' }}>Customer</th>
                        <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '120px' }}>Turf</th>
                        <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '150px' }}>Slots</th>
                        <th className="text-uppercase text-secondary fw-bold small text-end" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '80px' }}>Amount</th>
                        <th className="text-uppercase text-secondary fw-bold small text-center" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '100px' }}>Status</th>
                        <th className="text-uppercase text-secondary fw-bold small text-center" style={{ fontSize: '10px', letterSpacing: '0.5px', width: '60px' }}>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b, idx) => (
                        <tr
                          key={b.id}
                          className="table-row-hover"
                          onClick={() => navigate(`/admin/bookings/${b.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="fw-semibold text-secondary text-center small ps-3">{start + idx}</td>
                          <td>
                            <div>
                              <code className="bg-light px-1 py-0 rounded" style={{ fontSize: '11px' }}>{b.booking_code}</code>
                              <div className="text-secondary" style={{ fontSize: '9px' }}>ID: {b.id}</div>
                            </div>
                          </td>
                          <td><TypeBadge type={b.booking_type} /></td>
                          <td>
                            <div className="fw-semibold" style={{ fontSize: '12px' }}>{b.customer?.name ?? '—'}</div>
                            <div className="text-secondary" style={{ fontSize: '10px' }}>{b.customer?.email}</div>
                            <div className="text-secondary" style={{ fontSize: '10px' }}>{b.customer?.number}</div>
                          </td>
                          <td>
                            <div className="fw-semibold" style={{ fontSize: '12px' }}>{b.turf_name}</div>
                            <div className="text-secondary" style={{ fontSize: '10px' }}>Court {b.court_number}</div>
                          </td>
                          <td>
                            {b.slots?.length > 0 ? (
                              b.slots.map((s, si) => (
                                <div key={si} className="bg-light rounded-1 px-2 py-0 mb-1" style={{ fontSize: '10px' }}>
                                  {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  <span className="text-secondary"> {s.start_time}–{s.end_time}</span>
                                  {s.is_next_day && <span className="text-warning">+1</span>}
                                </div>
                              ))
                            ) : (
                              <span className="text-secondary">—</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="fw-semibold">{formatCurrency(b.total_amount)}</div>
                            <div className="text-secondary" style={{ fontSize: '10px' }}>
                              Paid: {formatCurrency(b.paid_amount)}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column align-items-center gap-1">
                              <PaymentBadge status={b.payment_status} />
                              {b.is_cancelled && (
                                <span className="badge rounded-pill bg-danger" style={{ fontSize: '9px' }}>
                                  <i className="bi bi-x-circle me-1"></i>Cancelled
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-success rounded-pill"
                              style={{ fontSize: '11px', padding: '2px 12px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/bookings/${b.id}`);
                              }}
                            >
                              <i className="bi bi-eye me-1"></i>View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 animate__animated animate__fadeInUp">
                  <span className="small text-secondary">
                    <i className="bi bi-info-circle me-1"></i>
                    {start}–{end} of {safeCount.toLocaleString()}
                  </span>
                  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Add Animate.css ────────────────────────────────────────────────── */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
      
      {/* ─── Custom Styles ──────────────────────────────────────────────────── */}
      <style>{`
        .table-row-hover {
          transition: background-color 0.2s ease;
        }
        .table-row-hover:hover {
          background-color: #f8f9fa !important;
        }
        .table-row-hover:active {
          background-color: #f0f0f0 !important;
        }
        .form-control:focus, .form-select:focus {
          border-color: #198754 !important;
          box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.1) !important;
        }
        .btn-success {
          transition: all 0.2s ease;
        }
        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3) !important;
        }
        .btn-success:active {
          transform: translateY(0) !important;
        }
        .btn-outline-success {
          transition: all 0.2s ease;
        }
        .btn-outline-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.15) !important;
        }
        .btn-outline-secondary {
          transition: all 0.2s ease;
        }
        .btn-outline-secondary:hover {
          transform: translateY(-2px);
        }
        .page-item .page-link {
          transition: all 0.2s ease;
        }
        .page-item.active .page-link {
          background-color: #198754;
          border-color: #198754;
        }
        .page-item:not(.active) .page-link:hover {
          color: #198754;
          transform: translateY(-1px);
        }
        .badge {
          transition: all 0.2s ease;
        }
        .badge:hover {
          transform: scale(1.05);
        }
        .btn-ghost {
          background: transparent !important;
        }
        .btn-ghost:hover {
          background: rgba(0,0,0,0.05) !important;
        }
      `}</style>
    </div>
  );
};

export default BookingsPage;