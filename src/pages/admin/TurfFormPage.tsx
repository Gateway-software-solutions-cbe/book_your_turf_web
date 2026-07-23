// src/pages/admin/TurfFormPage.tsx
import React, { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTurf, createTurf, updateTurf } from '../../api/turfs';
import { listPartners } from '../../api/partners';
import MapPicker, { type PickedLocation } from '../admin/MapPicker';
import type { Partner } from '../../types/partner';
import type {
  TurfFacilities, TurfDimensionData,
  TurfTimings, DayKey, AdvanceType, CommissionType, GameType,
} from '../../types/turf';

// ─── Constants ─────────────────────────────────────────────────────────────────

const GAME_TYPES: GameType[] = ['cricket & football', 'badminton', 'pickleball'];
const DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
};
const FACILITY_KEYS: (keyof TurfFacilities)[] = [
  'CCTV', 'wifi', 'parking', 'Rest room',
  'Sports kits', 'Dressing room', 'Music systems', 'Drinking water',
];
const FACILITY_ICONS: Record<string, string> = {
  CCTV: '📷', wifi: '📶', parking: '🅿️', 'Rest room': '🚻',
  'Sports kits': '👟', 'Dressing room': '👔', 'Music systems': '🔊', 'Drinking water': '💧',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const emptyFacilities = (): TurfFacilities => ({
  CCTV: false, wifi: false, parking: false, 'Rest room': false,
  'Sports kits': false, 'Dressing room': false, 'Music systems': false, 'Drinking water': false,
});

const emptyPrices = (): Record<DayKey, string> =>
  ({ mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' });

const buildTimings = (courts: number, existing?: TurfTimings): TurfTimings => {
  const t: TurfTimings = {};
  for (let i = 1; i <= courts; i++) {
    const dayKey = `court_${i}_day`;
    const nightKey = `court_${i}_night`;
    t[dayKey] = existing?.[dayKey] ?? {
      start_time: '06:00', end_time: '18:00', prices: emptyPrices(),
    };
    t[nightKey] = existing?.[nightKey] ?? {
      start_time: '18:00', end_time: '00:00', prices: emptyPrices(),
    };
  }
  return t;
};

const toTimeInput = (t: string) => (t ? t.slice(0, 5) : '');
const toTimeApi = (t: string) => (t ? `${t}:00` : '');

// ─── Field Component ───────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, error, hint, children }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold">
      {label}{required && <span className="text-danger">*</span>}
    </label>
    {children}
    {error && <div className="text-danger small mt-1">{error}</div>}
    {hint && <div className="form-text">{hint}</div>}
  </div>
);

// ─── TurfFormPage ──────────────────────────────────────────────────────────────

const TurfFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new' && !isNaN(Number(id));
  const numericId = id ? Number(id) : null;
  const navigate = useNavigate();

  // ── Partners ────────────────────────────────────────────────────────────────
  const [partners, setPartners] = useState<Partner[]>([]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [partnerId, setPartnerId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [gameType, setGameType] = useState<GameType>('cricket & football');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [maxPersons, setMaxPersons] = useState<number | ''>(10);
  const [courts, setCourts] = useState<number>(1);
  const [minSlots, setMinSlots] = useState<number>(1);
  const [facilities, setFacilities] = useState<TurfFacilities>(emptyFacilities());
  const [timings, setTimings] = useState<TurfTimings>(() => buildTimings(1));
  const [advanceType, setAdvanceType] = useState<AdvanceType>('percentage');
  const [advanceValue, setAdvanceValue] = useState('50');
  const [commissionType, setCommissionType] = useState<CommissionType>('percentage');
  const [commissionValue, setCommissionValue] = useState('10');
  const [dimUnit, setDimUnit] = useState('feet');
  const [dimLength, setDimLength] = useState<number | ''>('');
  const [dimBreadth, setDimBreadth] = useState<number | ''>('');
  const [dimHeight, setDimHeight] = useState<number | ''>('');
  const [dimShape, setDimShape] = useState('square');
  const [description, setDescription] = useState('');
  const [achievements, setAchievements] = useState('');

  // ── Image state ────────────────────────────────────────────────────────────
  const [existingImages, setExistingImages] = useState<{ id: number; url: string }[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load partners ──────────────────────────────────────────────────────────
  useEffect(() => {
    listPartners().then(setPartners).catch(() => {});
  }, []);

  // ── Load existing turf for edit ────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !numericId) return;
    getTurf(numericId)
      .then((t) => {
        setPartnerId(t.partner);
        setName(t.name);
        setGameType(t.game_type);
        setAddress(t.address);
        setState(t.state ?? '');
        setDistrict(t.district ?? '');
        setPincode(t.pincode ?? '');
        setLatitude(t.latitude ?? '');
        setLongitude(t.longitude ?? '');
        setOpenTime(toTimeInput(t.open_time));
        setCloseTime(toTimeInput(t.close_time));
        setMaxPersons(t.max_persons);
        setCourts(t.courts);
        setMinSlots(t.min_slots);
        setFacilities(t.facilities ?? emptyFacilities());
        setTimings(t.timings ?? buildTimings(t.courts));
        setAdvanceType(t.advance_type ?? 'percentage');
        setAdvanceValue(t.advance_value ?? '50');
        setCommissionType(t.commission_type ?? 'percentage');
        setCommissionValue(t.commission_value ?? '10');
        if (t.dimension_data) {
          setDimUnit(t.dimension_data.unit ?? 'feet');
          setDimLength(t.dimension_data.length ?? '');
          setDimBreadth(t.dimension_data.breadth ?? '');
          setDimHeight(t.dimension_data.height ?? '');
          setDimShape(t.dimension_data.turf_shape ?? 'square');
        }
        setDescription(t.description ?? '');
        setAchievements(t.achievements ?? '');
        setExistingImages(t.images ?? []);
      })
      .catch(() => setApiError('Failed to load turf data.'))
      .finally(() => setIsLoading(false));
  }, [numericId, isEdit]);

  // ── Rebuild timings when court count changes ───────────────────────────────
  const handleCourtsChange = (n: number) => {
    setCourts(n);
    setTimings((prev) => buildTimings(n, prev));
  };

  // ── Timing field update ────────────────────────────────────────────────────
  const setTimingField = (
    courtKey: string,
    field: 'start_time' | 'end_time',
    value: string,
  ) => {
    setTimings((prev) => ({
      ...prev,
      [courtKey]: { ...prev[courtKey], [field]: value },
    }));
  };

  const setTimingPrice = (courtKey: string, day: DayKey, value: string) => {
    setTimings((prev) => ({
      ...prev,
      [courtKey]: {
        ...prev[courtKey],
        prices: { ...prev[courtKey].prices, [day]: value },
      },
    }));
  };

  const applyAllDays = (courtKey: string, value: string) => {
    setTimings((prev) => ({
      ...prev,
      [courtKey]: {
        ...prev[courtKey],
        prices: Object.fromEntries(DAYS.map((d) => [d, value])) as Record<DayKey, string>,
      },
    }));
  };

  // ── Image upload handlers ──────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setNewImages((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...previews]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Map location callback ──────────────────────────────────────────────────
  const handleLocationPick = (loc: PickedLocation) => {
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    if (loc.address) setAddress(loc.address);
    if (loc.state) setState(loc.state);
    if (loc.district) setDistrict(loc.district);
    if (loc.pincode) setPincode(loc.pincode);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isEdit && !partnerId) e.partnerId = 'Select a partner.';
    if (!name.trim()) e.name = 'Turf name is required.';
    if (!address.trim()) e.address = 'Address is required.';
    if (!openTime) e.openTime = 'Open time is required.';
    if (!closeTime) e.closeTime = 'Close time is required.';
    if (!maxPersons) e.maxPersons = 'Max persons is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    setApiError(null);

    const dimData: TurfDimensionData | undefined =
      dimLength || dimBreadth || dimHeight
        ? {
            unit: dimUnit,
            length: Number(dimLength) || 0,
            breadth: Number(dimBreadth) || 0,
            height: Number(dimHeight) || 0,
            turf_shape: dimShape,
          }
        : undefined;

    const normalisedTimings: TurfTimings = {};
    Object.entries(timings).forEach(([k, v]) => {
      normalisedTimings[k] = {
        start_time: toTimeApi(v.start_time),
        end_time: toTimeApi(v.end_time),
        prices: v.prices,
      };
    });

    try {
      const commonFields = {
        name,
        game_type: gameType,
        address,
        description,
        achievements,
        max_persons: Number(maxPersons),
        courts,
        min_slots: minSlots,
        facilities,
        dimension_data: dimData,
        open_time: toTimeApi(openTime),
        close_time: toTimeApi(closeTime),
        state,
        district,
        pincode,
        latitude,
        longitude,
        timings: normalisedTimings,
        advance_type: advanceType,
        advance_value: advanceValue,
        commission_type: commissionType,
        commission_value: commissionValue,
      };

      const hasImages = newImages.length > 0;

      const buildFormData = (extra: Record<string, unknown> = {}) => {
        const fd = new FormData();
        const allFields = { ...commonFields, ...extra };
        Object.entries(allFields).forEach(([key, val]) => {
          if (val === undefined || val === null) return;
          if (typeof val === 'object') fd.append(key, JSON.stringify(val));
          else fd.append(key, String(val));
        });
        newImages.forEach((img) => fd.append('images', img));
        return fd;
      };

      if (isEdit && numericId) {
        const payload = hasImages ? buildFormData() : commonFields;
        await updateTurf(numericId, payload as Parameters<typeof updateTurf>[1]);
        navigate(`/admin/turfs/${numericId}`);
      } else {
        const payload = hasImages
          ? buildFormData({ partner: Number(partnerId) })
          : { ...commonFields, partner: Number(partnerId) };
        const created = await createTurf(payload as Parameters<typeof createTurf>[0]);
        navigate(`/admin/turfs/${created.id}`);
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response
        ?.data;
      const msg =
        (data as { message?: string })?.message ??
        (data as { detail?: string })?.detail ??
        'Something went wrong. Please check your inputs.';
      setApiError(String(msg));
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <p className="mt-2 text-secondary">Loading turf data…</p>
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
            <Link to="/admin/turfs" className="text-decoration-none text-success">
              <i className="bi bi-grid-3x3-gap-fill me-1"></i>Turfs
            </Link>
          </li>
          {isEdit && numericId && (
            <li className="breadcrumb-item">
              <Link to={`/admin/turfs/${numericId}`} className="text-decoration-none text-success">
                Details
              </Link>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {isEdit ? 'Edit Turf' : 'Add Turf'}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 mb-0">
            <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} text-success me-2`}></i>
            {isEdit ? 'Edit Turf' : 'Add New Turf'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {apiError}
          </div>
        )}

        {/* ─── Basic Information ──────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-info-circle text-success me-2"></i>Basic Information
            </h5>
            <div className="row g-3">
              {!isEdit && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Channel Partner <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.partnerId ? 'is-invalid' : ''}`}
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}
                    disabled={isSaving}
                  >
                    <option value="">— Select partner —</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.partnerId && <div className="invalid-feedback">{errors.partnerId}</div>}
                </div>
              )}

              <div className="col-md-6">
                <Field label="Turf Name" required error={errors.name}>
                  <input
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    type="text"
                    placeholder="e.g. Elite Arena"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Game Type <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value as GameType)}
                  disabled={isSaving}
                >
                  {GAME_TYPES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Number of Courts <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  max={10}
                  value={courts}
                  onChange={(e) => handleCourtsChange(Math.max(1, Math.min(10, Number(e.target.value))))}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6">
                <Field label="Max Persons" required error={errors.maxPersons}>
                  <input
                    className={`form-control ${errors.maxPersons ? 'is-invalid' : ''}`}
                    type="number"
                    min={1}
                    value={maxPersons}
                    onChange={(e) => setMaxPersons(e.target.value ? Number(e.target.value) : '')}
                    disabled={isSaving}
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Min Booking Slots</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  value={minSlots}
                  onChange={(e) => setMinSlots(Number(e.target.value) || 1)}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6">
                <Field label="Open Time" required error={errors.openTime}>
                  <input
                    className={`form-control ${errors.openTime ? 'is-invalid' : ''}`}
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    disabled={isSaving}
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <Field label="Close Time" required error={errors.closeTime}>
                  <input
                    className={`form-control ${errors.closeTime ? 'is-invalid' : ''}`}
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    disabled={isSaving}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Images ───────────────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-image text-success me-2"></i>Turf Images
            </h5>

            {existingImages.length > 0 && (
              <div className="mb-3">
                <p className="text-secondary small">Current images — contact your backend team to remove individual images via the API.</p>
                <div className="d-flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="position-relative" style={{ width: '100px', height: '80px' }}>
                      <img
                        src={img.url}
                        alt="Turf"
                        className="w-100 h-100 object-fit-cover rounded-2"
                      />
                      <span className="position-absolute top-0 end-0 badge bg-success m-1">Saved</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="border border-2 border-dashed rounded-3 p-4 text-center"
              style={{ borderColor: '#dee2e6', cursor: 'pointer' }}
              onClick={() => imageInputRef.current?.click()}
            >
              <div className="text-secondary">
                <i className="bi bi-cloud-upload fs-1 d-block mb-2"></i>
                <span className="fw-semibold">Click to upload images</span>
                <div className="small text-secondary mt-1">JPG, PNG — multiple allowed</div>
              </div>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="d-none"
              onChange={handleImageSelect}
              disabled={isSaving}
            />

            {newImagePreviews.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {newImagePreviews.map((src, i) => (
                  <div key={i} className="position-relative" style={{ width: '100px', height: '80px' }}>
                    <img
                      src={src}
                      alt={`Upload ${i + 1}`}
                      className="w-100 h-100 object-fit-cover rounded-2"
                    />
                    <button
                      type="button"
                      className="position-absolute top-0 end-0 btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '22px', height: '22px', padding: 0, fontSize: '12px' }}
                      onClick={() => removeNewImage(i)}
                    >
                      ✕
                    </button>
                    <span className="position-absolute bottom-0 start-0 badge bg-warning text-dark m-1">New</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Location ────────────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-geo-alt text-success me-2"></i>Location
            </h5>

            <MapPicker
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''}
              initialLat={latitude || undefined}
              initialLng={longitude || undefined}
              onLocationSelect={handleLocationPick}
            />
            <p className="form-text mt-2 mb-3">
              Fields below are auto-filled from the map. You can also edit them manually.
            </p>

            <div className="row g-3">
              <div className="col-12">
                <Field label="Full Address" required error={errors.address}>
                  <textarea
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    placeholder="Street, area, city, state, pincode"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSaving}
                    rows={2}
                  />
                </Field>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">State</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Tamil Nadu"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">District</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. Salem"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Pincode</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="6-digit pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  disabled={isSaving}
                  maxLength={6}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Latitude</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. 11.685793"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Longitude</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. 78.116321"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Facilities ───────────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-grid-3x3-gap text-success me-2"></i>Facilities
            </h5>
            <div className="row g-2">
              {FACILITY_KEYS.map((key) => (
                <div key={key} className="col-md-3 col-6">
                  <label
                    className={`btn w-100 d-flex align-items-center justify-content-between gap-2 p-2 rounded-3 ${
                      facilities[key] ? 'btn-success' : 'btn-outline-secondary'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={!!facilities[key]}
                      onChange={(e) =>
                        setFacilities((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      disabled={isSaving}
                      className="d-none"
                    />
                    <span>{FACILITY_ICONS[key]}</span>
                    <span className="flex-grow-1 text-start small">{key}</span>
                    <span>{facilities[key] ? '✓' : '+'}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Court Timings ───────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-clock text-success me-2"></i>
              Court Timings & Pricing ({courts} court{courts !== 1 ? 's' : ''})
            </h5>
            <p className="text-secondary small mb-3">
              Set start/end times and per-day prices for each court period. Use "Apply to all days" to fill a row quickly.
            </p>

            {Array.from({ length: courts }, (_, ci) => {
              const courtNum = ci + 1;
              return (['day', 'night'] as const).map((period) => {
                const key = `court_${courtNum}_${period}`;
                const t = timings[key];
                if (!t) return null;
                return (
                  <div key={key} className="border rounded-3 mb-3 overflow-hidden">
                    <div className="bg-light px-3 py-2 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
                      <span className="fw-semibold small">
                        Court {courtNum} — {period === 'day' ? '☀️ Day' : '🌙 Night'}
                      </span>
                      <div className="d-flex flex-wrap align-items-center gap-3">
                        <label className="d-flex align-items-center gap-1 small">
                          From
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            style={{ width: '120px' }}
                            value={t.start_time}
                            onChange={(e) => setTimingField(key, 'start_time', e.target.value)}
                            disabled={isSaving}
                          />
                        </label>
                        <label className="d-flex align-items-center gap-1 small">
                          To
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            style={{ width: '120px' }}
                            value={t.end_time}
                            onChange={(e) => setTimingField(key, 'end_time', e.target.value)}
                            disabled={isSaving}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                        <span className="small fw-semibold">Price (₹)</span>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="number"
                            placeholder="Same for all"
                            className="form-control form-control-sm"
                            style={{ width: '130px' }}
                            onBlur={(e) => {
                              if (e.target.value) applyAllDays(key, e.target.value);
                              e.target.value = '';
                            }}
                          />
                          <span className="text-secondary small">← type & tab to apply to all days</span>
                        </div>
                      </div>
                      <div className="row g-1">
                        {DAYS.map((day) => (
                          <div key={day} className="col">
                            <label className="d-block text-center small fw-semibold text-secondary">
                              {DAY_LABELS[day]}
                              <input
                                type="number"
                                min={0}
                                className="form-control form-control-sm text-center"
                                placeholder="0"
                                value={t.prices[day] ?? ''}
                                onChange={(e) => setTimingPrice(key, day, e.target.value)}
                                disabled={isSaving}
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* ─── Financial ───────────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-cash-stack text-success me-2"></i>Advance & Commission
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Advance Type</label>
                <select
                  className="form-select"
                  value={advanceType}
                  onChange={(e) => setAdvanceType(e.target.value as AdvanceType)}
                  disabled={isSaving}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Advance Value ({advanceType === 'percentage' ? '%' : '₹'})
                </label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  max={advanceType === 'percentage' ? 100 : undefined}
                  value={advanceValue}
                  onChange={(e) => setAdvanceValue(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Commission Type</label>
                <select
                  className="form-select"
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value as CommissionType)}
                  disabled={isSaving}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Commission Value ({commissionType === 'percentage' ? '%' : '₹'})
                </label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Dimensions ───────────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-rulers text-success me-2"></i>Dimensions (Optional)
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Unit</label>
                <select
                  className="form-select"
                  value={dimUnit}
                  onChange={(e) => setDimUnit(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="feet">Feet</option>
                  <option value="meters">Meters</option>
                  <option value="yards">Yards</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Shape</label>
                <select
                  className="form-select"
                  value={dimShape}
                  onChange={(e) => setDimShape(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="square">Square</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="oval">Oval</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Length ({dimUnit})</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={dimLength}
                  onChange={(e) => setDimLength(e.target.value ? Number(e.target.value) : '')}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Breadth ({dimUnit})</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={dimBreadth}
                  onChange={(e) => setDimBreadth(e.target.value ? Number(e.target.value) : '')}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Height ({dimUnit})</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={dimHeight}
                  onChange={(e) => setDimHeight(e.target.value ? Number(e.target.value) : '')}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Description & Achievements ──────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-card-text text-success me-2"></i>Description & Achievements (Optional)
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Brief description of the turf…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Achievements</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Awards, tournaments hosted, etc."
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Actions ──────────────────────────────────────────────────────────── */}
        <div className="d-flex gap-3">
          <Link
            to={isEdit && numericId ? `/admin/turfs/${numericId}` : '/admin/turfs'}
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
              <><i className="bi bi-plus-circle me-1"></i> Create Turf</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TurfFormPage;