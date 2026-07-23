// src/pages/admin/MockTurfsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMockTurfs, deleteMockTurf, updateMockTurf } from '../../api/mockturfs';
import { parseFacilities } from '../../types/mockturf';
import type { MockTurf } from '../../types/mockturf';
import { exportData, sanitizeForExport } from '../../utils/exportUtils';

// ─── MockTurfsPage ─────────────────────────────────────────────────────────────
const MockTurfsPage: React.FC = () => {
  const navigate = useNavigate();

  const [turfs, setTurfs] = useState<MockTurf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchTurfs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listMockTurfs();
      setTurfs(data);
    } catch {
      setError('Failed to load mock turfs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurfs();
  }, [fetchTurfs]);

  const filtered = turfs.filter((t) => {
    const statusOk =
      filter === 'all' ? true : filter === 'active' ? t.is_active : !t.is_active;
    if (!statusOk) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q) ||
      t.phone_number.includes(q)
    );
  });

  const handleToggle = async (t: MockTurf) => {
    setTogglingId(t.id);
    try {
      const updated = await updateMockTurf(t.id, { is_active: !t.is_active });
      setTurfs((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch {
      alert('Failed to update status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (t: MockTurf) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    setDeletingId(t.id);
    try {
      await deleteMockTurf(t.id);
      setTurfs((prev) => prev.filter((m) => m.id !== t.id));
    } catch {
      alert('Failed to delete mock turf.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Export Data ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (filtered.length === 0) {
      alert('No mock turfs to export.');
      return;
    }

    setIsExporting(true);
    try {
      const exportDataArray = sanitizeForExport(
        filtered.map(turf => {
          const fac = parseFacilities(turf.facilities);
          const activeFacilities = Object.entries(fac)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(', ');

          return {
            'Mock Turf ID': turf.id,
            'Name': turf.name,
            'Address': turf.address || '',
            'Phone': turf.phone_number || '',
            'Status': turf.is_active ? 'Active' : 'Inactive',
            'Facilities': activeFacilities || 'None',
            'Image URL': turf.image_url || '',
          };
        })
      );

      exportData(exportDataArray, {
        fileName: `mock_turfs_export_${new Date().toISOString().split('T')[0]}`,
        format: 'excel',
        sheetName: 'Mock Turfs',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div className="animate__animated animate__fadeInUp">
          <h1 className="h3 mb-0 fw-bold">
            <i className="bi bi-grid-3x3-gap-fill text-success me-2"></i>Mock Turfs
          </h1>
          <p className="text-secondary mb-0 small">
            {isLoading ? 'Loading…' : `${turfs.length} mock turf${turfs.length !== 1 ? 's' : ''}`}
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
            onClick={() => navigate('/admin/mock-turfs/new')}
          >
            <i className="bi bi-plus-circle me-1"></i> Add Mock Turf
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
                placeholder="Search by name, address, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderColor: '#e9ecef' }}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {(['all', 'active', 'inactive'] as const).map((f) => {
                const count =
                  f === 'all'
                    ? turfs.length
                    : turfs.filter((t) => (f === 'active' ? t.is_active : !t.is_active))
                        .length;
                return (
                  <button
                    key={f}
                    className={`btn btn-sm rounded-pill px-3 ${filter === f ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setFilter(f)}
                    style={{ fontWeight: 500 }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className="badge bg-light text-dark ms-1 rounded-pill">{count}</span>
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
          <p className="mt-3 text-secondary small">Loading mock turfs…</p>
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
              {search ? 'No mock turfs match your search.' : 'No mock turfs found.'}
            </p>
            {!search && (
              <button
                className="btn btn-success rounded-pill px-4 mt-2"
                onClick={() => navigate('/admin/mock-turfs/new')}
              >
                <i className="bi bi-plus-circle me-1"></i> Add First Mock Turf
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="card border-0 shadow-sm animate__animated animate__fadeInUp" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
              <thead className="bg-light">
                <tr>
                  <th className="text-uppercase text-secondary fw-bold small ps-3" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Image</th>
                  <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Name</th>
                  <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Address</th>
                  <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Phone</th>
                  <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Facilities</th>
                  <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Status</th>
                  <th className="text-uppercase text-secondary fw-bold small text-center" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const fac = parseFacilities(t.facilities);
                  const activeFac = Object.entries(fac)
                    .filter(([, v]) => v)
                    .map(([k]) => k);
                  return (
                    <tr key={t.id} className="table-row-hover">
                      <td className="ps-3">
                        {t.image_url ? (
                          <img
                            src={t.image_url}
                            alt={t.name}
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
                      </td>
                      <td className="fw-semibold">{t.name}</td>
                      <td>
                        <div className="text-secondary small text-truncate" style={{ maxWidth: '180px' }}>
                          {t.address}
                        </div>
                      </td>
                      <td className="fw-medium">{t.phone_number}</td>
                      <td>
                        {activeFac.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {activeFac.slice(0, 3).map((f) => (
                              <span key={f} className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 small">
                                {f}
                              </span>
                            ))}
                            {activeFac.length > 3 && (
                              <span className="text-secondary small">+{activeFac.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 ${t.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          <span className={`d-inline-block rounded-circle me-1 ${t.is_active ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '5px', height: '5px' }}></span>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="Edit"
                            onClick={() => navigate(`/admin/mock-turfs/${t.id}/edit`)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center ${
                              t.is_active ? 'btn-outline-warning' : 'btn-outline-success'
                            }`}
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title={t.is_active ? 'Deactivate' : 'Activate'}
                            disabled={togglingId === t.id}
                            onClick={() => handleToggle(t)}
                          >
                            {togglingId === t.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : t.is_active ? (
                              <i className="bi bi-lock"></i>
                            ) : (
                              <i className="bi bi-unlock"></i>
                            )}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="Delete"
                            disabled={deletingId === t.id}
                            onClick={() => handleDelete(t)}
                          >
                            {deletingId === t.id ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="bi bi-trash"></i>
                            )}
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
        .btn-outline-warning {
          transition: all 0.2s ease;
        }
        .btn-outline-warning:hover {
          transform: translateY(-2px);
        }
        .btn-outline-danger {
          transition: all 0.2s ease;
        }
        .btn-outline-danger:hover {
          transform: translateY(-2px);
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

export default MockTurfsPage;