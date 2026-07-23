// src/pages/admin/PartnerDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPartner, updatePartner, getPartnerTurfs } from '../../api/partners';
import type { Partner } from '../../types/partner';
import { usePermission, PERMISSIONS } from '../../hooks/usePermission';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── PartnerDetailPage ─────────────────────────────────────────────────────────
const PartnerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // const navigate = useNavigate();
  const canEdit = usePermission(PERMISSIONS.PARTNERS_EDIT);
  // const canDelete = usePermission(PERMISSIONS.PARTNERS_DELETE);

  const [partner, setPartner] = useState<Partner | null>(null);
  const [turfs, setTurfs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPartner = async () => {
      try {
        setIsLoading(true);
        const partnerData = await getPartner(Number(id));
        setPartner(partnerData);
        const partnerTurfs = await getPartnerTurfs(Number(id));
        setTurfs(partnerTurfs);
      } catch {
        setError('Failed to load partner details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartner();
  }, [id]);

  const refetch = async () => {
    const fresh = await getPartner(Number(id));
    setPartner(fresh);
  };

  const handleToggleActive = async () => {
    if (!partner) return;
    setIsToggling(true);
    try {
      await updatePartner(partner.id, { is_active: !partner.is_active });
      await refetch();
    } catch {
      alert('Failed to update partner status.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggleVerified = async () => {
    if (!partner) return;
    setIsToggling(true);
    try {
      await updatePartner(partner.id, { is_verified: !partner.is_verified });
      await refetch();
    } catch {
      alert('Failed to update verification status.');
    } finally {
      setIsToggling(false);
    }
  };

  // const handleDelete = async () => {
  //   if (!partner) return;
  //   if (!window.confirm(`Delete partner "${partner.name}"? This cannot be undone.`)) return;
  //   setIsDeleting(true);
  //   try {
  //     await deletePartner(partner.id);
  //     navigate('/admin/partners', { replace: true });
  //   } catch {
  //     alert('Failed to delete partner.');
  //     setIsDeleting(false);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary">Loading partner…</p>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{error ?? 'Partner not found.'}</span>
          <Link to="/admin/partners" className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Partners
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin/partners" className="text-decoration-none text-success">
              <i className="bi bi-people me-1"></i>Channel Partners
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {partner.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">
            <i className="bi bi-person-badge text-success me-2"></i>{partner.name}
          </h1>
          <p className="text-secondary mb-0 small">Partner ID #{partner.id}</p>
        </div>
        <div className="d-flex gap-2">
          {canEdit && (
            <Link
              to={`/admin/partners/${partner.id}/edit`}
              className="btn btn-success px-4 py-2 rounded-pill shadow-sm"
              style={{
                fontWeight: 500,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(25, 135, 84, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(25, 135, 84, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 135, 84, 0.2)';
              }}
            >
              <i className="bi bi-pencil me-1"></i> Edit
            </Link>
          )}
          {canEdit && (
            <button
              className={`btn px-4 py-2 rounded-pill shadow-sm ${
                partner.is_active ? 'btn-outline-warning' : 'btn-success'
              }`}
              style={{
                fontWeight: 500,
                transition: 'all 0.2s ease',
                boxShadow: partner.is_active
                  ? '0 2px 8px rgba(255, 193, 7, 0.15)'
                  : '0 2px 8px rgba(25, 135, 84, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = partner.is_active
                  ? '0 4px 16px rgba(255, 193, 7, 0.25)'
                  : '0 4px 16px rgba(25, 135, 84, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = partner.is_active
                  ? '0 2px 8px rgba(255, 193, 7, 0.15)'
                  : '0 2px 8px rgba(25, 135, 84, 0.2)';
              }}
              onClick={handleToggleActive}
              disabled={isToggling}
            >
              {isToggling ? (
                <><span className="spinner-border spinner-border-sm me-1"></span> Processing…</>
              ) : partner.is_active ? (
                <><i className="bi bi-lock me-1"></i> Deactivate</>
              ) : (
                <><i className="bi bi-unlock me-1"></i> Activate</>
              )}
            </button>
          )}
          {/* {canDelete && (
            <button
              className="btn btn-outline-danger px-4 py-2 rounded-pill"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ fontWeight: 500 }}
            >
              {isDeleting ? (
                <><span className="spinner-border spinner-border-sm me-1"></span> Deleting…</>
              ) : (
                <><i className="bi bi-trash me-1"></i> Delete</>
              )}
            </button>
          )} */}
        </div>
      </div>

      {/* Row 1: Profile & Contact Info */}
      <div className="row g-4 mb-4">
        {/* Profile Card */}
        <div className="col-md-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex flex-column align-items-center text-center">
              {/* Avatar */}
              <div className="mb-3">
                {partner.profile_image_url ? (
                  <img
                    src={partner.profile_image_url}
                    alt={partner.name}
                    className="rounded-circle object-fit-cover border"
                    style={{ width: '80px', height: '80px' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center border"
                    style={{ width: '80px', height: '80px', fontSize: '32px', fontWeight: '700' }}
                  >
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <h5 className="fw-bold mb-1">{partner.name}</h5>

              {/* Status Badges */}
              <div className="d-flex gap-2 mb-3">
                <span className={`badge rounded-pill px-3 py-2 ${partner.is_active ? 'bg-success' : 'bg-secondary'}`}>
                  <span className={`d-inline-block rounded-circle me-1 ${partner.is_active ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
                  {partner.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`badge rounded-pill px-3 py-2 ${partner.is_verified ? 'bg-primary' : 'bg-secondary'}`}>
                  <span className={`d-inline-block rounded-circle me-1 ${partner.is_verified ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
                  {partner.is_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              {/* Verification Button */}
              {canEdit && (
                <button
                  className={`btn w-100 rounded-pill px-3 py-1 justify-content-center ${partner.is_verified ? 'btn-outline-secondary' : 'btn-success'}`}
                  onClick={handleToggleVerified}
                  disabled={isToggling}
                  style={{ maxWidth: '200px' }}
                >
                  {isToggling ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Processing…</>
                  ) : partner.is_verified ? (
                    <><i className="bi bi-x-circle me-1"></i> Revoke Verification</>
                  ) : (
                    <><i className="bi bi-check-circle me-1"></i> Mark as Verified</>
                  )}
                </button>
              )}

              {/* Deactivation Reason */}
              {partner.deactivation_reason && (
                <div className="mt-3 p-2 bg-danger bg-opacity-10 rounded-3 text-danger small w-100">
                  <i className="bi bi-info-circle me-1"></i>
                  <strong>Deactivation reason:</strong> {partner.deactivation_reason}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="col-md-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-info-circle text-success me-2"></i>Contact Info
              </h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Email</span>
                <span>
                  <a href={`mailto:${partner.email}`} className="text-success text-decoration-none">
                    {partner.email}
                  </a>
                </span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Phone</span>
                <span className="fw-medium">{partner.number || '—'}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="small fw-semibold text-secondary text-uppercase">Joined</span>
                <span className="fw-medium">{formatDate(partner.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Turfs - Full Width */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-grid-3x3-gap-fill text-success fs-5"></i>
                <h6 className="fw-bold text-secondary mb-0">
                  Turfs <span className="badge bg-success rounded-pill ms-1">{turfs.length}</span>
                </h6>
              </div>
              {turfs.length === 0 ? (
                <p className="text-secondary small">No turfs added yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="text-uppercase text-secondary small fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Name</th>
                        <th className="text-uppercase text-secondary small fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Turf Code</th>
                        <th className="text-uppercase text-secondary small fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Status</th>
                        <th className="text-uppercase text-secondary small fw-bold text-center" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turfs.map((turf) => (
                        <tr key={turf.id}>
                          <td className="fw-semibold">{turf.name}</td>
                          <td>
                            <code className="bg-light px-2 py-1 rounded" style={{ fontSize: '12px' }}>
                              {turf.turf_code}
                            </code>
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${
                              turf.status === 'Approved' ? 'bg-success' :
                              turf.status === 'Pending' ? 'bg-warning text-dark' :
                              'bg-danger'
                            }`}>
                              <span className={`d-inline-block rounded-circle me-1 ${
                                turf.status === 'Approved' ? 'bg-white' :
                                turf.status === 'Pending' ? 'bg-dark' :
                                'bg-white'
                              }`} style={{ width: '5px', height: '5px' }}></span>
                              {turf.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <Link
                              to={`/admin/turfs/${turf.id}`}
                              className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto"
                              style={{ width: '32px', height: '32px', padding: 0 }}
                              title="View turf"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDetailPage;