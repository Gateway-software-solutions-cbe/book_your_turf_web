// src/pages/admin/EnquiryDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEnquiry, updateEnquiry, ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_COLORS } from '../../api/admin/enquiries';
import type { Enquiry, EnquiryStatus } from '../../types/admin/enquiry';

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Info Row ──────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="d-flex justify-content-between py-2 border-bottom">
    <span className="small fw-semibold text-secondary text-uppercase">{label}</span>
    <span className="fw-medium text-end">{children ?? '—'}</span>
  </div>
);

// ─── EnquiryDetailPage ─────────────────────────────────────────────────────────

const EnquiryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EnquiryStatus | ''>('');

  const numericId = Number(id);
  if (!id || isNaN(numericId)) {
    return <div className="text-center py-5"><p className="text-danger">Invalid enquiry ID</p></div>;
  }

  const refetch = async () => {
    const fresh = await getEnquiry(numericId);
    setEnquiry(fresh);
    setSelectedStatus(fresh.status);
  };

  useEffect(() => {
    setIsLoading(true);
    getEnquiry(numericId)
      .then((data) => {
        setEnquiry(data);
        setSelectedStatus(data.status);
      })
      .catch(() => setError('Failed to load enquiry details.'))
      .finally(() => setIsLoading(false));
  }, [numericId]);

  const handleStatusChange = async () => {
    if (!enquiry || !selectedStatus || selectedStatus === enquiry.status) return;
    if (selectedStatus === 'account_created') {
      alert('Account Created status cannot be changed manually.');
      return;
    }
    setIsUpdating(true);
    try {
      const updated = await updateEnquiry(enquiry.id, { status: selectedStatus });
      setEnquiry(updated);
      setSelectedStatus(updated.status);
    } catch {
      alert('Failed to update enquiry status.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary small">Loading enquiry…</p>
        </div>
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error ?? 'Enquiry not found.'}</span>
          <Link to="/admin/enquiries" className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Enquiries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin/enquiries" className="text-decoration-none text-success">
              <i className="bi bi-envelope-paper me-1"></i>Enquiries
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Enquiry #{enquiry.id}
          </li>
        </ol>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">
            <i className="bi bi-person-lines-fill text-success me-2"></i>
            Enquiry #{enquiry.id}
          </h1>
          <p className="text-secondary small mb-0">
            {enquiry.name || 'Anonymous'} · {formatDateTime(enquiry.created_at)}
          </p>
        </div>
        <Link to="/admin/enquiries" className="btn btn-outline-secondary rounded-pill px-3">
          <i className="bi bi-arrow-left me-1"></i> Back
        </Link>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#e8f5e9' }}>
                <i className="bi bi-person text-success fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Name</div>
                <div className="fw-semibold text-truncate">{enquiry.name || 'Anonymous'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#e3f2fd' }}>
                <i className="bi bi-telephone text-primary fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Phone</div>
                <div className="fw-semibold">{enquiry.number}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#fff3e0' }}>
                <i className="bi bi-check-circle text-warning fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Verified</div>
                <div className="fw-semibold">{enquiry.is_verified ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#fce4ec' }}>
                <i className="bi bi-tag text-danger fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Status</div>
                <div><StatusBadge status={enquiry.status} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Cards ────────────────────────────────────────────────────────── */}
      <div className="row g-4">
        {/* Basic Information */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-info-circle text-success me-2"></i>Basic Information
              </h6>
            </div>
            <div className="card-body">
              <InfoRow label="Name">{enquiry.name || '—'}</InfoRow>
              <InfoRow label="Phone">{enquiry.number}</InfoRow>
              <InfoRow label="Verified">
                {enquiry.is_verified ? (
                  <span className="badge bg-success rounded-pill">
                    <i className="bi bi-check-circle me-1"></i>Verified
                  </span>
                ) : (
                  <span className="badge bg-secondary rounded-pill">Not Verified</span>
                )}
              </InfoRow>
              <InfoRow label="Status">
                <StatusBadge status={enquiry.status} />
              </InfoRow>
              <InfoRow label="Location">{enquiry.location || '—'}</InfoRow>
            </div>
          </div>
        </div>

        {/* Partner Details & Actions */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-person-badge text-success me-2"></i>Partner Details
              </h6>
            </div>
            <div className="card-body">
              {enquiry.partner ? (
                <>
                  <InfoRow label="Partner ID">
                    <Link to={`/admin/partners/${enquiry.partner}`} className="text-success text-decoration-none">
                      #{enquiry.partner}
                    </Link>
                  </InfoRow>
                  <InfoRow label="Partner Name">
                    <Link to={`/admin/partners/${enquiry.partner}`} className="text-success text-decoration-none">
                      {enquiry.partner_name}
                    </Link>
                  </InfoRow>
                  <InfoRow label="Partner Email">
                    <a href={`mailto:${enquiry.partner_email}`} className="text-success text-decoration-none">
                      {enquiry.partner_email}
                    </a>
                  </InfoRow>
                </>
              ) : (
                <p className="text-secondary small">No partner account created yet.</p>
              )}
              <InfoRow label="Created At">{formatDateTime(enquiry.created_at)}</InfoRow>
              <InfoRow label="Updated At">{formatDateTime(enquiry.updated_at)}</InfoRow>
            </div>
          </div>
        </div>

        {/* Status Update */}
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-arrow-repeat text-success me-2"></i>Update Status
              </h6>
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as EnquiryStatus)}
                    disabled={isUpdating || enquiry.status === 'account_created'}
                  >
                    {ENQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {ENQUIRY_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-8 d-flex gap-2">
                  <button
                    className="btn btn-success rounded-pill px-4"
                    onClick={handleStatusChange}
                    disabled={isUpdating || enquiry.status === 'account_created' || selectedStatus === enquiry.status}
                  >
                    {isUpdating ? (
                      <><span className="spinner-border spinner-border-sm me-1"></span> Updating…</>
                    ) : (
                      <><i className="bi bi-check2 me-1"></i> Update Status</>
                    )}
                  </button>
                  {enquiry.status === 'account_created' && (
                    <span className="text-warning d-flex align-items-center">
                      <i className="bi bi-info-circle me-1"></i>
                      Account Created status is auto-set and cannot be changed manually.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryDetailPage;