// src/pages/admin/UserFormPage.tsx
import React, { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUser, updateUser, createUser } from '../../api/admin/users';

const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new' && !isNaN(Number(id));
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImg, setExistingImg] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    getUser(Number(id))
      .then((u) => {
        setName(u.name ?? '');
        setEmail(u.email ?? '');
        setNumber(u.number ?? '');
        setReferralCode(u.referral_code ?? '');
        setIsActive(u.is_active);
        setExistingImg(u.profile_image_url ?? null);
      })
      .catch(() => setApiError('Failed to load user data.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!number.trim()) e.number = 'Phone number is required.';
    else if (!/^\d{10}$/.test(number.trim())) e.number = 'Enter a valid 10-digit number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);
    try {
      if (isEdit && id) {
        await updateUser(Number(id), {
          name,
          email,
          number,
          is_active: isActive,
          ...(imageFile ? { profile_image: imageFile } : {}),
        });
        navigate(`/admin/users/${id}`);
      } else {
        const created = await createUser({
          name,
          email,
          number,
          is_active: isActive,
          ...(imageFile ? { profile_image: imageFile } : {}),
        });
        navigate(`/admin/users/${created.id}`);
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrs: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          if (['name', 'email', 'number'].includes(k)) {
            fieldErrs[k] = Array.isArray(v) ? v[0] : String(v);
          }
        });
        if (Object.keys(fieldErrs).length) {
          setErrors(fieldErrs);
          return;
        }
      }
      setApiError((data as { message?: string })?.message ?? 'Something went wrong.');
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
          <p className="mt-2 text-secondary">Loading user data…</p>
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
            <Link to="/admin/users" className="text-decoration-none text-success">
              <i className="bi bi-people me-1"></i>Users
            </Link>
          </li>
          {isEdit && id && (
            <li className="breadcrumb-item">
              <Link to={`/admin/users/${id}`} className="text-decoration-none text-success">
                Details
              </Link>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {isEdit ? 'Edit' : 'Add User'}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="h3 mb-0">
            <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-person-plus'} text-success me-2`}></i>
            {isEdit ? 'Edit User' : 'Add New User'}
          </h3>
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
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
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
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                  type="tel"
                  placeholder="10-digit number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  disabled={isSaving}
                  maxLength={10}
                />
                {errors.number && <div className="invalid-feedback">{errors.number}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSaving}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Referral Code</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Optional referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Image Card */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-image text-success me-2"></i>Profile Image
            </h5>

            {/* Image Preview */}
            {(imagePreview ?? existingImg) && (
              <div className="mb-3">
                <img
                  src={imagePreview ?? existingImg!}
                  alt="Profile"
                  className="rounded-circle object-fit-cover border"
                  style={{ width: '80px', height: '80px' }}
                />
              </div>
            )}

            {/* Upload Area */}
            <div
              className="border border-2 border-dashed rounded-3 p-4 text-center"
              style={{ borderColor: '#dee2e6', cursor: 'pointer' }}
              onClick={() => imageInputRef.current?.click()}
            >
              <div className="text-secondary">
                <i className="bi bi-cloud-upload fs-1 d-block mb-2"></i>
                <span className="fw-semibold">
                  {imagePreview ?? existingImg ? 'Change profile photo' : 'Upload profile photo'}
                </span>
                <div className="small text-secondary mt-1">JPG or PNG — replaces existing photo on S3</div>
              </div>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={handleImageSelect}
            />
          </div>
        </div>

        {/* Account Status Card */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-shield-check text-success me-2"></i>Account Status
            </h5>

            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
              <div>
                <div className="fw-semibold">
                  <i className={`bi ${isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'} me-2 fs-4`}></i>
                  {isActive ? 'Active Account' : 'Inactive Account'}
                </div>
                <div className="small text-secondary">
                  {isActive ? 'User can log in and make bookings.' : 'Inactive users cannot log in or make bookings.'}
                </div>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {isEdit && (
              <div className="mt-3 small text-warning">
                <i className="bi bi-info-circle me-1"></i>
                Note: Deleting users is not permitted via the admin panel.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex gap-3 justify-content-end">
          <Link
            to={isEdit && id ? `/admin/users/${id}` : '/admin/users'}
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
              <><i className="bi bi-person-plus me-1"></i> Create User</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserFormPage;