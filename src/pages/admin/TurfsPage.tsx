// src/pages/admin/TurfsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTurfs } from '../../api/admin/turfs';
import type { Turf, TurfStatus } from '../../types/admin/turf';
import { exportData, sanitizeForExport, formatDateForExport } from '../../utils/exportUtils';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

const STATUS_FILTERS: Array<{ label: string; value: TurfStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

const GAME_ICONS: Record<string, string> = {
  'cricket & football': '⚽',
  'badminton': '🏸',
  'pickleball': '🏓',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: TurfStatus }> = ({ status }) => {
  const config = {
    Approved: { class: 'bg-success', label: 'Approved' },
    Pending: { class: 'bg-warning text-dark', label: 'Pending' },
    Rejected: { class: 'bg-danger', label: 'Rejected' },
  };
  const c = config[status] || config.Pending;
  return (
    <span className={`badge rounded-pill ${c.class}`}>
      <span className={`d-inline-block rounded-circle me-1 ${
        status === 'Approved' ? 'bg-white' :
        status === 'Pending' ? 'bg-dark' :
        'bg-white'
      }`} style={{ width: '5px', height: '5px' }}></span>
      {c.label}
    </span>
  );
};

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination: React.FC<{
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}> = ({ page, total, pageSize, onChange }) => {
  const totalPages = Math.ceil(total / pageSize);
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
    <nav aria-label="Turf pagination">
      <ul className="pagination pagination-sm mb-0 flex-wrap">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link rounded-start" disabled={page === 1} onClick={() => onChange(page - 1)}>
            <i className="bi bi-chevron-left"></i> Prev
          </button>
        </li>
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`ellipsis-${i}`} className="page-item disabled">
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

// ─── Helper to format court timings ──────────────────────────────────────────
const formatCourtTimings = (timings: any, courtIndex: number): string => {
  if (!timings) return '';
  
  const courtKey = `court_${courtIndex}`;
  const dayKey = `court_${courtIndex}_day`;
  const nightKey = `court_${courtIndex}_night`;
  
  let result = '';
  
  // Day timings
  if (timings[dayKey]) {
    const day = timings[dayKey];
    result += `Day: ${day.start_time || ''} - ${day.end_time || ''}`;
    if (day.prices) {
      const prices = Object.entries(day.prices)
        .map(([dayName, price]) => `${dayName}: ₹${price}`)
        .join(', ');
      result += ` | Prices: ${prices}`;
    }
  }
  
  // Night timings
  if (timings[nightKey]) {
    const night = timings[nightKey];
    if (result) result += ' | ';
    result += `Night: ${night.start_time || ''} - ${night.end_time || ''}`;
    if (night.prices) {
      const prices = Object.entries(night.prices)
        .map(([dayName, price]) => `${dayName}: ₹${price}`)
        .join(', ');
      result += ` | Prices: ${prices}`;
    }
  }
  
  return result;
};

// ─── Helper to get all court details ──────────────────────────────────────────
const getCourtDetails = (timings: any, courts: number): string => {
  if (!timings || courts === 0) return '';
  
  const details: string[] = [];
  for (let i = 1; i <= courts; i++) {
    const courtInfo = formatCourtTimings(timings, i);
    if (courtInfo) {
      details.push(`Court ${i}: ${courtInfo}`);
    }
  }
  return details.join('; ');
};

// ─── Helper to get day-wise prices ────────────────────────────────────────────
const getDayWisePrices = (timings: any, courtIndex: number): Record<string, string> => {
  const prices: Record<string, string> = {};
  if (!timings) return prices;
  
  const dayKey = `court_${courtIndex}_day`;
  const nightKey = `court_${courtIndex}_night`;
  
  if (timings[dayKey]?.prices) {
    Object.entries(timings[dayKey].prices).forEach(([day, price]) => {
      prices[`${day}_day`] = `₹${price}`;
    });
  }
  
  if (timings[nightKey]?.prices) {
    Object.entries(timings[nightKey].prices).forEach(([day, price]) => {
      prices[`${day}_night`] = `₹${price}`;
    });
  }
  
  return prices;
};

// ─── TurfsPage ─────────────────────────────────────────────────────────────────
const TurfsPage: React.FC = () => {
  const navigate = useNavigate();

  const [allTurfs, setAllTurfs] = useState<Turf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TurfStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const fetchTurfs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTurfs();
      if (Array.isArray(data)) {
        setAllTurfs(data);
      } else {
        setAllTurfs([]);
        setError('Received invalid data format from server. Expected an array.');
      }
    } catch (err: any) {
      console.error('Error fetching turfs:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load turfs. Please try again.';
      setError(errorMessage);
      setAllTurfs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurfs();
  }, [fetchTurfs]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  // ── Export Data ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (filtered.length === 0) {
      alert('No turfs to export.');
      return;
    }

    setIsExporting(true);
    try {
      const exportDataArray = sanitizeForExport(
        filtered.map(turf => {
          // Get court details
          const courtDetails = getCourtDetails(turf.timings, turf.courts);
          
          // Get day-wise prices for each court
          const priceDetails: Record<string, string> = {};
          if (turf.timings) {
            for (let i = 1; i <= turf.courts; i++) {
              const prices = getDayWisePrices(turf.timings, i);
              Object.entries(prices).forEach(([key, value]) => {
                priceDetails[`Court ${i} ${key.replace('_', ' ')}`] = value;
              });
            }
          }
          
          return {
            // Basic Information
            'Turf ID': turf.id,
            'Name': turf.name,
            'Turf Code': turf.turf_code || '',
            'Partner ID': turf.partner || '',
            'Partner Name': turf.partner_name || '',
            'Partner Email': turf.partner_email || '',
            'Game Type': turf.game_type || '',
            'Status': turf.status,
            
            // Location Details
            'Address': turf.address || '',
            'District': turf.district || '',
            'State': turf.state || '',
            'Pincode': turf.pincode || '',
            'Latitude': turf.latitude || '',
            'Longitude': turf.longitude || '',
            
            // Capacity & Configuration
            'Total Courts': turf.courts || 0,
            'Max Persons': turf.max_persons || 0,
            'Description': turf.description || '',
            'Achievements': turf.achievements || '',
            
            // Pricing & Commission
            'Advance Type': turf.advance_type || '',
            'Advance Value': turf.advance_value || '',
            'Commission Type': turf.commission_type || '',
            'Commission Value': turf.commission_value || '',
            'Min Slots': turf.min_slots || 0,
            
            // Timings
            'Open Time': turf.open_time || '',
            'Close Time': turf.close_time || '',
            'Created Date': formatDateForExport(turf.created_at),
            
            // Court & Price Details
            'Court Details': courtDetails || 'No court details available',
            
            // Day-wise Prices (Dynamic)
            ...priceDetails,
            
            // Facilities (Yes/No)
            'CCTV': turf.facilities?.CCTV ? 'Yes' : 'No',
            'WiFi': turf.facilities?.wifi ? 'Yes' : 'No',
            'Parking': turf.facilities?.parking ? 'Yes' : 'No',
            'Rest Room': turf.facilities?.['Rest room'] ? 'Yes' : 'No',
            'Sports Kits': turf.facilities?.['Sports kits'] ? 'Yes' : 'No',
            'Dressing Room': turf.facilities?.['Dressing room'] ? 'Yes' : 'No',
            'Music Systems': turf.facilities?.['Music systems'] ? 'Yes' : 'No',
            'Drinking Water': turf.facilities?.['Drinking water'] ? 'Yes' : 'No',
            
            // Dimension Data
            'Turf Shape': turf.dimension_data?.turf_shape || '',
            'Length (feet)': turf.dimension_data?.length || '',
            'Breadth (feet)': turf.dimension_data?.breadth || '',
            'Height (feet)': turf.dimension_data?.height || '',
            'Unit': turf.dimension_data?.unit || '',
          };
        })
      );

      exportData(exportDataArray, {
        fileName: `turfs_export_${new Date().toISOString().split('T')[0]}`,
        format: 'excel',
        sheetName: 'Turfs',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = useMemo(() => {
    return allTurfs.filter((t) => {
      const statusMatch = statusFilter === 'all' || t.status === statusFilter;
      if (!statusMatch) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.turf_code.toLowerCase().includes(q) ||
        t.partner_name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q) ||
        t.state?.toLowerCase().includes(q) ||
        t.district?.toLowerCase().includes(q)
      );
    });
  }, [allTurfs, statusFilter, searchQuery]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const counts = useMemo(
    () => ({
      all: allTurfs.length,
      Pending: allTurfs.filter((t) => t.status === 'Pending').length,
      Approved: allTurfs.filter((t) => t.status === 'Approved').length,
      Rejected: allTurfs.filter((t) => t.status === 'Rejected').length,
    }),
    [allTurfs]
  );

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div className="animate__animated animate__fadeInUp">
          <h1 className="h3 mb-0 fw-bold">
            <i className="bi bi-grid-3x3-gap-fill text-success me-2"></i>Turfs
          </h1>
          <p className="text-secondary mb-0 small">
            {isLoading ? 'Loading…' : `${filtered.length} of ${allTurfs.length} turfs`}
          </p>
        </div>
        <div className="d-flex gap-2 animate__animated animate__fadeInUp">
          <button
            className="btn btn-outline-success rounded-pill px-3"
            onClick={handleExport}
            disabled={isLoading || filtered.length === 0 || isExporting}
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
            onClick={() => navigate('/admin/turfs/new')}
          >
            <i className="bi bi-plus-circle me-1"></i> Add Turf
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
                placeholder="Search by name, code, partner, state…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderColor: '#e9ecef' }}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => {
                const count = f.value === 'all' ? counts.all : counts[f.value as TurfStatus];
                return (
                  <button
                    key={f.value}
                    className={`btn btn-sm rounded-pill px-3 ${statusFilter === f.value ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setStatusFilter(f.value as TurfStatus | 'all')}
                    style={{ fontWeight: 500 }}
                  >
                    {f.label}
                    {!isLoading && (
                      <span className="badge bg-light text-dark ms-1 rounded-pill">{count}</span>
                    )}
                  </button>
                );
              })}
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
          <p className="mt-3 text-secondary small">Loading turfs…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between animate__animated animate__shakeX" role="alert" style={{ borderRadius: '12px' }}>
          <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={fetchTurfs}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-5 animate__animated animate__fadeIn">
          <div className="text-secondary">
            <i className="bi bi-grid-3x3-gap-fill fs-1 d-block mb-3"></i>
            <p className="fw-semibold mb-1">
              {searchQuery
                ? 'No turfs match your search.'
                : `No ${statusFilter === 'all' ? '' : statusFilter} turfs found.`}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                className="btn btn-success rounded-pill px-4 mt-2"
                onClick={() => navigate('/admin/turfs/new')}
              >
                <i className="bi bi-plus-circle me-1"></i> Add your first turf
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {!isLoading && !error && paginated.length > 0 && (
        <>
          <div className="card border-0 shadow-sm animate__animated animate__fadeInUp" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold small ps-3" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Turf</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Game</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Partner</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Location</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Status</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Added</th>
                    <th className="text-uppercase text-secondary fw-bold small text-center" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((turf) => (
                    <tr
                      key={turf.id}
                      className="table-row-hover"
                      onClick={() => navigate(`/admin/turfs/${turf.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ps-3">
                        <div className="d-flex align-items-center gap-2">
                          {turf.images?.length > 0 ? (
                            <img
                              src={turf.images[0].url}
                              alt={turf.name}
                              className="rounded object-fit-cover"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div
                              className="rounded bg-light d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px', fontSize: '18px' }}
                            >
                              🏟
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{turf.name}</div>
                            <code className="bg-light px-1 py-0 rounded text-secondary" style={{ fontSize: '10px' }}>
                              {turf.turf_code}
                            </code>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="d-flex align-items-center gap-1">
                          <span>{GAME_ICONS[turf.game_type] ?? '🏅'}</span>
                          <span className="small text-secondary">{turf.game_type}</span>
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold small">{turf.partner_name}</div>
                      </td>
                      <td>
                        <div className="small">{turf.district}</div>
                        <div className="small text-secondary">{turf.state}</div>
                      </td>
                      <td>
                        <StatusBadge status={turf.status} />
                      </td>
                      <td className="text-secondary small">{formatDate(turf.created_at)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          title="View details"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/turfs/${turf.id}`);
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

          {/* ── Pagination ───────────────────────────────────────────────────── */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4 animate__animated animate__fadeInUp">
            <span className="small text-secondary">
              <i className="bi bi-info-circle me-1"></i>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <Pagination
              page={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </div>
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

export default TurfsPage;