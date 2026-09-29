// ─── Turf Types ────────────────────────────────────────────────────────────────
// Derived from real GET /api/admin/turfs/ and GET /api/admin/turfs/{id}/ responses

export type TurfStatus = 'Pending' | 'Approved' | 'Rejected';
export type GameType   = 'cricket & football' | 'badminton' | 'pickleball' | string;
export type AdvanceType     = 'percentage' | 'fixed';
export type CommissionType  = 'percentage' | 'fixed';

export interface TurfImage {
  id: number;
  url: string;
}

export interface TurfFacilities {
  CCTV:           boolean;
  wifi:           boolean;
  parking:        boolean;
  'Rest room':    boolean;
  'Sports kits':  boolean;
  'Dressing room':boolean;
  'Music systems':boolean;
  'Drinking water':boolean;
  [key: string]:  boolean; // future facilities
}

export interface TurfDimensionData {
  unit:       string; // "feet"
  height:     number;
  length:     number;
  breadth:    number;
  turf_shape: string; // "square"
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface CourtPeriodTiming {
  start_time: string; // "06:00"
  end_time:   string; // "18:00"
  prices:     Record<DayKey, string>; // "850.00"
}

/**
 * Timings keyed like "court_1_day", "court_1_night", "court_2_day", etc.
 * The number of courts determines how many keys exist.
 */
export type TurfTimings = Record<string, CourtPeriodTiming>;

// ─── List item (returned by GET /api/admin/turfs/) ─────────────────────────────
// The API returns "all fields" so both list and detail share the same shape.
export interface Turf {
  id:               number;
  name:             string;
  game_type:        GameType;
  address:          string;
  description:      string;
  achievements:     string;
  dimension_data:   TurfDimensionData | null;
  max_persons:      number;
  courts:           number;
  facilities:       TurfFacilities;
  open_time:        string; // "06:00:00"
  close_time:       string; // "00:00:00"
  status:           TurfStatus;
  created_at:       string; // ISO 8601
  latitude:         string;
  longitude:        string;
  state:            string;
  district:         string;
  pincode:          string;
  turf_code:        string;
  partner:          number;  // partner id
  partner_name:     string;
  partner_email:    string;
  images:           TurfImage[];
  timings:          TurfTimings;
  advance_type:     AdvanceType;
  advance_value:    string;   // "50.00"
  commission_type:  CommissionType;
  commission_value: string;   // "10.00"
  min_slots:        number;
}

// ─── Request shapes ────────────────────────────────────────────────────────────

export interface CreateTurfRequest {
  partner:           number;   // partner ID (required for create)
  name:              string;
  game_type:         GameType;
  address:           string;
  description?:      string;
  achievements?:     string;
  dimension_data?:   TurfDimensionData;
  max_persons:       number;
  courts:            number;
  facilities:        TurfFacilities;
  open_time:         string;   // "HH:MM:SS"
  close_time:        string;
  latitude?:         string;
  longitude?:        string;
  state?:            string;
  district?:         string;
  pincode?:          string;
  timings?:          TurfTimings;
  advance_type?:     AdvanceType;
  advance_value?:    string;
  commission_type?:  CommissionType;
  commission_value?: string;
  min_slots?:        number;
}

export interface UpdateTurfRequest {
  status?:           TurfStatus;
  name?:             string;
  description?:      string;
  max_persons?:      number;
  courts?:           number;
  open_time?:        string;
  close_time?:       string;
  advance_type?:     AdvanceType;
  advance_value?:    string;
  commission_type?:  CommissionType;
  commission_value?: string;
  min_slots?:        number;
  [key: string]:     unknown;
}

export interface ListTurfsParams {
  status?:     TurfStatus;
  partner_id?: number;
}