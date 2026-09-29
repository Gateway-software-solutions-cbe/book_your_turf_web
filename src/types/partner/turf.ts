// ─── Enums / unions ──────────────────────────────────────────
export type GameType = "Cricket & Football" | "Badminton" | "Pickleball";
export type TurfStatus = "Pending" | "Approved" | "Rejected";
export type DimensionUnit = "feet" | "meters";
export type TurfShape = "square" | "round";
export type AdvanceType = "percentage" | "fixed";
export type CourtType = "Synthetic" | "Wooden";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type WeekPrices = Record<DayKey, number>;

export type WeekPricesApi = Record<DayKey, string>;

// ─── Sub-objects ─────────────────────────────────────────────
export interface DimensionData {
  unit: DimensionUnit;
  height: string;
  length: string;
  breadth: string;
  turf_shape: TurfShape;
}

export interface Facilities {
  CCTV?: boolean;
  wifi?: boolean;
  parking?: boolean;
  "Rest room"?: boolean;
  "Sports kits"?: boolean;
  "Dressing room"?: boolean;
  "Music systems"?: boolean;
  "Drinking water"?: boolean;
}

export interface ShiftData {
  start_time: string; // "06:00"
  end_time: string;   // "18:00"
  prices: WeekPrices;
}

export interface ShiftDataApi {
  start_time: string;
  end_time: string;
  prices: WeekPricesApi;
}

export interface CourtShift {
  court_number: number;
  day_shift: ShiftData;
  night_shift: ShiftData;
}

export interface TurfImage {
  id: number;
  url: string;
}

export interface TurfTimings {
  [key: string]: ShiftDataApi; // court_1_day, court_1_night, etc.
}

// ─── Full turf entity (as returned by GET) ───────────────────
export interface PartnerTurf {
  id: number;
  name: string;
  game_type: string;
  address: string;
  description: string;
  achievements: string;
  dimension_data: DimensionData;
  max_persons: number;
  courts: number;
  facilities: Facilities;
  open_time: string;
  close_time: string;
  status: TurfStatus;
  created_at: string;
  latitude: string;
  longitude: string;
  state: string;
  district: string;
  pincode: string;
  images: TurfImage[];
  timings: TurfTimings;
  turf_code: string;
  advance_type: AdvanceType;
  advance_value: string;
  commission_type: AdvanceType;
  commission_value: string;
  min_slots: number;
}

// ─── Create payload ──────────────────────────────────────────
export interface CreateTurfPayload {
  name: string;
  game_type: string;
  address: string;
  description?: string;
  achievements?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  district?: string;
  pincode?: string;
  dimension_data: DimensionData;
  max_persons: number;
  courts: number;
  facilities: Facilities;
  open_time: string;  // "06:00:00"
  close_time: string; // "23:00:00"
  court_shifts: CourtShift[];
  images: File[];
}

// ─── Update payload ──────────────────────────────────────────
export interface UpdateTurfPayload extends Partial<Omit<CreateTurfPayload, "images" | "court_shifts">> {
  images?: File[];          // new images to add
  delete_images?: number[]; // image IDs to remove
  court_shifts?: CourtShift[];
}