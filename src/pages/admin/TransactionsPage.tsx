// src/pages/admin/TransactionsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { listTransactions } from '../../api/admin/transactions';
import type { Transaction, TransactionType, ListTransactionsParams } from '../../types/admin/transaction';

const PAGE_SIZE = 20;

// ─── Valid filter types (only these are accepted by the API) ────────────────
const VALID_FILTER_TYPES: TransactionType[] = [
  'wallet_topup',
  'online_payment',
  'cash_payment',
];

const FILTER_TYPE_LABELS: Record<TransactionType, string> = {
  wallet_topup: 'Wallet Top-up',
  online_payment: 'Online Payment',
  cash_payment: 'Cash Payment',
  // These are for display only when they appear in response
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ─── Status Badges ────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: TransactionType }> = ({ type }) => {
  const colors: Record<string, string> = {
    wallet_topup: 'bg-info',
    online_payment: 'bg-primary',
    cash_payment: 'bg-success',
    booking_payment: 'bg-primary',
    refund: 'bg-danger',
    commission: 'bg-warning',
    advance_payment: 'bg-info',
    balance_payment: 'bg-secondary',
  };
  const labels: Record<string, string> = {
    wallet_topup: 'Top-up',
    online_payment: 'Online',
    cash_payment: 'Cash',
    booking_payment: 'Booking',
    refund: 'Refund',
    commission: 'Commission',
    advance_payment: 'Advance',
    balance_payment: 'Balance',
  };
  return (
    <span className={`badge rounded-pill ${colors[type] || 'bg-secondary'} text-white`}>
      {labels[type] || type}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === 'success' 
    ? 'bg-success' 
    : status === 'failed' 
    ? 'bg-danger' 
    : status === 'pending' 
    ? 'bg-warning' 
    : status === 'refunded' 
    ? 'bg-primary' 
    : 'bg-secondary';
  return <span className={`badge rounded-pill ${cls} text-white`}>{status}</span>;
};

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
    <nav aria-label="Transaction pagination">
      <ul className="pagination pagination-sm mb-0 flex-wrap">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" disabled={page === 1} onClick={() => onChange(page - 1)}>
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
          <button className="page-link" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ─── TransactionsPage ──────────────────────────────────────────────────────────

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Debounce search
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: ListTransactionsParams = {
        page,
        page_size: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
      };
      const data = await listTransactions(params);
      setTransactions(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err: unknown) {
      console.error('Transaction fetch error:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to load transactions.';
      setError(msg);
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  // Helper to get display name
  const getDisplayName = (tx: Transaction) => {
    if (tx.user_name) return tx.user_name;
    if (tx.partner_name) return tx.partner_name;
    return '—';
  };

  const getDisplayEmail = (tx: Transaction) => {
    if (tx.user_email) return tx.user_email;
    if (tx.partner_email) return tx.partner_email;
    return null;
  };

  const getDisplayPhone = (tx: Transaction) => {
    if (tx.user_phone) return tx.user_phone;
    return null;
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-0">
            <i className="bi bi-credit-card-2-front text-success me-2"></i>Transactions
          </h1>
          <p className="text-secondary small mb-0">
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} transaction${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* ── Premium Filters ────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-end gap-2 gap-md-3">
            {/* Search */}
            <div className="flex-grow-1" style={{ minWidth: '160px' }}>
              <label className="form-label small fw-semibold text-secondary mb-1">
                <i className="bi bi-search me-1"></i>Search
              </label>
              <div className="position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" style={{ fontSize: '14px' }}></i>
                <input
                  className="form-control form-control-sm ps-5"
                  type="search"
                  placeholder="Name, booking code, reference..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div style={{ minWidth: '140px' }}>
              <label className="form-label small fw-semibold text-secondary mb-1">
                <i className="bi bi-tag me-1"></i>Type
              </label>
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
                style={{ borderRadius: '8px' }}
              >
                <option value="all">All Types</option>
                {VALID_FILTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FILTER_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div style={{ minWidth: '130px' }}>
              <label className="form-label small fw-semibold text-secondary mb-1">
                <i className="bi bi-calendar3 me-1"></i>From
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </div>

            {/* Date To */}
            <div style={{ minWidth: '130px' }}>
              <label className="form-label small fw-semibold text-secondary mb-1">
                <i className="bi bi-calendar3 me-1"></i>To
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button
                className="btn btn-success btn-sm rounded-pill px-3"
                onClick={fetchTransactions}
                style={{ fontWeight: 500 }}
              >
                <i className="bi bi-check2 me-1"></i>Apply
              </button>
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                onClick={clearFilters}
                style={{ fontWeight: 500 }}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Info ────────────────────────────────────────────────────── */}
      {!isLoading && !error && transactions.length > 0 && (
        <div className="d-flex justify-content-between flex-wrap gap-2 text-secondary small mb-2">
          <span>
            <i className="bi bi-info-circle me-1"></i>
            Showing <strong>{start}–{end}</strong> of <strong>{totalCount.toLocaleString()}</strong> transactions
          </span>
          <span>Page {page} of {totalPages || 1}</span>
        </div>
      )}

      {/* ── States ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary small">Loading transactions…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchTransactions}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && transactions.length === 0 && (
        <div className="text-center py-5">
          <div className="text-secondary">
            <i className="bi bi-credit-card-2-back fs-1 d-block mb-3"></i>
            <p>
              {search || typeFilter !== 'all' || dateFrom || dateTo
                ? 'No transactions match your filters.'
                : 'No transactions found.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Table (only table scrolls) ───────────────────────────────────── */}
      {!isLoading && !error && transactions.length > 0 && (
        <>
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible', WebkitOverflowScrolling: 'touch' }}>
              <table className="table table-hover align-middle mb-0" style={{ minWidth: '1100px', fontSize: '13px' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '100px' }}>Reference</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '160px' }}>User / Partner</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '90px' }}>Type</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '80px' }}>Method</th>
                    <th className="text-uppercase text-secondary fw-bold text-end" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '80px' }}>Amount</th>
                    <th className="text-uppercase text-secondary fw-bold text-center" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '90px' }}>Status</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '140px' }}>Date</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '150px' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <code className="bg-light px-1 py-0 rounded" style={{ fontSize: '11px' }}>
                          {tx.id}
                        </code>
                        {tx.booking_code && (
                          <div className="text-secondary" style={{ fontSize: '9px' }}>
                            {tx.booking_code}
                          </div>
                        )}
                      </td>
                      <td>
                        {getDisplayName(tx) !== '—' ? (
                          <div className="min-w-0">
                            <div className="fw-semibold" style={{ fontSize: '12px' }}>{getDisplayName(tx)}</div>
                            <div className="text-secondary" style={{ fontSize: '10px' }}>
                              {getDisplayEmail(tx) || getDisplayPhone(tx) || ''}
                            </div>
                            {tx.turf_name && (
                              <div className="text-secondary" style={{ fontSize: '10px' }}>
                                🏟 {tx.turf_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td>
                        <TypeBadge type={tx.type} />
                      </td>
                      <td>
                        <span className="badge rounded-pill bg-secondary">{tx.method}</span>
                      </td>
                      <td
                        className="fw-semibold text-end"
                        style={{
                          color: tx.status === 'refunded' || tx.status === 'partially_refunded' ? '#dc3545' : '#198754',
                        }}
                      >
                        {tx.status === 'refunded' || tx.status === 'partially_refunded' ? '-' : ''}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="text-center">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="text-secondary small">
                        {formatDateTime(tx.date)}
                      </td>
                      <td>
                        <div className="text-truncate">
                          {tx.description || tx.reference || '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
              <span className="small text-secondary">
                <i className="bi bi-info-circle me-1"></i>
                {start}–{end} of {totalCount.toLocaleString()}
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionsPage;