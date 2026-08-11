// ─── Mock Turf Types ───────────────────────────────────────────────────────────
// Derived from POST /api/admin/mock-turfs/ and GET /api/admin/mock-turfs/ responses

export interface MockTurfFacilities {
  parking?:        boolean;
  CCTV?:           boolean;
  wifi?:           boolean;
  'Rest room'?:    boolean;
  'Sports kits'?:  boolean;
  'Dressing room'?:boolean;
  'Music systems'?:boolean;
  'Drinking water'?:boolean;
  [key: string]:   boolean | undefined;
}

export interface MockTurf {
  id:           number;
  name:         string;
  address:      string;
  phone_number: string;
  /** Stored as JSON string or object depending on API version */
  facilities:   MockTurfFacilities | string;
  image:        string | null;
  image_url:    string | null;
  is_active:    boolean;
}

// ─── Parsed helper ─────────────────────────────────────────────────────────────
export const parseFacilities = (f: MockTurf['facilities']): MockTurfFacilities => {
  if (!f) return {};
  if (typeof f === 'string') {
    try { return JSON.parse(f); } catch { return {}; }
  }
  return f;
};

// ─── Request shapes ────────────────────────────────────────────────────────────
// Both POST and PATCH use multipart/form-data (image upload supported)

export interface MockTurfFormData {
  name:         string;
  address:      string;
  phone_number: string;
  facilities?:  MockTurfFacilities;
  image?:       File | null;
  is_active?:   boolean;
}