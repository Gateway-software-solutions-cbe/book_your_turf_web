// src/pages/admin/UsersPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers } from '../../api/admin/users';
import type { User } from '../../types/admin/user';
import { exportData, sanitizeForExport, formatDateForExport, formatCurrencyForExport } from '../../utils/exportUtils';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || '0').toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination: React.FC<{
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <nav aria-label="User pagination">
      <ul className="pagination pagination-sm mb-0 flex-wrap">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link rounded-start" disabled={page === 1} onClick={() => onChange(page - 1)}>
            <i className="bi bi-chevron-left"></i> Prev
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
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ─── UsersPage ─────────────────────────────────────────────────────────────────
const UsersPage: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const handleFilterChange = (f: typeof activeFilter) => {
    setActiveFilter(f);
    setPage(1);
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(activeFilter === 'active' ? { is_active: true } : {}),
        ...(activeFilter === 'inactive' ? { is_active: false } : {}),
      };
      const data = await listUsers(params);
      setUsers(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err: unknown) {
      console.error('Fetch users error:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to load users.';
      setError(msg);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Export Data ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (users.length === 0) {
      alert('No users to export.');
      return;
    }

    setIsExporting(true);
    try {
      // Prepare the data for export
      const exportDataArray = sanitizeForExport(
        users.map(user => ({
          'User ID': user.id,
          'Name': user.name,
          'Email': user.email,
          'Phone': user.number || '',
          'Status': user.is_active ? 'Active' : 'Inactive',
          'Verified': user.is_verified ? 'Yes' : 'No',
          'Wallet Balance': formatCurrencyForExport(user.wallet_balance || '0'),
          'Game Coins': user.game_coins || 0,
          'Referral Code': user.referral_code || '',
          'Joined Date': formatDateForExport(user.created_at),
          // 'Total Bookings': user.total_bookings || 0,
          // 'Total Spent': formatCurrencyForExport(user.total_spent || '0'),
        }))
      );

      // Call the export function
      exportData(exportDataArray, {
        fileName: `users_export_${new Date().toISOString().split('T')[0]}`,
        format: 'excel',
        sheetName: 'Users',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const safeCount = totalCount ?? 0;
  const totalPages = Math.ceil(safeCount / PAGE_SIZE);
  const start = safeCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, safeCount);

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div className="animate__animated animate__fadeInUp">
          <h1 className="h3 mb-0 fw-bold">
            <i className="bi bi-people-fill text-success me-2"></i>Users
          </h1>
          <p className="text-secondary mb-0 small">
            {isLoading ? 'Loading…' : `${safeCount.toLocaleString()} total users`}
          </p>
        </div>
        <div className="d-flex gap-2 animate__animated animate__fadeInUp">
          <button
            className="btn btn-outline-success rounded-pill px-3"
            onClick={handleExport}
            disabled={isLoading || users.length === 0 || isExporting}
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

          <button
            className="btn btn-success rounded-pill px-4 shadow-sm"
            style={{ fontWeight: 500 }}
            onClick={() => navigate('/admin/users/new')}
          >
            <i className="bi bi-person-plus me-1"></i> Add User
          </button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mb-4 animate__animated animate__fadeInUp" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3">
          <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center">
            <div className="flex-grow-1 position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                className="form-control form-control-sm ps-5 rounded-pill"
                type="search"
                placeholder="Search by name, email, phone…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ borderColor: '#e9ecef' }}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  className={`btn btn-sm rounded-pill px-3 ${activeFilter === f ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => handleFilterChange(f)}
                  style={{ fontWeight: 500 }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── States ───────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 animate__animated animate__fadeIn">
          <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary small">Loading users…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between animate__animated animate__shakeX" role="alert" style={{ borderRadius: '12px' }}>
          <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={fetchUsers}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="text-center py-5 animate__animated animate__fadeIn">
          <div className="text-secondary">
            <i className="bi bi-person-x fs-1 d-block mb-3"></i>
            <p className="fw-semibold mb-1">
              {debouncedSearch ? 'No users match your search.' : 'No users found.'}
            </p>
            {!debouncedSearch && (
              <button
                className="btn btn-success rounded-pill px-4 mt-2"
                onClick={() => navigate('/admin/users/new')}
              >
                <i className="bi bi-person-plus me-1"></i> Add your first user
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {!isLoading && !error && users.length > 0 && (
        <>
          <div className="card border-0 shadow-sm animate__animated animate__fadeInUp" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold small ps-3" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>User</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Phone</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Wallet</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Coins</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Referral</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Status</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Joined</th>
                    <th className="text-uppercase text-secondary fw-bold small text-center" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr
                      key={u.id}
                      className="table-row-hover"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ps-3">
                        <div className="d-flex align-items-center gap-2">
                          {u.profile_image_url ? (
                            <img
                              src={u.profile_image_url}
                              alt={u.name}
                              className="rounded-circle object-fit-cover"
                              width="36"
                              height="36"
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: '36px', height: '36px', fontSize: '14px' }}
                            >
                              {u.name?.charAt(0).toUpperCase() ?? 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{u.name}</div>
                            <div className="small text-secondary text-truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-medium">{u.number}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1 fw-normal">
                          <i className="bi bi-wallet2 me-1"></i>
                          {formatCurrency(u.wallet_balance)}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 fw-normal">
                          <i className="bi bi-coin me-1"></i>
                          {u.game_coins.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <code className="bg-light px-2 py-1 rounded text-secondary" style={{ fontSize: '11px' }}>
                          {u.referral_code}
                        </code>
                      </td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          <span className={`d-inline-block rounded-circle me-1 ${u.is_active ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '5px', height: '5px' }}></span>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-secondary small">{formatDate(u.created_at)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="View details"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users/${u.id}`);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="Edit user"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users/${u.id}/edit`);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ───────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4 animate__animated animate__fadeInUp">
              <span className="small text-secondary">
                <i className="bi bi-info-circle me-1"></i>
                Showing <strong>{start}–{end}</strong> of <strong>{safeCount.toLocaleString()}</strong> users
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
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
        .form-control:focus {
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
        .btn-outline-primary {
          transition: all 0.2s ease;
        }
        .btn-outline-primary:hover {
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
      `}</style>
    </div>
  );
};

export default UsersPage;