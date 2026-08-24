// src/pages/admin/EnquiriesPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEnquiries, ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_COLORS } from '../../api/admin/enquiries';
import type { Enquiry, EnquiryStatus, ListEnquiriesParams } from '../../types/admin/enquiry';

const PAGE_SIZE = 20;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: EnquiryStatus }> = ({ status }) => {
  const colorClass = ENQUIRY_STATUS_COLORS[status] || 'bg-secondary';
  return (
    <span className={`badge rounded-pill px-3 py-2 ${colorClass}`}>
      <span className="d-inline-block rounded-circle bg-white me-1" style={{ width: '6px', height: '6px' }}></span>
      {ENQUIRY_STATUS_LABELS[status]}
    </span>
  );
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
    <nav aria-label="Enquiry pagination">
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

// ─── EnquiriesPage ─────────────────────────────────────────────────────────────

const EnquiriesPage: React.FC = () => {
  const navigate = useNavigate();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Debounce search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  // Fetch enquiries
  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: ListEnquiriesParams = {
        page,
        page_size: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      };
      const data = await listEnquiries(params);
      setEnquiries(data.results || []);
      setTotalCount(data.count || 0);
      setFiltersApplied(!!(debouncedSearch || statusFilter !== 'all'));
    } catch (err: unknown) {
      console.error('Enquiry fetch error:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to load enquiries.';
      setError(msg);
      setEnquiries([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setPage(1);
    setFiltersApplied(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  // Helper to get display name
  const getDisplayName = (enquiry: Enquiry) => {
    if (enquiry.name) return enquiry.name;
    return '—';
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div>
          <h1 className="h3 mb-0">
            <i className="bi bi-envelope-paper text-success me-2"></i>Enquiries
          </h1>
          <p className="text-secondary small mb-0">
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} partner enquiries`}
          </p>
        </div>
      </div>

      {/* ── Filter Toggle ──────────────────────────────────────────────────── */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          className={`btn rounded-pill px-3 ${showFilters ? 'btn-success' : 'btn-outline-secondary'}`}
          onClick={() => setShowFilters(!showFilters)}
          style={{ fontWeight: 500, transition: 'all 0.2s ease' }}
        >
          <i className="bi bi-funnel me-1"></i>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {filtersApplied && (
            <span className="badge bg-danger rounded-pill ms-1" style={{ fontSize: '8px', padding: '2px 6px' }}>!</span>
          )}
        </button>
        {showFilters && (
          <button className="btn btn-outline-secondary rounded-pill px-3" onClick={clearFilters} style={{ fontWeight: 500 }}>
            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
          </button>
        )}
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
          <div className="card-body p-3 p-md-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  <i className="bi bi-search me-1"></i> Search
                </label>
                <div className="position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    className="form-control ps-5"
                    type="search"
                    placeholder="Search by name, phone, location..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                </div>
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  <i className="bi bi-filter-circle me-1"></i> Status
                </label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as EnquiryStatus | 'all')}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="all">All Status</option>
                  {ENQUIRY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ENQUIRY_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-3 d-flex align-items-end">
                <button className="btn btn-success w-100 rounded-pill" onClick={fetchEnquiries} style={{ fontWeight: 500 }}>
                  <i className="bi bi-check2 me-1"></i> Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table Info ────────────────────────────────────────────────────── */}
      {!isLoading && !error && enquiries.length > 0 && (
        <div className="d-flex justify-content-between flex-wrap gap-2 text-secondary small mb-2">
          <span>
            <i className="bi bi-info-circle me-1"></i>
            Showing <strong>{start}–{end}</strong> of <strong>{totalCount.toLocaleString()}</strong> enquiries
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
          <p className="mt-2 text-secondary small">Loading enquiries…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchEnquiries}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && enquiries.length === 0 && (
        <div className="text-center py-5">
          <div className="text-secondary">
            <i className="bi bi-envelope-paper fs-1 d-block mb-3"></i>
            <p>
              {search || statusFilter !== 'all'
                ? 'No enquiries match your filters.'
                : 'No enquiries found.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {!isLoading && !error && enquiries.length > 0 && (
        <>
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <table className="table table-hover align-middle mb-0" style={{ minWidth: '850px', fontSize: '13px' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '50px' }}>ID</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '140px' }}>Name</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '120px' }}>Phone</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '180px' }}>Location</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '90px' }}>Status</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '100px' }}>Partner</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '100px' }}>Created</th>
                    <th className="text-uppercase text-secondary fw-bold text-center" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '60px' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      onClick={() => navigate(`/admin/enquiries/${enquiry.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="fw-semibold text-secondary">#{enquiry.id}</td>
                      <td>
                        <div className="fw-semibold">{getDisplayName(enquiry)}</div>
                        {enquiry.is_verified && (
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill" style={{ fontSize: '9px' }}>
                            <i className="bi bi-check-circle me-1"></i>Verified
                          </span>
                        )}
                      </td>
                      <td className="fw-medium">{enquiry.number}</td>
                      <td>
                        <div className="text-secondary small text-truncate" style={{ maxWidth: '150px' }} title={enquiry.location || ''}>
                          {enquiry.location || '—'}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={enquiry.status} />
                      </td>
                      <td>
                        {enquiry.partner_name ? (
                          <div>
                            <div className="fw-semibold small">{enquiry.partner_name}</div>
                            <div className="text-secondary" style={{ fontSize: '10px' }}>{enquiry.partner_email}</div>
                          </div>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td className="text-secondary small">
                        {formatDate(enquiry.created_at)}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/enquiries/${enquiry.id}`);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
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

export default EnquiriesPage;