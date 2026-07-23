// src/pages/admin/MockTurfFormPage.tsx
import React, { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMockTurf, createMockTurf, updateMockTurf } from '../../api/mockturfs';
import { parseFacilities } from '../../types/mockturf';
import type { MockTurfFacilities } from '../../types/mockturf';

const FACILITY_KEYS: (keyof MockTurfFacilities)[] = [
  'CCTV', 'wifi', 'parking', 'Rest room',
  'Sports kits', 'Dressing room', 'Music systems', 'Drinking water',
];
const FACILITY_ICONS: Record<string, string> = {
  CCTV: '📷', wifi: '📶', parking: '🅿️', 'Rest room': '🚻',
  'Sports kits': '👟', 'Dressing room': '👔', 'Music systems': '🔊', 'Drinking water': '💧',
};

const emptyFacilities = (): MockTurfFacilities => ({
  CCTV: false, wifi: false, parking: false, 'Rest room': false,
  'Sports kits': false, 'Dressing room': false, 'Music systems': false, 'Drinking water': false,
});

const MockTurfFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new' && !isNaN(Number(id));
  const numericId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [facilities, setFacilities] = useState<MockTurfFacilities>(emptyFacilities());
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !numericId) return;
    getMockTurf(numericId)
      .then((t) => {
        setName(t.name);
        setAddress(t.address);
        setPhoneNumber(t.phone_number);
        setFacilities(parseFacilities(t.facilities));
        setIsActive(t.is_active);
        setExistingImage(t.image_url ?? null);
      })
      .catch(() => setApiError('Failed to load mock turf.'))
      .finally(() => setIsLoading(false));
  }, [numericId, isEdit]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!address.trim()) e.address = 'Address is required.';
    if (!phoneNumber.trim()) e.phoneNumber = 'Phone number is required.';
    else if (!/^\d{10}$/.test(phoneNumber.trim())) e.phoneNumber = 'Enter a valid 10-digit number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setApiError(null);
    try {
      const payload = {
        name,
        address,
        phone_number: phoneNumber,
        facilities,
        is_active: isActive,
        image: imageFile ?? undefined,
      };
      if (isEdit && numericId) {
        await updateMockTurf(numericId, payload);
        navigate('/admin/mock-turfs');
      } else {
        await createMockTurf(payload);
        navigate('/admin/mock-turfs');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? 'Something went wrong.';
      setApiError(msg);
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
          <p className="mt-2 text-secondary">Loading mock turf data…</p>
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
            <Link to="/admin/mock-turfs" className="text-decoration-none text-success">
              <i className="bi bi-grid-3x3-gap-fill me-1"></i>Mock Turfs
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {isEdit ? 'Edit Mock Turf' : 'Add Mock Turf'}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 mb-0">
            <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} text-success me-2`}></i>
            {isEdit ? 'Edit Mock Turf' : 'Add Mock Turf'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mx-auto" style={{ maxWidth: '680px' }}>
        {apiError && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {apiError}
          </div>
        )}

        {/* Basic Information */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-info-circle text-success me-2"></i>Basic Information
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  type="text"
                  placeholder="e.g. Demo Turf"
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
                  className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                  type="tel"
                  placeholder="10-digit number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSaving}
                  maxLength={10}
                />
                {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  Address <span className="text-danger">*</span>
                </label>
                <textarea
                  className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                  placeholder="Full address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSaving}
                  rows={2}
                />
                {errors.address && <div className="invalid-feedback">{errors.address}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Image - Modern Design */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-image text-success me-2"></i>Image
            </h5>

            {/* Image Preview */}
            {(imagePreview ?? existingImage) && (
              <div className="d-flex justify-content-center mb-4">
                <div className="position-relative">
                  <img
                    src={imagePreview ?? existingImage!}
                    alt="Preview"
                    className="rounded-3 object-fit-cover shadow-sm"
                    style={{ width: '180px', height: '140px' }}
                  />
                  <button
                    type="button"
                    className="position-absolute top-0 end-0 btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center m-1"
                    style={{ width: '28px', height: '28px', padding: 0 }}
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      setExistingImage(null);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div
              className="border border-2 border-dashed rounded-3 p-5 text-center"
              style={{ 
                borderColor: '#dee2e6',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: '#fafbfc',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#198754';
                e.currentTarget.style.background = '#f0fdf4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#dee2e6';
                e.currentTarget.style.background = '#fafbfc';
              }}
              onClick={() => imageInputRef.current?.click()}
            >
              <div className="text-secondary">
                <div className="d-flex justify-content-center mb-3">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3">
                    <i className="bi bi-cloud-upload fs-1 text-success"></i>
                  </div>
                </div>
                <p className="fw-semibold mb-1 text-dark">
                  {imagePreview ?? existingImage ? 'Change image' : 'Click to upload image'}
                </p>
                <p className="small text-secondary mb-0">
                  {imagePreview ?? existingImage ? 'Replace with a new image' : 'JPG or PNG (max 5MB)'}
                </p>
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

        {/* Facilities */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-grid-3x3-gap text-success me-2"></i>Facilities
            </h5>
            <div className="row g-2">
              {FACILITY_KEYS.map((key) => (
                <div key={key} className="col-sm-6 col-lg-3">
                  <label
                    className={`btn w-100 d-flex align-items-center gap-2 p-2 rounded-3 ${
                      facilities[key] ? 'btn-success' : 'btn-outline-secondary'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={!!facilities[key]}
                      onChange={(e) =>
                        setFacilities((p) => ({ ...p, [key]: e.target.checked }))
                      }
                      className="d-none"
                    />
                    <span>{FACILITY_ICONS[String(key)]}</span>
                    <span className="small fw-medium flex-grow-1 text-start">{String(key)}</span>
                    <span>{facilities[key] ? '✓' : '+'}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status (edit only) */}
        {isEdit && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title fw-bold text-secondary mb-3">
                <i className="bi bi-shield-check text-success me-2"></i>Status
              </h5>
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                <div>
                  <div className="fw-semibold">
                    <i className={`bi ${isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'} me-2 fs-4`}></i>
                    {isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className="small text-secondary">
                    Inactive mock turfs won't appear in the user app.
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="mock-turf-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '48px', height: '24px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="d-flex gap-3">
          <Link
            to="/admin/mock-turfs"
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
              <><i className="bi bi-plus-circle me-1"></i> Create Mock Turf</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MockTurfFormPage;