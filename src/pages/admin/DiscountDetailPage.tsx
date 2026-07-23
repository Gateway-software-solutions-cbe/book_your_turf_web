// src/pages/admin/DiscountDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  getAdminDiscount, 
  getPartnerDiscount, 
  deleteAdminDiscount, 
  deletePartnerDiscount,
  updateAdminDiscount,
  updatePartnerDiscount,
  DAYS, 
  DAY_LABELS, 
  DISCOUNT_TYPE_LABELS,
} from '../../api/discounts';
import {
  APPLICABLE_PAYMENT_TYPE_LABELS
} from '../../types/discount'
import type { Discount } from '../../types/discount';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

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

const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <span className={`badge rounded-pill px-3 py-2 ${isActive ? 'bg-success' : 'bg-secondary'}`}>
    <span className={`d-inline-block rounded-circle me-1 ${isActive ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
    {isActive ? 'ACTIVE' : 'INACTIVE'}
  </span>
);

const SourceBadge: React.FC<{ source: string }> = ({ source }) => (
  <span className={`badge rounded-pill px-3 py-2 ${source === 'admin' ? 'bg-primary' : 'bg-warning'}`}>
    {source === 'admin' ? 'PLATFORM FUNDED' : 'PARTNER FUNDED'}
  </span>
);

// ─── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="d-flex justify-content-between py-2 border-bottom">
    <span className="small fw-semibold text-secondary text-uppercase">{label}</span>
    <span className="fw-medium text-end">{children ?? '—'}</span>
  </div>
);

// ─── DiscountDetailPage ────────────────────────────────────────────────────────

const DiscountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const discountId = id ? parseInt(id, 10) : null;
  const isValidId = discountId !== null && !isNaN(discountId);

  const discountType = searchParams.get('type') || 'admin';
  const isAdmin = discountType === 'admin';

  const [discount, setDiscount] = useState<Discount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getDiscountFn = isAdmin ? getAdminDiscount : getPartnerDiscount;
  const updateDiscountFn = isAdmin ? updateAdminDiscount : updatePartnerDiscount;
  const deleteDiscountFn = isAdmin ? deleteAdminDiscount : deletePartnerDiscount;

  const refetch = async () => {
    if (!isValidId) return;
    try {
      const fresh = await getDiscountFn(discountId);
      setDiscount(fresh);
    } catch (err) {
      console.error('Refetch error:', err);
      setError(`Failed to load ${isAdmin ? 'platform' : 'partner'} discount details.`);
    }
  };

  useEffect(() => {
    if (!isValidId) {
      setError('Invalid discount ID.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    getDiscountFn(discountId)
      .then(setDiscount)
      .catch((err) => {
        console.error('Fetch error:', err);
        if (isAdmin) {
          getPartnerDiscount(discountId)
            .then(setDiscount)
            .catch(() => {
              setError(`Failed to load discount details.`);
            });
        } else {
          getAdminDiscount(discountId)
            .then(setDiscount)
            .catch(() => {
              setError(`Failed to load discount details.`);
            });
        }
      })
      .finally(() => setIsLoading(false));
  }, [discountId, isAdmin]);

  const handleToggleActive = async () => {
    if (!discount) return;
    setIsToggling(true);
    try {
      await updateDiscountFn(discount.id, { is_active: !discount.is_active });
      await refetch();
    } catch {
      alert('Failed to update discount status.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!discount) return;
    if (!window.confirm(`Delete discount "${discount.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteDiscountFn(discount.id);
      navigate('/admin/discounts', { replace: true });
    } catch {
      alert('Failed to delete discount.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary small">Loading discount…</p>
        </div>
      </div>
    );
  }

  if (error || !discount) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error ?? 'Discount not found.'}</span>
          <Link to="/admin/discounts" className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Discounts
          </Link>
        </div>
      </div>
    );
  }

  const activeDays = DAYS.filter(day => discount[day]);
  const isAllDays = activeDays.length === 7;
  const daysDisplay = isAllDays 
    ? 'All Days' 
    : activeDays.map(d => DAY_LABELS[d]).join(', ');

  const isAdminSource = discount.source === 'admin';

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin/discounts" className="text-decoration-none text-success">
              <i className="bi bi-tags me-1"></i>Discounts
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {discount.name}
          </li>
        </ol>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">
            <i className="bi bi-tag text-success me-2"></i>{discount.name}
          </h1>
          <p className="text-secondary small mb-0">
            Discount #{discount.id} · <SourceBadge source={discount.source} /> · 
            Created by {discount.created_by_admin_name}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link
            to={`/admin/discounts/${discount.id}/edit?type=${discount.source}`}
            className="btn btn-outline-primary rounded-pill px-3"
          >
            <i className="bi bi-pencil me-1"></i> Edit
          </Link>
          <button
            className={`btn rounded-pill px-3 ${discount.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
            onClick={handleToggleActive}
            disabled={isToggling}
          >
            {isToggling ? (
              <><span className="spinner-border spinner-border-sm me-1"></span></>
            ) : discount.is_active ? (
              <><i className="bi bi-lock me-1"></i> Deactivate</>
            ) : (
              <><i className="bi bi-unlock me-1"></i> Activate</>
            )}
          </button>
          <button
            className="btn btn-outline-danger rounded-pill px-3"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <><span className="spinner-border spinner-border-sm me-1"></span></>
            ) : (
              <><i className="bi bi-trash me-1"></i> Delete</>
            )}
          </button>
        </div>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#e8f5e9' }}>
                <i className="bi bi-percent text-success fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Discount Value</div>
                <div className="fw-bold fs-5">
                  {discount.discount_type === 'percentage' 
                    ? `${discount.discount_value}%` 
                    : formatCurrency(discount.discount_value)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#e3f2fd' }}>
                <i className="bi bi-bar-chart text-primary fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Usage</div>
                <div className="fw-bold fs-5">
                  {discount.used_count} / {discount.usage_limit || '∞'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#fff3e0' }}>
                <i className="bi bi-calendar3 text-warning fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Validity</div>
                <div className="fw-semibold small">
                  {discount.start_date ? formatDate(discount.start_date) : 'No start'} 
                  {discount.end_date ? ` → ${formatDate(discount.end_date)}` : ' → No end'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-body d-flex align-items-center gap-3 p-3">
              <div className="rounded-circle p-2 flex-shrink-0" style={{ background: '#fce4ec' }}>
                <i className="bi bi-shield-check text-danger fs-4"></i>
              </div>
              <div className="min-w-0">
                <div className="small text-secondary text-uppercase fw-semibold">Status</div>
                <div><StatusBadge isActive={discount.is_active} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Cards ────────────────────────────────────────────────────────── */}
      <div className="row g-4">
        {/* Basic Information */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-info-circle text-success me-2"></i>Basic Information
              </h6>
            </div>
            <div className="card-body">
              <InfoRow label="Name">{discount.name}</InfoRow>
              <InfoRow label="Description">{discount.description || '—'}</InfoRow>
              <InfoRow label="Source">
                <SourceBadge source={discount.source} />
              </InfoRow>
              <InfoRow label="Discount Type">
                {DISCOUNT_TYPE_LABELS[discount.discount_type as keyof typeof DISCOUNT_TYPE_LABELS] || discount.discount_type}
              </InfoRow>
              <InfoRow label="Discount Value">
                {discount.discount_type === 'percentage' 
                  ? `${discount.discount_value}%` 
                  : formatCurrency(discount.discount_value)}
              </InfoRow>
              {discount.max_discount_amount && (
                <InfoRow label="Max Discount">Max {formatCurrency(discount.max_discount_amount)}</InfoRow>
              )}
              {discount.min_amount && (
                <InfoRow label="Min Amount">Min {formatCurrency(discount.min_amount)}</InfoRow>
              )}
              <InfoRow label="Min Slots">{discount.min_slots}</InfoRow>
              {(discount as any).applicable_payment_type && (
                <InfoRow label="Payment Type">
                  {APPLICABLE_PAYMENT_TYPE_LABELS[(discount as any).applicable_payment_type as keyof typeof APPLICABLE_PAYMENT_TYPE_LABELS] || (discount as any).applicable_payment_type}
                </InfoRow>
              )}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className="bi bi-clock text-success me-2"></i>Schedule
              </h6>
            </div>
            <div className="card-body">
              <InfoRow label="Applicable Days">{daysDisplay}</InfoRow>
              <InfoRow label="Time Range">
                {discount.applicable_time_start && discount.applicable_time_end
                  ? `${discount.applicable_time_start} - ${discount.applicable_time_end}`
                  : 'All Day'
                }
              </InfoRow>
              <InfoRow label="Start Date">{discount.start_date ? formatDate(discount.start_date) : 'No start date'}</InfoRow>
              <InfoRow label="End Date">{discount.end_date ? formatDate(discount.end_date) : 'No end date'}</InfoRow>
              <InfoRow label="Usage Limit">
                {discount.usage_limit ? `${discount.usage_limit} uses` : 'Unlimited'}
              </InfoRow>
              <InfoRow label="Used Count">{discount.used_count} times</InfoRow>
            </div>
          </div>
        </div>

        {/* Source Details */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-transparent border-0 pt-3 pb-0">
              <h6 className="fw-bold text-secondary mb-0">
                <i className={`bi ${isAdminSource ? 'bi-building' : 'bi-person-badge'} text-success me-2`}></i>
                {isAdminSource ? 'Platform Details' : 'Partner Details'}
              </h6>
            </div>
            <div className="card-body">
              {isAdminSource ? (
                <>
                  <InfoRow label="Created By">{discount.created_by_admin_name}</InfoRow>
                  <InfoRow label="Applicable Turfs">
                    {discount.applicable_turfs && discount.applicable_turfs.length > 0
                      ? `${discount.applicable_turfs.length} turfs selected`
                      : discount.applicable_state || discount.applicable_district 
                        ? 'Based on location' 
                        : 'All Turfs'
                    }
                  </InfoRow>
                  {discount.applicable_turfs && discount.applicable_turfs.length > 0 && (
                    <InfoRow label="Turf IDs">
                      {discount.applicable_turfs.join(', ')}
                    </InfoRow>
                  )}
                  <InfoRow label="State">{discount.applicable_state || 'All'}</InfoRow>
                  <InfoRow label="District">{discount.applicable_district || 'All'}</InfoRow>
                </>
              ) : (
                <>
                  <InfoRow label="Partner">
                    {discount.partner ? (
                      <Link to={`/admin/partners/${discount.partner}`} className="text-success text-decoration-none">
                        {discount.partner_name}
                      </Link>
                    ) : '—'}
                  </InfoRow>
                  <InfoRow label="Turf">
                    {discount.turf ? (
                      <Link to={`/admin/turfs/${discount.turf}`} className="text-success text-decoration-none">
                        {discount.turf_name}
                      </Link>
                    ) : '—'}
                  </InfoRow>
                  <InfoRow label="Created By">{discount.created_by_admin_name}</InfoRow>
                </>
              )}
              <InfoRow label="Created At">{formatDateTime(discount.created_at)}</InfoRow>
              <InfoRow label="Updated At">{formatDateTime(discount.updated_at)}</InfoRow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountDetailPage;