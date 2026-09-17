// src/pages/admin/TurfFormPage.tsx
import React, { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTurf, createTurf, updateTurf } from '../../api/admin/turfs';
import { listPartners } from '../../api/admin/partners';
import MapPicker, { type PickedLocation } from '../admin/MapPicker';
import type { Partner } from '../../types/admin/partner';
import type {
  TurfFacilities, TurfDimensionData,
  TurfTimings, DayKey, AdvanceType, CommissionType, GameType,
} from '../../types/admin/turf';

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

const MAX_COURTS = 10;
const MIN_COURTS = 1;

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
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
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

  // ── Rebuild timings when court count changes (used by create / numeric input) ─
  const handleCourtsChange = (n: number) => {
    const safe = Math.max(MIN_COURTS, Math.min(MAX_COURTS, n || MIN_COURTS));
    setCourts(safe);
    setTimings((prev) => buildTimings(safe, prev));
  };

  // ── Add one court, preserving all existing court timings ───────────────────
  const addCourt = () => {
    if (courts >= MAX_COURTS) return;
    const next = courts + 1;

    setTimings((prevTimings) => {
      const updated = { ...prevTimings };
      const dayKey = `court_${next}_day`;
      const nightKey = `court_${next}_night`;

      if (!updated[dayKey]) {
        updated[dayKey] = {
          start_time: openTime || '06:00',
          end_time: '18:00',
          prices: emptyPrices(),
        };
      }
      if (!updated[nightKey]) {
        updated[nightKey] = {
          start_time: '18:00',
          end_time: closeTime || '00:00',
          prices: emptyPrices(),
        };
      }
      return updated;
    });

    setCourts(next);
  };

  // ── Remove the last court with confirmation ────────────────────────────────
  const removeLastCourt = () => {
    if (courts <= MIN_COURTS) return;

    const confirmed = window.confirm(
      `Remove Court ${courts}? Any pricing entered for it will be discarded.`
    );
    if (!confirmed) return;

    const removing = courts;
    setTimings((prevTimings) => {
      const updated = { ...prevTimings };
      delete updated[`court_${removing}_day`];
      delete updated[`court_${removing}_night`];
      return updated;
    });
    setCourts(courts - 1);
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

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setNewImages((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...previews]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const markExistingImageForDeletion = (imageId: number) => {
    setImagesToDelete((prev) =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
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

  // ─── Build court_shifts from timings ──────────────────────────────────────
  const buildCourtShifts = () => {
    const shifts = [];
    for (let i = 1; i <= courts; i++) {
      const dayKey = `court_${i}_day`;
      const nightKey = `court_${i}_night`;
      const dayShift = timings[dayKey];
      const nightShift = timings[nightKey];

      const shift: any = { court_number: i };

      if (dayShift) {
        const prices: Record<string, string> = {};
        DAYS.forEach(day => {
          prices[day] = dayShift.prices?.[day]?.toString() || '0.00';
        });

        shift.day_shift = {
          start_time: dayShift.start_time || '06:00',
          end_time: dayShift.end_time || '18:00',
          prices: prices,
        };
      }

      if (nightShift) {
        const prices: Record<string, string> = {};
        DAYS.forEach(day => {
          prices[day] = nightShift.prices?.[day]?.toString() || '0.00';
        });

        shift.night_shift = {
          start_time: nightShift.start_time || '18:00',
          end_time: nightShift.end_time || '00:00',
          prices: prices,
        };
      }

      if (shift.day_shift || shift.night_shift) {
        shifts.push(shift);
      }
    }
    return shifts;
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    setApiError(null);

    if (!isEdit && newImages.length === 0) {
      setApiError('At least one image is required. Please upload turf images.');
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // ─── Build dimension data ────────────────────────────────────────────────
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

    // ─── Build court shifts ──────────────────────────────────────────────────
    const courtShifts = buildCourtShifts();

    try {
      const formData = new FormData();

      // ─── Basic fields ──────────────────────────────────────────────────────
      if (!isEdit) {
        formData.append('partner', String(partnerId));
      }
      formData.append('name', name);
      formData.append('game_type', gameType);
      formData.append('address', address);
      formData.append('max_persons', String(maxPersons));
      formData.append('courts', String(courts));
      formData.append('open_time', toTimeApi(openTime));
      formData.append('close_time', toTimeApi(closeTime));

      // ─── Optional fields ────────────────────────────────────────────────────
      if (description) formData.append('description', description);
      if (achievements) formData.append('achievements', achievements);
      if (state) formData.append('state', state);
      if (district) formData.append('district', district);
      if (pincode) formData.append('pincode', pincode);
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (minSlots) formData.append('min_slots', String(minSlots));

      // ─── JSON fields ──────────────────────────────────────────────────────
      formData.append('facilities', JSON.stringify(facilities));

      if (dimData) {
        formData.append('dimension_data', JSON.stringify(dimData));
      }

      if (courtShifts.length > 0) {
        const courtShiftsJson = JSON.stringify(courtShifts);
        console.log(`📦 Sending ${courtShifts.length} court shift(s):`, courtShiftsJson);
        formData.append('court_shifts', courtShiftsJson);
      }

      // ─── Financial fields ──────────────────────────────────────────────────
      formData.append('advance_type', advanceType);
      formData.append('advance_value', advanceValue);
      formData.append('commission_type', commissionType);
      formData.append('commission_value', commissionValue);

      // ─── Images ─────────────────────────────────────────────────────────────
      if (isEdit) {
        if (imagesToDelete.length > 0) {
          formData.append('delete_images', JSON.stringify(imagesToDelete));
        }
      }

      newImages.forEach((img) => {
        formData.append('new_images', img);
      });

      // ─── Log the FormData for debugging ────────────────────────────────────
      console.log('📦 FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      if (isEdit && numericId) {
        await updateTurf(numericId, formData as any);
        navigate(`/admin/turfs/${numericId}`);
      } else {
        const result = await createTurf(formData as any);
        navigate(`/admin/turfs/${result.id}`);
      }
    } catch (err: unknown) {
      console.error('❌ Submit error:', err);

      let errorMessage = 'Something went wrong. Please check your inputs.';

      if (err && typeof err === 'object') {
        const axiosErr = err as {
          response?: {
            data?: {
              message?: string;
              detail?: string;
              data?: any[]
            }
          };
          message?: string;
        };

        if (axiosErr.response?.data) {
          const data = axiosErr.response.data;
          if (data.message) {
            errorMessage = data.message;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (Array.isArray(data.data)) {
            const validationErrors = data.data.map((e: any) =>
              Object.values(e).join(', ')
            ).join('; ');
            if (validationErrors) {
              errorMessage = validationErrors;
            }
          }
        } else if (axiosErr.message) {
          errorMessage = axiosErr.message;
        }
      }

      setApiError(errorMessage);
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
                <p className="text-secondary small">Current images — click on an image to mark it for deletion</p>
                <div className="d-flex flex-wrap gap-2">
                  {existingImages.map((img) => {
                    const isMarkedForDeletion = imagesToDelete.includes(img.id);
                    return (
                      <div
                        key={img.id}
                        className="position-relative"
                        style={{ width: '120px', height: '100px', cursor: 'pointer' }}
                        onClick={() => markExistingImageForDeletion(img.id)}
                      >
                        <img
                          src={img.url}
                          alt="Turf"
                          className="w-100 h-100 object-fit-cover rounded-2"
                          style={{
                            opacity: isMarkedForDeletion ? 0.4 : 1,
                            border: isMarkedForDeletion ? '2px solid red' : '2px solid transparent'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f8f9fa" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%236c757d" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {isMarkedForDeletion ? (
                          <span className="position-absolute top-50 start-50 translate-middle badge bg-danger">
                            Will Delete
                          </span>
                        ) : (
                          <span className="position-absolute top-0 end-0 badge bg-success m-1">Saved</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {imagesToDelete.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => setImagesToDelete([])}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Clear selection ({imagesToDelete.length} images marked for deletion)
                    </button>
                  </div>
                )}
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
                <div className="small text-secondary mt-1">JPG, PNG — multiple allowed (max 5MB each)</div>
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
                  <div key={i} className="position-relative" style={{ width: '120px', height: '100px' }}>
                    <img
                      src={src}
                      alt={`Upload ${i + 1}`}
                      className="w-100 h-100 object-fit-cover rounded-2"
                    />
                    <button
                      type="button"
                      className="position-absolute top-0 end-0 btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '24px', height: '24px', padding: 0, fontSize: '12px' }}
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
            {/* Header row with count badge + add/remove buttons */}
            <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-3">
              <div>
                <h5 className="card-title fw-bold text-secondary mb-1">
                  <i className="bi bi-clock text-success me-2"></i>
                  Court Timings & Pricing
                  <span className="badge bg-success-subtle text-success-emphasis ms-2 align-middle">
                    {courts} court{courts !== 1 ? 's' : ''}
                  </span>
                </h5>
                <p className="text-secondary small mb-0">
                  Set start/end times and per-day prices for each court period.
                  Use "Apply to all days" to fill a row quickly.
                </p>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm rounded-pill px-3"
                  onClick={removeLastCourt}
                  disabled={isSaving || courts <= MIN_COURTS}
                  title={
                    courts <= MIN_COURTS
                      ? 'At least one court is required'
                      : `Remove Court ${courts}`
                  }
                >
                  <i className="bi bi-dash-circle me-1"></i>
                  Remove Court
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm rounded-pill px-3"
                  onClick={addCourt}
                  disabled={isSaving || courts >= MAX_COURTS}
                  title={
                    courts >= MAX_COURTS
                      ? `Maximum ${MAX_COURTS} courts allowed`
                      : 'Add a new court'
                  }
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Add Court
                </button>
              </div>
            </div>

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

            {/* Bottom hint for admins */}
            {courts < MAX_COURTS && (
              <div className="text-secondary small d-flex align-items-center mt-1">
                <i className="bi bi-info-circle me-1"></i>
                Need more courts? Click <span className="fw-semibold mx-1">"Add Court"</span>
                above to append a new court with day &amp; night timings.
              </div>
            )}
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