// src/pages/admin/DiscountsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  listAdminDiscounts, 
  listPartnerDiscounts,
  DISCOUNT_TYPES, 
  DAYS, 
  DAY_LABELS 
} from '../../api/discounts';
import type { Discount, DiscountType, ListDiscountsParams } from '../../types/discount';

const PAGE_SIZE = 20;

type TabType = 'admin' | 'partner';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const getActiveDays = (discount: Discount): string[] => {
  return DAYS.filter(day => discount[day]);
};

// ─── Status Badges ────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: string; value: string }> = ({ type, value }) => {
  const label = type === 'percentage' ? `${value}%` : formatCurrency(value);
  const variant = type === 'percentage' ? 'success' : 'primary';
  return <span className={`badge rounded-pill bg-${variant}`}>{label}</span>;
};

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <span className={`badge rounded-pill ${isActive ? 'bg-success' : 'bg-secondary'}`}>
      <span className={`d-inline-block rounded-circle me-1 ${isActive ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
      {isActive ? 'ACTIVE' : 'INACTIVE'}
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
    <nav aria-label="Discount pagination">
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

// ─── DiscountsPage ─────────────────────────────────────────────────────────────

const DiscountsPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('admin');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DiscountType | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [filtersApplied, setFiltersApplied] = useState(false);

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

  // Fetch discounts based on active tab
  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: ListDiscountsParams = {
        page,
        page_size: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(typeFilter !== 'all' ? { discount_type: typeFilter } : {}),
        ...(activeFilter !== undefined ? { is_active: activeFilter } : {}),
      };
      
      const data = activeTab === 'admin' 
        ? await listAdminDiscounts(params)
        : await listPartnerDiscounts(params);
      
      setDiscounts(data.results || []);
      setTotalCount(data.count || 0);
      setFiltersApplied(!!(debouncedSearch || typeFilter !== 'all' || activeFilter !== undefined));
    } catch (err: unknown) {
      console.error('Discount fetch error:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to load discounts.';
      setError(msg);
      setDiscounts([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, activeFilter, activeTab]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  useEffect(() => {
    const handleFocus = () => {
      fetchDiscounts();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDiscounts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, activeFilter, activeTab]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setTypeFilter('all');
    setActiveFilter(undefined);
    setPage(1);
    setFiltersApplied(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  const tabLabel = activeTab === 'admin' ? 'Platform Funded' : 'Partner Funded';

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div>
          <h3 className="h3 mb-0">
            <i className="bi bi-tags text-success me-2"></i>Discounts
          </h3>
          <p className="text-secondary small mb-0">
            {isLoading ? 'Loading…' : `${totalCount.toLocaleString()} ${tabLabel} discount${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          className="btn btn-success rounded-pill px-4 shadow-sm"
          onClick={() => navigate(`/admin/discounts/new?type=${activeTab}`)}
          style={{ fontWeight: 500, transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(25, 135, 84, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 135, 84, 0.2)';
          }}
        >
          <i className="bi bi-plus-lg me-1"></i> Add {tabLabel} Discount
        </button>
      </div>

      {/* ── Premium Tabs ──────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <div className="card-body p-2">
          <div className="d-flex gap-2">
            <button
              className={`btn flex-fill rounded-pill py-2 justify-content-center ${activeTab === 'admin' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('admin')}
              style={{ fontWeight: 500, transition: 'all 0.2s ease' }}
            >
              <i className="bi bi-building me-1"></i> Platform Funded
              <span className="badge bg-light text-dark ms-1 rounded-pill">Admin</span>
            </button>
            <button
              className={`btn flex-fill rounded-pill py-2 justify-content-center ${activeTab === 'partner' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('partner')}
              style={{ fontWeight: 500, transition: 'all 0.2s ease' }}
            >
              <i className="bi bi-person-badge me-1"></i> Partner Funded
              <span className="badge bg-light text-dark ms-1 rounded-pill">Venue</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Description ───────────────────────────────────────────────── */}
      <div className={`alert alert-success small py-2 mb-3`} role="status" style={{ width: '50%', margin: 'auto', borderRadius: '10px', textAlign: 'center' }}>
        <i className="bi bi-info-circle me-1"></i>
        {activeTab === 'admin' ? (
          'Platform-funded discounts are paid for by BookYourTurf.'
        ) : (
          'Partner-funded discounts are paid for by individual channel partners.'
        )}
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
              <div className="col-12 col-md-5">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  <i className="bi bi-search me-1"></i> Search
                </label>
                <div className="position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    className="form-control ps-5"
                    type="search"
                    placeholder="Search by name, description..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                </div>
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  <i className="bi bi-tag me-1"></i> Type
                </label>
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as DiscountType | 'all')}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="all">All Types</option>
                  {DISCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === 'percentage' ? 'Percentage' : 'Fixed'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label small fw-semibold text-secondary mb-1">
                  <i className="bi bi-check-circle me-1"></i> Status
                </label>
                <select
                  className="form-select"
                  value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') setActiveFilter(undefined);
                    else if (val === 'active') setActiveFilter(true);
                    else setActiveFilter(false);
                  }}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="col-12 col-md-1 d-flex align-items-end">
                <button className="btn btn-success w-100 rounded-pill" onClick={fetchDiscounts} style={{ fontWeight: 500 }}>
                  <i className="bi bi-check2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table Info ────────────────────────────────────────────────────── */}
      {!isLoading && !error && discounts.length > 0 && (
        <div className="d-flex justify-content-between flex-wrap gap-2 text-secondary small mb-2">
          <span>
            <i className="bi bi-info-circle me-1"></i>
            Showing <strong>{start}–{end}</strong> of <strong>{totalCount.toLocaleString()}</strong> discounts
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
          <p className="mt-2 text-secondary small">Loading discounts…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchDiscounts}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && discounts.length === 0 && (
        <div className="text-center py-5">
          <div className="text-secondary">
            <i className="bi bi-tags fs-1 d-block mb-3"></i>
            <p>
              {search || typeFilter !== 'all' || activeFilter !== undefined
                ? 'No discounts match your filters.'
                : `No ${tabLabel} discounts found. Create your first ${tabLabel.toLowerCase()} discount!`}
            </p>
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {!isLoading && !error && discounts.length > 0 && (
        <>
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <table className="table table-hover align-middle mb-0" style={{ minWidth: '900px', fontSize: '13px' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '50px' }}>ID</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '150px' }}>Name</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '80px' }}>Type</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '70px' }}>Value</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '90px' }}>Days</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '70px' }}>Usage</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '110px' }}>Validity</th>
                    <th className="text-uppercase text-secondary fw-bold text-center" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '80px' }}>Status</th>
                    <th className="text-uppercase text-secondary fw-bold text-center" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '70px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((discount) => {
                    const activeDays = getActiveDays(discount);
                    const isAllDays = activeDays.length === 7;
                    const daysDisplay = isAllDays ? 'All Days' : activeDays.map(d => DAY_LABELS[d].slice(0, 3)).join(', ');
                    
                    return (
                      <tr 
                        key={discount.id} 
                        onClick={() => navigate(`/admin/discounts/${discount.id}?type=${discount.source}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="fw-semibold text-secondary">#{discount.id}</td>
                        <td>
                          <div className="fw-semibold">{discount.name}</div>
                          <div className="text-secondary small text-truncate" style={{ maxWidth: '120px' }}>
                            {discount.description || ''}
                          </div>
                          {discount.source === 'partner' && discount.partner_name && (
                            <div className="text-secondary small">
                              <i className="bi bi-person me-1"></i>{discount.partner_name}
                            </div>
                          )}
                        </td>
                        <td>
                          <TypeBadge type={discount.discount_type} value={discount.discount_value} />
                        </td>
                        <td>
                          {discount.max_discount_amount && (
                            <div className="text-secondary small">Max: {formatCurrency(discount.max_discount_amount)}</div>
                          )}
                          {discount.min_amount && (
                            <div className="text-secondary small">Min: {formatCurrency(discount.min_amount)}</div>
                          )}
                        </td>
                        <td>
                          <div className="fw-medium small" title={daysDisplay}>
                            {isAllDays ? 'All Days' : daysDisplay}
                            {activeDays.length > 3 && ` +${activeDays.length - 3}`}
                          </div>
                          {discount.applicable_time_start && discount.applicable_time_end && (
                            <div className="text-secondary small">
                              <i className="bi bi-clock me-1"></i>{discount.applicable_time_start} - {discount.applicable_time_end}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold small">
                            {discount.used_count} / {discount.usage_limit || '∞'}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div>{discount.start_date ? formatDate(discount.start_date) : 'No start'}</div>
                            <div className="text-secondary">→ {discount.end_date ? formatDate(discount.end_date) : 'No end'}</div>
                          </div>
                        </td>
                        <td className="text-center">
                          <StatusBadge isActive={discount.is_active} />
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            <button
                              className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '30px', height: '30px', padding: 0 }}
                              title="Edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/discounts/${discount.id}/edit?type=${discount.source}`);
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '30px', height: '30px', padding: 0 }}
                              title="View Details"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/discounts/${discount.id}?type=${discount.source}`);
                              }}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

export default DiscountsPage;