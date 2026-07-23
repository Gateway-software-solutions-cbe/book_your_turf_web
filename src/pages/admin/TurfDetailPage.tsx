// src/pages/admin/TurfDetailPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTurf, updateTurf } from '../../api/turfs';
import type { Turf, TurfStatus, DayKey } from '../../types/turf';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const formatTime = (t: string) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || '0').toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const FACILITY_ICONS: Record<string, string> = {
  CCTV: '📷',
  wifi: '📶',
  parking: '🅿️',
  'Rest room': '🚻',
  'Sports kits': '👟',
  'Dressing room': '👔',
  'Music systems': '🔊',
  'Drinking water': '💧',
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: TurfStatus }> = ({ status }) => {
  const config = {
    Approved: { class: 'bg-success', label: 'Approved' },
    Pending: { class: 'bg-warning text-dark', label: 'Pending' },
    Rejected: { class: 'bg-danger', label: 'Rejected' },
  };
  const c = config[status] || config.Pending;
  return (
    <span className={`badge rounded-pill px-3 py-2 fw-semibold ${c.class}`} style={{ fontSize: '13px' }}>
      <span
        className={`d-inline-block rounded-circle me-1 ${
          status === 'Approved' ? 'bg-white' : status === 'Pending' ? 'bg-dark' : 'bg-white'
        }`}
        style={{ width: '6px', height: '6px' }}
      ></span>
      {c.label}
    </span>
  );
};

// ─── Image Carousel ────────────────────────────────────────────────────────────
const ImageCarousel: React.FC<{ images: { id: number; url: string }[]; name: string }> = ({
  images,
  name,
}) => {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 3500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [images.length]);

  const goTo = (i: number) => {
    setActive(i);
    stopTimer();
    startTimer();
  };

  if (images.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center bg-light rounded-3" style={{ height: '200px' }}>
        <div className="text-center text-secondary">
          <i className="bi bi-image fs-1 d-block mb-2"></i>
          <span className="fw-medium">No images uploaded</span>
          <span className="d-block small text-secondary mt-1">Upload images to showcase this turf</span>
        </div>
      </div>
    );
  }

  return (
    <div className="position-relative bg-dark rounded-3 overflow-hidden" style={{ height: '200px' }}>
      <div className="position-relative w-100 h-100">
        {images.map((img, i) => (
          <img
            key={img.id}
            src={img.url}
            alt={`${name} — photo ${i + 1}`}
            className={`position-absolute top-0 start-0 w-100 h-100 object-fit-cover transition-opacity ${
              i === active ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transition: 'opacity 0.5s ease' }}
          />
        ))}

        {images.length > 1 && (
          <>
            <button
              className="position-absolute top-50 start-0 translate-middle-y btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px', padding: 0, zIndex: 10, opacity: 0.7 }}
              onClick={() => goTo((active - 1 + images.length) % images.length)}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              className="position-absolute top-50 end-0 translate-middle-y btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px', padding: 0, zIndex: 10, opacity: 0.7 }}
              onClick={() => goTo((active + 1) % images.length)}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-center gap-1 pb-2">
          {images.map((_, i) => (
            <button
              key={i}
              className={`rounded-circle border-0 p-0 ${
                i === active ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              style={{ width: '8px', height: '8px', cursor: 'pointer' }}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TurfDetailPage ────────────────────────────────────────────────────────────
const TurfDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const refetch = async () => {
    const fresh = await getTurf(Number(id));
    setTurf(fresh);
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getTurf(Number(id))
      .then(setTurf)
      .catch(() => setError('Failed to load turf details.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleStatusChange = async (status: TurfStatus) => {
    if (!turf) return;
    setIsUpdating(true);
    try {
      await updateTurf(turf.id, { status });
      await refetch();
    } catch {
      alert('Failed to update turf status.');
    } finally {
      setIsUpdating(false);
      setShowRejectModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary">Loading turf…</p>
        </div>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{error ?? 'Turf not found.'}</span>
          <Link to="/admin/turfs" className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Turfs
          </Link>
        </div>
      </div>
    );
  }

  const courtKeys = Object.keys(turf.timings ?? {});
  const hasDims =
    turf.dimension_data &&
    (turf.dimension_data.length || turf.dimension_data.breadth || turf.dimension_data.height);

  return (
    <div className="container-fluid px-4 py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin/turfs" className="text-decoration-none text-success">
              <i className="bi bi-grid-3x3-gap-fill me-1"></i>Turfs
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {turf.name}
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="row g-4 mb-4">
        <div className="col-lg-5">
          <ImageCarousel images={turf.images ?? []} name={turf.name} />
        </div>
        <div className="col-lg-7">
          <div className="d-flex flex-column h-100">
            <div>
              <h1 className="h2 mb-1">{turf.name}</h1>
              <div className="d-flex align-items-center gap-2 mb-3">
                <code className="bg-light px-2 py-1 rounded" style={{ fontSize: '12px' }}>
                  {turf.turf_code}
                </code>
                <StatusBadge status={turf.status} />
              </div>
            </div>

            {/* Premium Action Buttons */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <button
                className="btn px-4 py-2 rounded-pill shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 500,
                  border: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
                onClick={() => navigate(`/admin/turfs/${turf.id}/edit`)}
              >
                <i className="bi bi-pencil me-1"></i> Edit
              </button>

              {turf.status !== 'Approved' && (
                <button
                  className="btn px-4 py-2 rounded-pill shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
                    color: 'white',
                    fontWeight: 500,
                    border: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 176, 155, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 176, 155, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 176, 155, 0.4)';
                  }}
                  onClick={() => handleStatusChange('Approved')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Processing…</>
                  ) : (
                    <><i className="bi bi-check-circle me-1"></i> Approve</>
                  )}
                </button>
              )}

              {turf.status !== 'Rejected' && (
                <button
                  className="btn px-4 py-2 rounded-pill shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    fontWeight: 500,
                    border: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(245, 87, 108, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 87, 108, 0.4)';
                  }}
                  onClick={() => setShowRejectModal(true)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Processing…</>
                  ) : (
                    <><i className="bi bi-x-circle me-1"></i> Reject</>
                  )}
                </button>
              )}

              {turf.status !== 'Pending' && (
                <button
                  className="btn px-4 py-2 rounded-pill shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                    color: 'white',
                    fontWeight: 500,
                    border: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(253, 160, 133, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(253, 160, 133, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(253, 160, 133, 0.4)';
                  }}
                  onClick={() => handleStatusChange('Pending')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Processing…</>
                  ) : (
                    <><i className="bi bi-arrow-counterclockwise me-1"></i> Pending</>
                  )}
                </button>
              )}

              <button
                className="btn px-4 py-2 rounded-pill shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  fontWeight: 500,
                  border: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(79, 172, 254, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)';
                }}
                onClick={() => navigate(`/admin/partners/${turf.partner}`)}
              >
                <i className="bi bi-person me-1"></i> View Partner →
              </button>
            </div>

            {/* Quick Stats - Enhanced with color backgrounds */}
            <div className="row g-2 mt-auto">
              <div className="col-4 col-md-2">
                <div className="rounded-3 p-2 text-center" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                  <div className="fw-bold small text-success">{turf.game_type}</div>
                  <div className="text-secondary small" style={{ fontSize: '9px', fontWeight: '500' }}>Game Type</div>
                </div>
              </div>
              <div className="col-4 col-md-2">
                <div className="rounded-3 p-2 text-center" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' }}>
                  <div className="fw-bold small text-primary">{turf.courts}</div>
                  <div className="text-secondary small" style={{ fontSize: '9px', fontWeight: '500' }}>Courts</div>
                </div>
              </div>
              <div className="col-4 col-md-2">
                <div className="rounded-3 p-2 text-center" style={{ background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)' }}>
                  <div className="fw-bold small" style={{ color: '#e65100' }}>{turf.max_persons}</div>
                  <div className="text-secondary small" style={{ fontSize: '9px', fontWeight: '500' }}>Max Persons</div>
                </div>
              </div>
              <div className="col-4 col-md-2">
                <div className="rounded-3 p-2 text-center" style={{ background: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' }}>
                  <div className="fw-bold small" style={{ color: '#c62828' }}>{formatTime(turf.open_time)}</div>
                  <div className="text-secondary small" style={{ fontSize: '9px', fontWeight: '500' }}>Opens</div>
                </div>
              </div>
              <div className="col-4 col-md-2">
                <div className="rounded-3 p-2 text-center" style={{ background: 'linear-gradient(135deg, #f3e5f5, #e1bee7)' }}>
                  <div className="fw-bold small" style={{ color: '#6a1b9a' }}>{formatTime(turf.close_time)}</div>
                  <div className="text-secondary small" style={{ fontSize: '9px', fontWeight: '500' }}>Closes</div>
                </div>
              </div>
              <div className="col-4 col-md-2">
                <div className="rounded-3 p-2 text-center" style={{ background: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)' }}>
                  <div className="fw-bold small" style={{ color: '#00695c' }}>{turf.min_slots}</div>
                  <div className="text-secondary small" style={{ fontSize: '9px', fontWeight: '500' }}>Min Slots</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="row g-4">
        {/* Partner Card */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-person-badge text-success me-2"></i>Partner
              </h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Name</span>
                <span>
                  <Link to={`/admin/partners/${turf.partner}`} className="text-success text-decoration-none fw-semibold">
                    {turf.partner_name}
                  </Link>
                </span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="small fw-semibold text-secondary text-uppercase">Email</span>
                <span>
                  <a href={`mailto:${turf.partner_email}`} className="text-success text-decoration-none">
                    {turf.partner_email}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-geo-alt text-success me-2"></i>Location
              </h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Address</span>
                <span className="text-end small" style={{ maxWidth: '60%' }}>{turf.address}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="small fw-semibold text-secondary text-uppercase">District / State</span>
                <span className="text-end">
                  {turf.district}, {turf.state} – {turf.pincode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Advance & Commission Card */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-cash-stack text-success me-2"></i>Advance & Commission
              </h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Advance</span>
                <span className="fw-semibold">
                  {turf.advance_value}
                  {turf.advance_type === 'percentage' ? '%' : ' ₹'}
                  <span className="text-secondary small ms-1">({turf.advance_type})</span>
                </span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Commission</span>
                <span className="fw-semibold">
                  {turf.commission_value}
                  {turf.commission_type === 'percentage' ? '%' : ' ₹'}
                  <span className="text-secondary small ms-1">({turf.commission_type})</span>
                </span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="small fw-semibold text-secondary text-uppercase">Min Slots</span>
                <span className="fw-semibold">{turf.min_slots}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities Card */}
        <div className="col-md-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-grid-3x3-gap text-success me-2"></i>Facilities
              </h6>
              <div className="row g-1">
                {Object.entries(turf.facilities ?? {}).map(([key, val]) => (
                  <div key={key} className="col-6">
                    <div className={`d-flex align-items-center gap-2 p-2 rounded-3 ${val ? 'bg-success bg-opacity-10' : 'bg-light'}`}>
                      <span>{FACILITY_ICONS[key] ?? '•'}</span>
                      <span className="small fw-medium flex-grow-1">{key}</span>
                      {val ? (
                        <i className="bi bi-check-circle-fill text-success"></i>
                      ) : (
                        <i className="bi bi-x-circle-fill text-secondary"></i>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions & Meta */}
        <div className="col-md-6">
          <div className="row g-4 h-100">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-bold text-secondary mb-3">
                    <i className="bi bi-rulers text-success me-2"></i>Dimensions
                  </h6>
                  {hasDims && turf.dimension_data ? (
                    <div className="row g-2">
                      {(['length', 'breadth', 'height'] as const).map((k) => (
                        <div key={k} className="col-4">
                          <div className="bg-light rounded-3 p-2 text-center">
                            <div className="fw-bold">{turf.dimension_data![k]}</div>
                            <div className="text-secondary small">
                              {k}
                              <br />({turf.dimension_data!.unit})
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="col-4">
                        <div className="bg-light rounded-3 p-2 text-center">
                          <div className="fw-bold text-capitalize">{turf.dimension_data.turf_shape}</div>
                          <div className="text-secondary small">Shape</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary small mb-0">No dimension data available.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="fw-bold text-secondary mb-3">
                    <i className="bi bi-info-circle text-success me-2"></i>Meta
                  </h6>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="small fw-semibold text-secondary text-uppercase">Added</span>
                    <span>{formatDate(turf.created_at)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="small fw-semibold text-secondary text-uppercase">Partner ID</span>
                    <span>#{turf.partner}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2">
                    <span className="small fw-semibold text-secondary text-uppercase">Turf ID</span>
                    <span>#{turf.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description / Achievements */}
        {(turf.description || turf.achievements) && (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="row g-4">
                  {turf.description && (
                    <div className={turf.achievements ? 'col-md-6' : 'col-12'}>
                      <h6 className="fw-bold text-secondary mb-2">
                        <i className="bi bi-card-text text-success me-2"></i>Description
                      </h6>
                      <p className="text-secondary small mb-0">{turf.description}</p>
                    </div>
                  )}
                  {turf.achievements && (
                    <div className={turf.description ? 'col-md-6' : 'col-12'}>
                      <h6 className="fw-bold text-secondary mb-2">
                        <i className="bi bi-trophy text-success me-2"></i>Achievements
                      </h6>
                      <p className="text-secondary small mb-0">{turf.achievements}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Court Timings - Enhanced with better visual hierarchy */}
        {courtKeys.length > 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <h6 className="fw-bold text-secondary mb-0">
                    <i className="bi bi-clock text-success me-2"></i>
                    Court Timings & Pricing
                  </h6>
                  <span className="badge bg-success rounded-pill px-3 py-2">
                    {turf.courts} court{turf.courts !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="row g-3">
                  {courtKeys.map((key) => {
                    const period = turf.timings[key];
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div key={key} className="col-md-6">
                        <div className="border rounded-3 overflow-hidden shadow-sm">
                          <div className="px-3 py-2 d-flex justify-content-between align-items-center border-bottom" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
                            <span className="fw-semibold small">{label}</span>
                            <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 small">
                              <i className="bi bi-clock me-1"></i>
                              {formatTime(period.start_time)} – {formatTime(period.end_time)}
                            </span>
                          </div>
                          <div className="table-responsive">
                            <table className="table table-sm mb-0">
                              <thead>
                                <tr>
                                  {(Object.keys(DAY_LABELS) as DayKey[]).map((d) => (
                                    <th key={d} className="text-center small text-secondary fw-semibold bg-light">
                                      {DAY_LABELS[d]}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  {(Object.keys(DAY_LABELS) as DayKey[]).map((d) => (
                                    <td key={d} className="text-center fw-semibold small text-success">
                                      {formatCurrency(period.prices?.[d] ?? '0')}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="bg-white rounded-3 p-4"
            style={{ maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="fw-bold mb-2">Reject Turf</h5>
            <p className="text-secondary small">The partner will be notified that their turf has been rejected.</p>
            <div className="d-flex gap-2 justify-content-end mt-3">
              <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm rounded-pill px-3"
                onClick={() => handleStatusChange('Rejected')}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span> Processing…</>
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurfDetailPage;