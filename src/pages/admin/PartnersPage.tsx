// src/pages/admin/PartnersPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPartners, updatePartner } from '../../api/partners';
import type { Partner, PartnerFilterStatus } from '../../types/partner';
import { usePermission, PERMISSIONS } from '../../hooks/usePermission';
import { exportData, sanitizeForExport, formatDateForExport } from '../../utils/exportUtils';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const filterPartners = (partners: Partner[], status: PartnerFilterStatus, query: string) => {
  let filtered = partners;

  if (status === 'active') filtered = filtered.filter((p) => p.is_active);
  if (status === 'inactive') filtered = filtered.filter((p) => !p.is_active);
  if (status === 'verified') filtered = filtered.filter((p) => p.is_verified);
  if (status === 'unverified') filtered = filtered.filter((p) => !p.is_verified);

  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.number.includes(q),
    );
  }

  return filtered;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── Status Badge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ active: boolean; verified: boolean }> = ({ active, verified }) => (
  <div className="d-flex flex-column gap-1">
    <span className={`badge rounded-pill ${active ? 'bg-success' : 'bg-secondary'}`}>
      <span className={`d-inline-block rounded-circle me-1 ${active ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
      {active ? 'Active' : 'Inactive'}
    </span>
    <span className={`badge rounded-pill ${verified ? 'bg-primary' : 'bg-secondary'}`}>
      <span className={`d-inline-block rounded-circle me-1 ${verified ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
      {verified ? 'Verified' : 'Unverified'}
    </span>
  </div>
);

// ─── PartnersPage ──────────────────────────────────────────────────────────────

const PartnersPage: React.FC = () => {
  const navigate = useNavigate();
  const canCreate = usePermission(PERMISSIONS.PARTNERS_CREATE);
  const canEdit = usePermission(PERMISSIONS.PARTNERS_EDIT);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PartnerFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPartners();
      if (Array.isArray(data)) {
        setPartners(data);
      } else {
        setPartners([]);
        setError('Received invalid data format from server.');
      }
    } catch (err: any) {
      console.error('Error fetching partners:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load channel partners. Please try again.';
      setError(errorMessage);
      setPartners([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // ── Toggle Active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (partner: Partner) => {
    setTogglingId(partner.id);
    try {
      const updated = await updatePartner(partner.id, {
        is_active: !partner.is_active,
        ...(!partner.is_active ? { deactivation_reason: undefined } : {}),
      });
      setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      alert('Failed to update partner status.');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Export Data ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (partners.length === 0) {
      alert('No partners to export.');
      return;
    }

    setIsExporting(true);
    try {
      const exportDataArray = sanitizeForExport(
        partners.map(partner => ({
          'Partner ID': partner.id,
          'Name': partner.name,
          'Email': partner.email,
          'Phone': partner.number || '',
          'Status': partner.is_active ? 'Active' : 'Inactive',
          'Verified': partner.is_verified ? 'Yes' : 'No',
          'Joined Date': formatDateForExport(partner.created_at),
          'Total Turfs': partner.turfs?.length || 0,
          'Deactivation Reason': partner.deactivation_reason || '',
        }))
      );

      exportData(exportDataArray, {
        fileName: `partners_export_${new Date().toISOString().split('T')[0]}`,
        format: 'excel',
        sheetName: 'Partners',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = filterPartners(partners, filterStatus, searchQuery);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div className="animate__animated animate__fadeInUp">
          <h1 className="h3 mb-0 fw-bold">
            <i className="bi bi-people-fill text-success me-2"></i>Channel Partners
          </h1>
          <p className="text-secondary mb-0 small">
            {isLoading ? 'Loading…' : `${partners.length} partner${partners.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <div className="d-flex gap-2 animate__animated animate__fadeInUp">
          <button
            className="btn btn-outline-success rounded-pill px-3"
            onClick={handleExport}
            disabled={isLoading || partners.length === 0 || isExporting}
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

          {canCreate && (
            <button
              className="btn btn-success rounded-pill px-4 shadow-sm"
              style={{ fontWeight: 500 }}
              onClick={() => navigate('/admin/partners/new')}
            >
              <i className="bi bi-person-plus me-1"></i> Add Partner
            </button>
          )}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderColor: '#e9ecef' }}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {(['all', 'active', 'inactive', 'verified', 'unverified'] as PartnerFilterStatus[]).map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm rounded-pill px-3 ${filterStatus === s ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterStatus(s)}
                  style={{ fontWeight: 500 }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
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
          <p className="mt-3 text-secondary small">Loading partners…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between animate__animated animate__shakeX" role="alert" style={{ borderRadius: '12px' }}>
          <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={fetchPartners}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-5 animate__animated animate__fadeIn">
          <div className="text-secondary">
            <i className="bi bi-person-x fs-1 d-block mb-3"></i>
            <p className="fw-semibold mb-1">
              {searchQuery || filterStatus !== 'all'
                ? 'No partners match your filters.'
                : 'No channel partners yet.'}
            </p>
            {canCreate && !searchQuery && filterStatus === 'all' && (
              <button
                className="btn btn-success rounded-pill px-4 mt-2"
                onClick={() => navigate('/admin/partners/new')}
              >
                <i className="bi bi-person-plus me-1"></i> Add your first partner
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {!isLoading && !error && filtered.length > 0 && (
        <>
          <div className="card border-0 shadow-sm animate__animated animate__fadeInUp" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold small ps-3" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Partner</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Phone</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Status</th>
                    <th className="text-uppercase text-secondary fw-bold small" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Joined</th>
                    <th className="text-uppercase text-secondary fw-bold small text-center" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((partner) => (
                    <tr
                      key={partner.id}
                      className="table-row-hover"
                      onClick={() => navigate(`/admin/partners/${partner.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ps-3">
                        <div className="d-flex align-items-center gap-2">
                          {partner.profile_image_url ? (
                            <img
                              src={partner.profile_image_url}
                              alt={partner.name}
                              className="rounded-circle object-fit-cover"
                              width="36"
                              height="36"
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: '36px', height: '36px', fontSize: '14px' }}
                            >
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{partner.name}</div>
                            <div className="small text-secondary text-truncate">{partner.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="fw-medium">{partner.number || '—'}</td>
                      <td>
                        <StatusBadge active={partner.is_active} verified={partner.is_verified} />
                      </td>
                      <td className="text-secondary small">{formatDate(partner.created_at)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="View details"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/partners/${partner.id}`);
                            }}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {canEdit && (
                            <>
                              <button
                                className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px', padding: 0 }}
                                title="Edit partner"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/partners/${partner.id}/edit`);
                                }}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center ${
                                  partner.is_active ? 'btn-outline-warning' : 'btn-outline-success'
                                }`}
                                style={{ width: '32px', height: '32px', padding: 0 }}
                                title={partner.is_active ? 'Deactivate' : 'Activate'}
                                disabled={togglingId === partner.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(partner);
                                }}
                              >
                                {togglingId === partner.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : partner.is_active ? (
                                  <i className="bi bi-lock"></i>
                                ) : (
                                  <i className="bi bi-unlock"></i>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        .btn-outline-primary {
          transition: all 0.2s ease;
        }
        .btn-outline-primary:hover {
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

export default PartnersPage;