// src/pages/admin/PartnerFormPage.tsx
import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPartner, createPartner, updatePartner } from '../../api/partners';
import type { CreatePartnerRequest, UpdatePartnerRequest } from '../../types/partner';

// ─── Form State ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  number: string;
  password: string;
  is_verified: boolean;
  is_active: boolean;
  deactivation_reason: string;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  number: '',
  password: '',
  is_verified: false,
  is_active: true,
  deactivation_reason: '',
};

// ─── PartnerFormPage ───────────────────────────────────────────────────────────

const PartnerFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new' && !isNaN(Number(id));
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load partner data for edit
  useEffect(() => {
    if (!isEdit || !id) return;
    getPartner(Number(id))
      .then((p) =>
        setForm({
          name: p.name ?? '',
          email: p.email ?? '',
          number: p.number ?? '',
          password: '',
          is_verified: p.is_verified,
          is_active: p.is_active,
          deactivation_reason: p.deactivation_reason ?? '',
        }),
      )
      .catch(() => setApiError('Failed to load partner data.'))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.number.trim()) e.number = 'Phone number is required.';
    else if (!/^\d{10}$/.test(form.number.trim())) e.number = 'Enter a valid 10-digit phone number.';
    if (!isEdit && !form.password.trim()) e.password = 'Password is required.';
    if (!form.is_active && !form.deactivation_reason.trim())
      e.deactivation_reason = 'Provide a reason for deactivation.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Field change ───────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setApiError(null);

    try {
      if (isEdit && id) {
        const payload: UpdatePartnerRequest = {
          name: form.name,
          email: form.email,
          number: form.number,
          is_verified: form.is_verified,
          is_active: form.is_active,
          deactivation_reason: form.is_active ? undefined : form.deactivation_reason,
        };
        await updatePartner(Number(id), payload);
        navigate(`/admin/partners/${id}`);
      } else {
        const payload: CreatePartnerRequest = {
          name: form.name,
          email: form.email,
          number: form.number,
          password: form.password,
        };
        const created = await createPartner(payload);
        // Make sure we have a valid ID before navigating
        if (created && created.id) {
          navigate(`/admin/partners/${created.id}`);
        } else {
          // If no ID is returned, navigate to the list
          setApiError('Partner created but unable to redirect. Please check the partners list.');
          setTimeout(() => navigate('/admin/partners'), 2000);
        }
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors: Partial<Record<keyof FormState, string>> = {};
        Object.entries(data).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : String(val);
          if (key in EMPTY) fieldErrors[key as keyof FormState] = msg;
        });
        if (Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
          return;
        }
        setApiError((data as { message?: string }).message ?? 'Something went wrong. Please try again.');
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary">Loading partner data…</p>
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
          {isEdit && id && (
            <li className="breadcrumb-item">
              <Link to={`/admin/partners/${id}`} className="text-decoration-none text-success">
                Details
              </Link>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {isEdit ? 'Edit Partner' : 'Add Partner'}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 mb-0">
            <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-person-plus'} text-success me-2`}></i>
            {isEdit ? 'Edit Partner' : 'Add Channel Partner'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mx-auto" style={{ maxWidth: '680px' }}>
        {/* API Error */}
        {apiError && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {apiError}
          </div>
        )}

        {/* Basic Information Card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-info-circle text-success me-2"></i>Basic Information
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  name="name"
                  type="text"
                  placeholder="e.g. Surabhi M"
                  value={form.name}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  name="email"
                  type="email"
                  placeholder="partner@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                  name="number"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.number}
                  onChange={handleChange}
                  disabled={isSaving}
                  maxLength={10}
                />
                {errors.number && <div className="invalid-feedback">{errors.number}</div>}
              </div>

              {!isEdit && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Set initial password"
                      value={form.password}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                  {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Card (Edit only) */}
        {isEdit && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-secondary mb-3">
                <i className="bi bi-shield-check text-success me-2"></i>Status
              </h5>

              {/* Account Active Toggle */}
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-3">
                <div>
                  <div className="fw-semibold">
                    <i className={`bi ${form.is_active ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'} me-2 fs-4`}></i>
                    Account {form.is_active ? 'Active' : 'Inactive'}
                  </div>
                  <div className="small text-secondary">
                    Inactive partners cannot log in or manage bookings.
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    id="isActive"
                    checked={form.is_active}
                    onChange={handleChange}
                    disabled={isSaving}
                    style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Verified Toggle */}
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-3">
                <div>
                  <div className="fw-semibold">
                    <i className={`bi ${form.is_verified ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'} me-2 fs-4`}></i>
                    {form.is_verified ? 'Verified' : 'Unverified'}
                  </div>
                  <div className="small text-secondary">
                    Verified partners appear as trusted on the platform.
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_verified"
                    id="isVerified"
                    checked={form.is_verified}
                    onChange={handleChange}
                    disabled={isSaving}
                    style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Deactivation Reason */}
              {!form.is_active && (
                <div className="mt-3">
                  <label className="form-label fw-semibold">
                    Deactivation Reason <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.deactivation_reason ? 'is-invalid' : ''}`}
                    name="deactivation_reason"
                    placeholder="Explain why this partner is being deactivated…"
                    value={form.deactivation_reason}
                    onChange={handleChange}
                    disabled={isSaving}
                    rows={3}
                  />
                  {errors.deactivation_reason && (
                    <div className="invalid-feedback">{errors.deactivation_reason}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="d-flex gap-3">
          <Link
            to={isEdit && id ? `/admin/partners/${id}` : '/admin/partners'}
            className="btn btn-outline-secondary px-4 py-2 rounded-pill"
          >
            <i className="bi bi-x-circle me-1"></i> Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-success px-4 py-2 rounded-pill shadow-sm"
            disabled={isSaving}
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
            {isSaving ? (
              <><span className="spinner-border spinner-border-sm me-1"></span> Saving…</>
            ) : isEdit ? (
              <><i className="bi bi-check-lg me-1"></i> Save Changes</>
            ) : (
              <><i className="bi bi-person-plus me-1"></i> Add Partner</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartnerFormPage;