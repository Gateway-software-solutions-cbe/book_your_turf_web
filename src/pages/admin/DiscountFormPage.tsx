// src/pages/admin/DiscountFormPage.tsx
import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  getAdminDiscount, 
  getPartnerDiscount,
  createAdminDiscount, 
  createPartnerDiscount,
  updateAdminDiscount,
  updatePartnerDiscount,
} from '../../api/admin/discounts';
import { listPartners } from '../../api/admin/partners';
import { listTurfs } from '../../api/admin/turfs';
import type { 
  Discount, 
  DiscountSource, 
  DiscountType, 
  ApplicablePaymentType,
  CreateAdminDiscountRequest, 
  CreatePartnerDiscountRequest,
  UpdateDiscountRequest, 
} from '../../types/admin/discount';
import {
  APPLICABLE_PAYMENT_TYPES,
  APPLICABLE_PAYMENT_TYPE_LABELS,
} from '../../types/admin/discount'
import type { Partner } from '../../types/admin/partner';
import type { Turf } from '../../types/admin/turf';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

// ─── Form State ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  max_discount_amount: any;
  min_amount: any;
  min_slots: any;
  applicable_payment_type: ApplicablePaymentType;
  applicable_time_start: string;
  applicable_time_end: string;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
  is_active: boolean;
  start_date: string;
  end_date: string;
  usage_limit: any;
  source: DiscountSource;
  applicable_turfs: number[];
  applicable_state: string;
  applicable_district: string;
  partner_id: number | '';
  turf_id: number | '';
}

const getDefaultFormState = (source: DiscountSource = 'admin'): FormState => ({
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  max_discount_amount: '',
  min_amount: '',
  min_slots: '',
  applicable_payment_type: 'both',
  applicable_time_start: '',
  applicable_time_end: '',
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
  sun: false,
  is_active: true,
  start_date: '',
  end_date: '',
  usage_limit: '',
  source: source,
  applicable_turfs: [],
  applicable_state: '',
  applicable_district: '',
  partner_id: '',
  turf_id: '',
});

// ─── DiscountFormPage ─────────────────────────────────────────────────────────

const DiscountFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id && !isNaN(Number(id));
  const numericId = id ? Number(id) : null;
  const navigate = useNavigate();

  // Get discount type from URL params
  const typeParam = searchParams.get('type') || 'admin';
  const isAdminType = typeParam === 'admin';
  const discountSource: DiscountSource = isAdminType ? 'admin' : 'partner';

  // ── State ────────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(() => getDefaultFormState(discountSource));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  
  // ── Partner & Turf data ─────────────────────────────────────────────────────
  const [partners, setPartners] = useState<Partner[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [filteredTurfs, setFilteredTurfs] = useState<Turf[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [loadingTurfs, setLoadingTurfs] = useState(false);

  // ── Load partners and turfs ─────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoadingPartners(true);
      setLoadingTurfs(true);
      try {
        const [partnersData, turfsData] = await Promise.all([
          listPartners(),
          listTurfs(),
        ]);
        setPartners(Array.isArray(partnersData) ? partnersData : []);
        setTurfs(Array.isArray(turfsData) ? turfsData : []);
      } catch (error) {
        console.error('Failed to load data:', error);
        setPartners([]);
        setTurfs([]);
      } finally {
        setLoadingPartners(false);
        setLoadingTurfs(false);
      }
    };
    loadData();
  }, []);

  // ── Filter turfs when partner changes ──────────────────────────────────────
  useEffect(() => {
    if (form.partner_id) {
      const filtered = turfs.filter(t => t.partner === Number(form.partner_id));
      setFilteredTurfs(filtered);
      if (form.turf_id && !filtered.some(t => t.id === Number(form.turf_id))) {
        setForm(prev => ({ ...prev, turf_id: '' }));
      }
    } else {
      setFilteredTurfs([]);
      setForm(prev => ({ ...prev, turf_id: '' }));
    }
  }, [form.partner_id, turfs]);

  // ── Load existing discount for edit ────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !numericId) return;
    
    const getDiscountFn = isAdminType ? getAdminDiscount : getPartnerDiscount;
    
    getDiscountFn(numericId)
      .then((discount) => {
        setForm({
          name: discount.name,
          description: discount.description || '',
          discount_type: discount.discount_type,
          discount_value: discount.discount_value,
          max_discount_amount: discount.max_discount_amount || '',
          min_amount: discount.min_amount || '',
          min_slots: discount.min_slots,
          applicable_payment_type: (discount as any).applicable_payment_type || 'both',
          applicable_time_start: discount.applicable_time_start || '',
          applicable_time_end: discount.applicable_time_end || '',
          mon: discount.mon,
          tue: discount.tue,
          wed: discount.wed,
          thu: discount.thu,
          fri: discount.fri,
          sat: discount.sat,
          sun: discount.sun,
          is_active: discount.is_active,
          start_date: discount.start_date || '',
          end_date: discount.end_date || '',
          usage_limit: discount.usage_limit?.toString() || '',
          source: discount.source,
          applicable_turfs: discount.applicable_turfs || [],
          applicable_state: discount.applicable_state || '',
          applicable_district: discount.applicable_district || '',
          partner_id: discount.partner || '',
          turf_id: discount.turf || '',
        });
      })
      .catch(() => setApiError(`Failed to load ${isAdminType ? 'platform' : 'partner'} discount data.`))
      .finally(() => setIsLoading(false));
  }, [numericId, isEdit, isAdminType]);

  // ── Handle field changes ──────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (apiError) setApiError(null);
  };

  // ── Handle multi-select for turfs ──────────────────────────────────────────
  const handleTurfSelect = (turfId: number) => {
    setForm(prev => {
      const current = prev.applicable_turfs || [];
      const newTurfs = current.includes(turfId)
        ? current.filter(id => id !== turfId)
        : [...current, turfId];
      return { ...prev, applicable_turfs: newTurfs };
    });
  };

  // ── Select all days ────────────────────────────────────────────────────────
  const selectAllDays = () => {
    const allSelected = DAYS.every(day => form[day]);
    setForm(prev => {
      const newState = { ...prev };
      DAYS.forEach(day => {
        newState[day] = !allSelected;
      });
      return newState;
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.discount_value) e.discount_value = 'Discount value is required.';
    if (form.discount_type === 'percentage' && parseFloat(form.discount_value) > 100) {
      e.discount_value = 'Percentage cannot exceed 100.';
    }
    
    // Partner discount validation
    if (form.source === 'partner') {
      if (!form.partner_id) e.partner_id = 'Please select a partner.';
      if (!form.turf_id) e.turf_id = 'Please select a turf.';
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

// ── Submit ──────────────────────────────────────────────────────────────────
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!validate()) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  setIsSaving(true);
  setApiError(null);

  try {
    // Build common data with proper null handling
    const commonData = {
  name: form.name.trim(),
  description: form.description.trim() || null,  // null for empty
  discount_type: form.discount_type,
  discount_value: parseFloat(form.discount_value),
  max_discount_amount: form.max_discount_amount !== '' && form.max_discount_amount !== null && form.max_discount_amount !== undefined
    ? Number(form.max_discount_amount)
    : null,  // null for empty
  min_amount: form.min_amount !== '' && form.min_amount !== null && form.min_amount !== undefined
    ? Number(form.min_amount)
    : null,  // null for empty
  min_slots: form.min_slots !== '' && form.min_slots !== null && form.min_slots !== undefined
    ? Number(form.min_slots)
    : null,  // null for empty
  applicable_payment_type: form.applicable_payment_type || 'both',
  applicable_time_start: form.applicable_time_start || null,  // null for empty
  applicable_time_end: form.applicable_time_end || null,  // null for empty
  mon: form.mon,
  tue: form.tue,
  wed: form.wed,
  thu: form.thu,
  fri: form.fri,
  sat: form.sat,
  sun: form.sun,
  is_active: form.is_active,
  start_date: form.start_date || null,  // null for empty
  end_date: form.end_date || null,  // null for empty
  usage_limit: form.usage_limit !== '' && form.usage_limit !== null && form.usage_limit !== undefined
    ? Number(form.usage_limit)
    : null,  // null for empty
  applicable_turfs: form.applicable_turfs || [],
  applicable_state: form.applicable_state.trim() || null,  // null for empty
  applicable_district: form.applicable_district.trim() || null,  // null for empty
};

    console.log('📋 Form data being submitted:', commonData);

    let discountId: number | null = null;

    if (isEdit && numericId) {
      // Update
      console.log(`🔄 Updating ${isAdminType ? 'admin' : 'partner'} discount ID: ${numericId}`);
      const updateFn = isAdminType ? updateAdminDiscount : updatePartnerDiscount;
      const updateData: UpdateDiscountRequest = {
        ...commonData,
        turf: !isAdminType && form.turf_id ? Number(form.turf_id) : undefined,
      };
      const response = await updateFn(numericId, updateData);
      
      discountId = extractDiscountId(response);
      console.log(`✅ ${isAdminType ? 'Admin' : 'Partner'} discount updated successfully:`, response);
    } else {
      // Create
      console.log(`🚀 Creating new ${isAdminType ? 'admin' : 'partner'} discount`);
      let response: Discount | null = null;
      
      if (isAdminType) {
        const createData: CreateAdminDiscountRequest = {
          name: commonData.name,
          description: commonData.description || undefined,
          discount_type: commonData.discount_type,
          discount_value: commonData.discount_value,
          max_discount_amount: commonData.max_discount_amount,
          min_amount: commonData.min_amount,
          min_slots: commonData.min_slots,
          applicable_payment_type: commonData.applicable_payment_type,
          applicable_time_start: commonData.applicable_time_start || undefined,
          applicable_time_end: commonData.applicable_time_end || undefined,
          mon: commonData.mon,
          tue: commonData.tue,
          wed: commonData.wed,
          thu: commonData.thu,
          fri: commonData.fri,
          sat: commonData.sat,
          sun: commonData.sun,
          is_active: commonData.is_active,
          start_date: commonData.start_date || undefined,
          end_date: commonData.end_date || undefined,
          usage_limit: commonData.usage_limit,
          applicable_turfs: commonData.applicable_turfs,
          applicable_state: commonData.applicable_state || undefined,
          applicable_district: commonData.applicable_district || undefined,
        };
        response = await createAdminDiscount(createData);
      } else {
        const createData: CreatePartnerDiscountRequest = {
          name: commonData.name,
          description: commonData.description || undefined,
          discount_type: commonData.discount_type,
          discount_value: commonData.discount_value,
          max_discount_amount: commonData.max_discount_amount,
          min_amount: commonData.min_amount,
          min_slots: commonData.min_slots,
          applicable_payment_type: commonData.applicable_payment_type,
          applicable_time_start: commonData.applicable_time_start || undefined,
          applicable_time_end: commonData.applicable_time_end || undefined,
          mon: commonData.mon,
          tue: commonData.tue,
          wed: commonData.wed,
          thu: commonData.thu,
          fri: commonData.fri,
          sat: commonData.sat,
          sun: commonData.sun,
          is_active: commonData.is_active,
          start_date: commonData.start_date || undefined,
          end_date: commonData.end_date || undefined,
          usage_limit: commonData.usage_limit,
          turf: Number(form.turf_id),
        };
        response = await createPartnerDiscount(createData);
      }
      
      discountId = extractDiscountId(response);
      console.log(`✅ ${isAdminType ? 'Admin' : 'Partner'} discount created successfully:`, response);
    }
    
    // Navigate to the detail page or list page
    if (discountId) {
      console.log(`🔗 Navigating to discount detail page: ${discountId}`);
      navigate(`/admin/discounts/${discountId}?type=${isAdminType ? 'admin' : 'partner'}`);
    } else {
      console.warn('⚠️ No discount ID found, redirecting to list');
      navigate('/admin/discounts');
    }
  } catch (err: unknown) {
    console.error('❌ Submit error:', err);
    const data = (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data;
    console.error('❌ Error response data:', data);
    if (data && typeof data === 'object') {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      Object.entries(data).forEach(([key, val]) => {
        const msg = Array.isArray(val) ? val[0] : String(val);
        if (key in getDefaultFormState()) {
          fieldErrors[key as keyof FormState] = msg;
        }
      });
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
        console.log('⚠️ Field errors:', fieldErrors);
        return;
      }
      setApiError((data as { message?: string }).message || 'Something went wrong.');
    } else {
      setApiError('Something went wrong. Please try again.');
    }
  } finally {
    setIsSaving(false);
  }
};

// ─── Helper to extract ID from response ──────────────────────────────────────
const extractDiscountId = (response: unknown): number | null => {
  if (!response) {
    console.warn('⚠️ Response is null or undefined');
    return null;
  }
  
  console.log('🔍 Extracting ID from response:', response);
  
  // If response is an object
  if (typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    
    // Check if it has an id directly
    if ('id' in obj && typeof obj.id === 'number') {
      console.log('✅ Found ID directly in response:', obj.id);
      return obj.id;
    }
    
    // Check if it has a data property with id
    if ('data' in obj && obj.data) {
      const data = obj.data as Record<string, unknown>;
      if ('id' in data && typeof data.id === 'number') {
        console.log('✅ Found ID in response.data:', data.id);
        return data.id;
      }
      // If data is an array with objects
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0] as Record<string, unknown>;
        if ('id' in firstItem && typeof firstItem.id === 'number') {
          console.log('✅ Found ID in response.data[0]:', firstItem.id);
          return firstItem.id;
        }
      }
    }
    
    // Check if it has a result property with data
    if ('result' in obj && 'data' in obj) {
      const data = obj.data as Record<string, unknown>;
      if (data && typeof data === 'object' && 'id' in data && typeof data.id === 'number') {
        console.log('✅ Found ID in result.data:', data.id);
        return data.id;
      }
    }
  }
  
  console.warn('⚠️ Could not extract ID from response');
  return null;
};

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading discount…</p>
        </div>
      </div>
    );
  }

  const isAdminSource = form.source === 'admin';
  const isPartnerSource = form.source === 'partner';

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/admin/discounts" className="text-decoration-none text-success">
                  <i className="bi bi-tags me-1"></i>Discounts
                </Link>
              </li>
              {isEdit && numericId && (
                <li className="breadcrumb-item">
                  <Link to={`/admin/discounts/${numericId}?type=${isAdminType ? 'admin' : 'partner'}`} className="text-decoration-none text-success">
                    Details
                  </Link>
                </li>
              )}
              <li className="breadcrumb-item active" aria-current="page">
                {isEdit ? 'Edit Discount' : `Add ${isAdminType ? 'Platform' : 'Partner'} Discount`}
              </li>
            </ol>
          </nav>
          <h1 className="h4 mb-0">
            <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} text-success me-2`}></i>
            {isEdit ? 'Edit Discount' : `Add ${isAdminType ? 'Platform' : 'Partner'} Discount`}
          </h1>
          <p className="text-secondary small">
            {isAdminType 
              ? 'Platform funded discount - BookYourTurf absorbs the cost'
              : 'Partner funded discount - Channel Partner absorbs the cost'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {apiError}
          </div>
        )}

        {/* ─── Source Info ──────────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-info-circle text-success me-2"></i>Discount Source
            </h5>
            <div className="d-flex flex-wrap align-items-center gap-3 p-3 bg-light rounded-3">
              <span className={`badge rounded-pill px-4 py-2 fs-6 ${isAdminType ? 'bg-primary' : 'bg-warning'}`}>
                <span className="me-1">{isAdminType ? '🏢' : '🤝'}</span>
                {isAdminType ? 'Platform Funded' : 'Partner Funded'}
              </span>
              <p className="mb-0 text-secondary small flex-grow-1">
                {isAdminType 
                  ? 'This discount is funded by BookYourTurf.'
                  : 'This discount is funded by the selected channel partner.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* ─── Basic Information ───────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-file-text text-success me-2"></i>Basic Information
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Discount Name <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  name="name"
                  type="text"
                  placeholder="e.g. Summer Sale 20%"
                  value={form.name}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Description</label>
                <input
                  className="form-control"
                  name="description"
                  type="text"
                  placeholder="e.g. 20% off on all bookings"
                  value={form.description}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">Brief description of the discount</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Discount Type <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  name="discount_type"
                  value={form.discount_type}
                  onChange={handleChange}
                  disabled={isSaving}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Discount Value <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${errors.discount_value ? 'is-invalid' : ''}`}
                  name="discount_value"
                  type="number"
                  min={0}
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                  step={form.discount_type === 'percentage' ? 0.01 : 1}
                  placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  value={form.discount_value}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                {errors.discount_value && <div className="invalid-feedback">{errors.discount_value}</div>}
                <div className="form-text">
                  {form.discount_type === 'percentage' ? 'Enter a value between 0 and 100' : 'Enter the fixed amount in ₹'}
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Applicable Payment Type</label>
                <select
                  className="form-select"
                  name="applicable_payment_type"
                  value={form.applicable_payment_type}
                  onChange={handleChange}
                  disabled={isSaving}
                >
                  {APPLICABLE_PAYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {APPLICABLE_PAYMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <div className="form-text">When this discount can be applied</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Max Discount Amount (₹)</label>
                <input
                  className="form-control"
                  name="max_discount_amount"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 150"
                  value={form.max_discount_amount}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">Optional cap on discount amount</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Minimum Order Amount (₹)</label>
                <input
                  className="form-control"
                  name="min_amount"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 500"
                  value={form.min_amount}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">Optional minimum amount required</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">
                  Minimum Slots
                </label>
                <input
                  className={`form-control ${errors.min_slots ? 'is-invalid' : ''}`}
                  name="min_slots"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={form.min_slots}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                {errors.min_slots && <div className="invalid-feedback">{errors.min_slots}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Applicable Days & Time ──────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-calendar3 text-success me-2"></i>Applicable Days & Time
            </h5>
            
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-semibold">Select applicable days (uncheck all = every day):</span>
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={selectAllDays}>
                  {DAYS.every(day => form[day]) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <label key={day} className={`btn btn-sm rounded-pill px-3 ${form[day] ? 'btn-success' : 'btn-outline-secondary'}`}>
                    <input
                      type="checkbox"
                      name={day}
                      checked={form[day]}
                      onChange={handleChange}
                      disabled={isSaving}
                      className="d-none"
                    />
                    {DAY_LABELS[day].slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Start Time (Optional)</label>
                <input
                  className="form-control"
                  name="applicable_time_start"
                  type="time"
                  value={form.applicable_time_start}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">e.g. 10:00</div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">End Time (Optional)</label>
                <input
                  className="form-control"
                  name="applicable_time_end"
                  type="time"
                  value={form.applicable_time_end}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">e.g. 18:00</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Validity & Usage ────────────────────────────────────────────── */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
          <div className="card-body">
            <h5 className="card-title fw-bold text-secondary mb-3">
              <i className="bi bi-clock text-success me-2"></i>Validity & Usage
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Start Date</label>
                <input
                  className="form-control"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">Leave empty for no start date</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">End Date</label>
                <input
                  className="form-control"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">Leave empty for no end date</div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Usage Limit</label>
                <input
                  className="form-control"
                  name="usage_limit"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={form.usage_limit}
                  onChange={handleChange}
                  disabled={isSaving}
                />
                <div className="form-text">Leave empty for unlimited</div>
              </div>

              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                  <div>
                    <div className="fw-semibold">
                      <i className={`bi ${form.is_active ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'} me-2 fs-4`}></i>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-secondary small">
                      {form.is_active ? 'Discount is available to users' : 'Discount is disabled'}
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
              </div>
            </div>
          </div>
        </div>

        {/* ─── Admin Discount Configuration ────────────────────────────────── */}
        {isAdminSource && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body">
              <h5 className="card-title fw-bold text-secondary mb-3">
                <i className="bi bi-building text-success me-2"></i>Platform Discount Configuration
              </h5>
              <p className="text-secondary small mb-3">
                <i className="bi bi-info-circle me-1"></i>
                This discount is funded by BookYourTurf. Select specific turfs or apply by location.
                {(!form.applicable_turfs || form.applicable_turfs.length === 0) && !form.applicable_state && !form.applicable_district && 
                  ' If no turfs or location are selected, the discount applies to ALL turfs.'
                }
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Applicable State (Optional)</label>
                  <input
                    className="form-control"
                    name="applicable_state"
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={form.applicable_state}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Applicable District (Optional)</label>
                  <input
                    className="form-control"
                    name="applicable_district"
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={form.applicable_district}
                    onChange={handleChange}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Applicable Turfs</label>
                <p className="text-secondary small">
                  Select specific turfs this discount applies to. Leave empty to apply to all turfs (subject to location filters).
                </p>
                <div className="border rounded-3 p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {loadingTurfs ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : !turfs || turfs.length === 0 ? (
                    <p className="text-muted small mb-0">No turfs available.</p>
                  ) : (
                    turfs.map((turf) => (
                      <label key={turf.id} className={`d-flex align-items-center gap-2 p-2 rounded-2 ${form.applicable_turfs?.includes(turf.id) ? 'bg-success bg-opacity-10' : ''}`}>
                        <input
                          type="checkbox"
                          checked={form.applicable_turfs?.includes(turf.id) || false}
                          onChange={() => handleTurfSelect(turf.id)}
                          disabled={isSaving}
                        />
                        <div>
                          <div className="fw-semibold small">{turf.name}</div>
                          <div className="text-secondary small">{turf.partner_name}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {form.applicable_turfs && form.applicable_turfs.length > 0 && (
                  <div className="mt-2 text-success small">
                    <i className="bi bi-check-circle me-1"></i>
                    {form.applicable_turfs.length} turf{form.applicable_turfs.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Partner Discount Configuration ───────────────────────────────── */}
        {isPartnerSource && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body">
              <h5 className="card-title fw-bold text-secondary mb-3">
                <i className="bi bi-person-badge text-success me-2"></i>Partner Discount Configuration
              </h5>
              <p className="text-secondary small mb-3">
                <i className="bi bi-info-circle me-1"></i>
                This discount is funded by the selected channel partner. The partner absorbs the discount cost.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Select Partner <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.partner_id ? 'is-invalid' : ''}`}
                    name="partner_id"
                    value={form.partner_id}
                    onChange={handleChange}
                    disabled={isSaving || loadingPartners}
                  >
                    <option value="">— Select Partner —</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                  {errors.partner_id && <div className="invalid-feedback">{errors.partner_id}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Select Turf <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.turf_id ? 'is-invalid' : ''}`}
                    name="turf_id"
                    value={form.turf_id}
                    onChange={handleChange}
                    disabled={isSaving || !form.partner_id || loadingTurfs}
                  >
                    <option value="">— Select Turf —</option>
                    {filteredTurfs.map((turf) => (
                      <option key={turf.id} value={turf.id}>
                        {turf.name} ({turf.game_type})
                      </option>
                    ))}
                  </select>
                  {errors.turf_id && <div className="invalid-feedback">{errors.turf_id}</div>}
                  {!form.partner_id && (
                    <div className="form-text text-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Please select a partner first to see available turfs.
                    </div>
                  )}
                </div>
              </div>

              {form.turf_id && (
                <div className="mt-3 p-3 bg-success bg-opacity-10 rounded-3">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  <span className="fw-semibold">Selected Turf:</span>
                  <span className="ms-2">
                    {filteredTurfs.find(t => t.id === Number(form.turf_id))?.name || 'Loading...'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Actions ────────────────────────────────────────────────────────── */}
        <div className="d-flex gap-3">
          <Link
            to={isEdit && numericId ? `/admin/discounts/${numericId}?type=${isAdminType ? 'admin' : 'partner'}` : '/admin/discounts'}
            className="btn btn-outline-secondary rounded-pill px-4"
          >
            <i className="bi bi-x-circle me-1"></i> Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-success rounded-pill px-4 shadow-sm"
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
              <><i className="bi bi-plus-circle me-1"></i> Create {isAdminType ? 'Platform' : 'Partner'} Discount</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiscountFormPage;