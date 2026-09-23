import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { partnerTurfsApi } from "../../../api/partner/turfs";
import type {
  CourtShift,
  CreateTurfPayload,
  DimensionData,
  Facilities,
  PartnerTurf,
  WeekPrices,
  WeekPricesApi,
} from "../../../types/partner/turf";

import SportSection from "./sections/SportSection";
import PhotosSection from "./sections/PhotosSection";
import BusinessInfoSection from "./sections/BusinessInfoSection";
import LocationSection from "./sections/LocationSection";
import OperatingHoursSection from "./sections/OperatingHoursSection";
import DimensionsSection from "./sections/DimensionsSection";
import AmenitiesSection from "./sections/AmenitiesSection";
import CourtShiftSection from "./sections/CourtShiftSection";

import "./style/AddVenuePage.css";

interface FormState {
  game_type: string;
  images: File[];
  existingImages: { id: number; url: string }[];
  imagesToDelete: number[];
  name: string;
  business_name: string;
  description: string;
  achievements: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  state: string;
  district: string;
  pincode: string;
  open_time: string;
  close_time: string;
  dimension_data: DimensionData;
  max_persons: number;
  courts: number;
  facilities: Facilities;
  court_shifts: CourtShift[];
}

// ─── Empty builders ────────────────────────────────────────
const emptyPrices = (): WeekPrices => ({
  mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0,
});

const buildEmptyShift = (courtNumber: number): CourtShift => ({
  court_number: courtNumber,
  day_shift: {
    start_time: "",
    end_time: "",
    prices: emptyPrices(),
  },
  night_shift: {
    start_time: "",
    end_time: "",
    prices: emptyPrices(),
  },
});

const buildInitialState = (gameType: string): FormState => {
  const sportKey = gameType.trim().toLowerCase();
  const isStandardSport =
    sportKey.includes("badminton") || sportKey.includes("pickleball");

  return {
    game_type: gameType,
    images: [],
    existingImages: [],
    imagesToDelete: [],
    name: "",
    business_name: "",
    description: "",
    achievements: "",
    address: "",
    latitude: null,
    longitude: null,
    state: "",
    district: "",
    pincode: "",
    open_time: "",
    close_time: "",
    dimension_data: {
      unit: "feet",
      height: "",
      length: "",
      breadth: "",
      turf_shape: "square",
    },
    max_persons: isStandardSport ? 4 : 0,
    courts: 1,
    facilities: {
      parking: false,
      wifi: false,
      "Drinking water": false,
      "Rest room": false,
      "Sports kits": false,
      CCTV: false,
      "Music systems": false,
      "Dressing room": false,
    },
    court_shifts: [buildEmptyShift(1)],
  };
};

// ─── Sport-aware unit label ────────────────────────────────
const getUnitLabel = (gameType: string): "Turf" | "Court" => {
  const key = gameType.trim().toLowerCase();
  if (key.includes("cricket") || key.includes("football")) return "Turf";
  return "Court";
};

// ─── Time helpers ──────────────────────────────────────────
const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
};

type VenueWindow = "normal" | "overnight" | "allDay";

const getVenueWindow = (open: string, close: string): VenueWindow => {
  if (!open || !close) return "normal";
  const om = toMinutes(open);
  const cm = toMinutes(close);
  if (Number.isNaN(om) || Number.isNaN(cm)) return "normal";
  if (om === cm) return "allDay";
  if (cm < om) return "overnight";
  return "normal";
};

/**
 * Is the shift (s → e) fully inside the venue window [open, close]?
 *
 * - Normal venue (open < close): open ≤ s < e ≤ close
 * - Overnight venue (open > close): shift must start in evening window or
 *   early morning window and end accordingly, without leaving the open range
 * - 24h venue (open === close): start must be >= open, and:
 *     · end > start → same-day end, valid
 *     · end < start → overnight end, must be <= close (the closing cutoff)
 *     · end === start → invalid (zero-length)
 *
 * Returns true when inputs are missing/invalid so other rules can report it.
 */
const isShiftInsideVenue = (
  s: string,
  e: string,
  open: string,
  close: string,
): boolean => {
  if (!s || !e || !open || !close) return true;
  const sm = toMinutes(s);
  const em = toMinutes(e);
  const om = toMinutes(open);
  const cm = toMinutes(close);
  if ([sm, em, om, cm].some(Number.isNaN)) return true;

  // Zero-length shifts are never valid
  if (sm === em) return false;

  const kind = getVenueWindow(open, close);

  if (kind === "allDay") {
    // start must be >= venue open
    if (sm < om) return false;
    // same-day end
    if (em > sm) return true;
    // overnight end — must not exceed the closing cutoff
    return em <= cm;
  }

  if (kind === "normal") {
    // open < close, both endpoints must fit on the same day
    return sm >= om && em <= cm && em > sm;
  }

  // overnight venue: open > close (e.g., 18:00 → 06:00)
  // Valid shift shapes:
  //   (a) both in evening window:  om ≤ s < e < 24:00
  //   (b) both in morning window:  00:00 ≤ s < e ≤ cm
  //   (c) wraps: start in evening, end in morning:  s ≥ om, e ≤ cm
  const startEvening = sm >= om;
const startMorning = sm < cm;
const endEvening = em >= om;
const endMorning = em < cm;

// Allow a shift to end exactly at midnight.
const endAtMidnight = em === 0;

if (startEvening && (endMorning || endAtMidnight)) {
  return true;
}

if (startEvening && endEvening && em > sm) {
  return true;
}

if (startMorning && endMorning && em > sm) {
  return true;
}

return false;
};

/**
 * Do two windows overlap? Overnight windows are pushed past midnight.
 * Touching boundaries do NOT count as overlap.
 */
const windowsOverlap = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean => {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const toInterval = (s: string, e: string): [number, number] => {
    const sm = toMinutes(s);
    const em = toMinutes(e);
    if (Number.isNaN(sm) || Number.isNaN(em)) return [NaN, NaN];
    if (sm === em) return [0, 24 * 60];
    if (sm < em) return [sm, em];
    return [sm, em + 24 * 60];
  };
  const [as, ae] = toInterval(aStart, aEnd);
  const [bs, be] = toInterval(bStart, bEnd);
  if ([as, ae, bs, be].some(Number.isNaN)) return false;
  const shift = Math.min(as, bs);
  return as - shift < be - shift && bs - shift < ae - shift;
};

const AddVenuePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const isEdit = Boolean(id) && id !== "new";
  const preselectedSport = searchParams.get("sport") ?? "";

  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(preselectedSport),
  );
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Load existing turf when editing ─────────────────────
  useEffect(() => {
    if (!isEdit || !id || id === "new") return;
    (async () => {
      try {
        const res = await partnerTurfsApi.detail(id);
        const t: PartnerTurf = res.data;
        if (t.status !== "Approved") {
          navigate("/partner/venues", { replace: true });
          return;
        }
        setForm({
          game_type: t.game_type,
          images: [],
          existingImages: t.images.map((i) => ({ id: i.id, url: i.url })),
          imagesToDelete: [],
          name: t.name,
          business_name: "",
          description: t.description || "",
          achievements: t.achievements || "",
          address: t.address,
          latitude: t.latitude ? Number(t.latitude) : null,
          longitude: t.longitude ? Number(t.longitude) : null,
          state: t.state,
          district: t.district,
          pincode: t.pincode,
          open_time: t.open_time.slice(0, 5),
          close_time: t.close_time.slice(0, 5),
          dimension_data: t.dimension_data,
          max_persons: t.max_persons,
          courts: t.courts,
          facilities: t.facilities,
          court_shifts: rebuildCourtShifts(t),
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load venue");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  // ─── Field updaters ──────────────────────────────────────
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateFacility = (key: keyof Facilities, value: boolean) =>
    setForm((prev) => ({
      ...prev,
      facilities: { ...prev.facilities, [key]: value },
    }));

  const updateDimensions = (patch: Partial<DimensionData>) =>
    setForm((prev) => ({
      ...prev,
      dimension_data: { ...prev.dimension_data, ...patch },
    }));

  const updateCourtShift = (courtNumber: number, patch: Partial<CourtShift>) => {
    setForm((prev) => ({
      ...prev,
      court_shifts: prev.court_shifts.map((s) =>
        s.court_number === courtNumber ? { ...s, ...patch } : s,
      ),
    }));
  };

  const handleAddShift = () => {
    setForm((prev) => {
      if (prev.court_shifts.length >= 10) return prev;
      const nextNumber = prev.court_shifts.length + 1;
      return {
        ...prev,
        courts: nextNumber,
        court_shifts: [...prev.court_shifts, buildEmptyShift(nextNumber)],
      };
    });
  };

  const handleRemoveShift = (courtNumber: number) => {
    setForm((prev) => {
      if (prev.court_shifts.length <= 1) return prev;
      const filtered = prev.court_shifts.filter(
        (s) => s.court_number !== courtNumber,
      );
      const renumbered = filtered.map((s, i) => ({
        ...s,
        court_number: i + 1,
      }));
      return {
        ...prev,
        courts: renumbered.length,
        court_shifts: renumbered,
      };
    });
  };

  // ─── Validation ──────────────────────────────────────────
  const validate = (): string | null => {
    const sportKey = form.game_type.trim().toLowerCase();
    const isStandardSport =
      sportKey.includes("badminton") || sportKey.includes("pickleball");
    const isCricketFootball =
      sportKey.includes("cricket") || sportKey.includes("football");
    const unit = getUnitLabel(form.game_type);

    // Sport
    if (!form.game_type.trim()) return "Please select a sport";

    // Photos
    const totalImages = form.images.length + form.existingImages.length;
    if (!isEdit && totalImages === 0) return "Please add at least 1 photo";
    if (totalImages > 5) return "Maximum 5 photos allowed";

    // Business
    if (!form.name.trim()) return "Venue / Business name is required";
    if (form.name.trim().length < 2)
      return "Venue name must be at least 2 characters";

    // Location
    if (!form.address.trim()) return "Full address is required";
    if (form.address.trim().length < 5)
      return "Please enter a more detailed address";
    if (form.latitude == null || form.longitude == null)
      return "Please pick the location on the map";
    if (!Number.isFinite(form.latitude) || !Number.isFinite(form.longitude))
      return "Invalid coordinates. Please re-pick the location.";
    if (!form.state.trim()) return "State is required";
    if (!form.district.trim()) return "District is required";
    if (!/^\d{6}$/.test(form.pincode))
      return "Pincode must be exactly 6 digits";

    // Operating hours
    if (!form.open_time) return "Opening time is required";
    if (!form.close_time) return "Closing time is required";

    // Dimensions — only for Cricket & Football
    if (isCricketFootball) {
      const { length, breadth, height, turf_shape } = form.dimension_data;
      const len = Number(length);
      const brd = Number(breadth);
      const hgt = height === "" ? 0 : Number(height);

      if (!length || Number.isNaN(len) || len <= 0)
        return "Length must be a positive number";
      if (!breadth || Number.isNaN(brd) || brd <= 0)
        return "Breadth must be a positive number";
      if (height !== "" && (Number.isNaN(hgt) || hgt < 0))
        return "Height must be a valid number (0 or greater)";
      if (turf_shape !== "square" && turf_shape !== "round")
        return "Turf shape must be Square or Round";
    }

    if (isStandardSport) {
      if (form.max_persons !== 4)
        return `${form.game_type} max persons must be 4`;
    } else if (isCricketFootball) {
      if (!Number.isInteger(form.max_persons) || form.max_persons < 1)
        return "Max persons must be a positive whole number";
      if (form.max_persons > 200)
        return "Max persons looks too high (max 200)";
    } else {
      if (!Number.isInteger(form.max_persons) || form.max_persons < 1)
        return "Max persons must be a positive whole number";
    }

    // Amenities
    const hasAmenity = Object.values(form.facilities).some(Boolean);
    if (!hasAmenity) return "Select at least one amenity";

    // ─── Court shifts & prices ─────────────────────────────
    for (const shift of form.court_shifts) {
      const c = shift.court_number;
      const { day_shift, night_shift } = shift;

      // Required times
      if (!day_shift.start_time)
        return `${unit} ${c}: day start time is required`;
      if (!day_shift.end_time)
        return `${unit} ${c}: day end time is required`;
      if (!night_shift.start_time)
        return `${unit} ${c}: night start time is required`;
      if (!night_shift.end_time)
        return `${unit} ${c}: night end time is required`;

      // Zero-length shifts are invalid
      if (day_shift.start_time === day_shift.end_time)
        return `${unit} ${c}: day shift must have a duration`;
      if (night_shift.start_time === night_shift.end_time)
        return `${unit} ${c}: night shift must have a duration`;

      // Day shift must lie inside venue hours
      if (
        !isShiftInsideVenue(
          day_shift.start_time,
          day_shift.end_time,
          form.open_time,
          form.close_time,
        )
      ) {
        return `${unit} ${c}: day shift must be within venue hours (${form.open_time} – ${form.close_time})`;
      }

      // Night shift must lie inside venue hours
      if (
        !isShiftInsideVenue(
          night_shift.start_time,
          night_shift.end_time,
          form.open_time,
          form.close_time,
        )
      ) {
        return `${unit} ${c}: night shift must be within venue hours (${form.open_time} – ${form.close_time})`;
      }

      // Day and night on the same court must not overlap
      if (
        windowsOverlap(
          day_shift.start_time,
          day_shift.end_time,
          night_shift.start_time,
          night_shift.end_time,
        )
      ) {
        return `${unit} ${c}: day and night shifts must not overlap`;
      }

      // Day prices
      const dayEntries = Object.entries(day_shift.prices);
      for (const [day, p] of dayEntries) {
        if (Number.isNaN(Number(p)) || p < 0)
          return `${unit} ${c} day (${day}): price must be 0 or greater`;
      }
      const dayTotal = dayEntries.reduce((sum, [, p]) => sum + Number(p), 0);
      if (dayTotal <= 0) return `${unit} ${c}: enter at least one day price`;

      // Night prices
      const nightEntries = Object.entries(night_shift.prices);
      for (const [day, p] of nightEntries) {
        if (Number.isNaN(Number(p)) || p < 0)
          return `${unit} ${c} night (${day}): price must be 0 or greater`;
      }
      const nightTotal = nightEntries.reduce(
        (sum, [, p]) => sum + Number(p),
        0,
      );
      if (nightTotal <= 0)
        return `${unit} ${c}: enter at least one night price`;
    }

    return null;
  };

  // ─── Submit ──────────────────────────────────────────────
  const handleSave = async () => {
  setError("");
  setSuccessMsg("");
  const v = validate();
  if (v) {
    setError(v);
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return;
  }

  setSaving(true);
  try {
    if (isEdit && id) {
      await partnerTurfsApi.update(Number(id), {
        name: form.name,
        game_type: form.game_type,
        address: form.address,
        description: form.description,
        achievements: form.achievements,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        state: form.state,
        district: form.district,
        pincode: form.pincode,
        dimension_data: form.dimension_data,
        max_persons: form.max_persons,
        courts: form.courts,
        facilities: form.facilities,
        open_time: toTimeString(form.open_time),
        close_time: toTimeString(form.close_time),
        court_shifts: form.court_shifts,
        images: form.images.length ? form.images : undefined,
        delete_images: form.imagesToDelete.length
          ? form.imagesToDelete
          : undefined,
      });
      setSuccessMsg("Turf updated successfully");
      setForm(buildInitialState(form.game_type));
      setTimeout(() => navigate("/partner/venues"), 1200);
    } else {
      const payload: CreateTurfPayload = {
        name: form.name,
        game_type: form.game_type,
        address: form.address,
        description: form.description,
        achievements: form.achievements,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        state: form.state,
        district: form.district,
        pincode: form.pincode,
        dimension_data: form.dimension_data,
        max_persons: form.max_persons,
        courts: form.courts,
        facilities: form.facilities,
        open_time: toTimeString(form.open_time),
        close_time: toTimeString(form.close_time),
        court_shifts: form.court_shifts,
        images: form.images,
      };
      await partnerTurfsApi.create(payload);
      setSuccessMsg(
        "Venue submitted for approval. You'll be notified once it's approved.",
      );
      setTimeout(() => navigate("/partner/venues"), 1600);
    }
  } catch (err: any) {
    setError(err?.response?.data?.message || "Failed to save venue");
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="pt-add-venue-loading">Loading venue details...</div>
    );
  }

  return (
    <div className="pt-add-venue">
      <header className="pt-add-venue-header">
        <button
          className="pt-add-venue-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ‹
        </button>
        <h1>{isEdit ? "Edit Venue" : "Add New Venue"}</h1>
        <span className="pt-add-venue-status">
          {isEdit ? "Update" : "Draft"}
        </span>
      </header>

      {error && (
        <div ref={errorRef} className="pt-auth-error">
          {error}
        </div>
      )}
      {successMsg && <div className="pt-success-banner">{successMsg}</div>}

      <SportSection value={form.game_type} onChange={() => {}} />

      <PhotosSection
        newImages={form.images}
        existingImages={form.existingImages}
        onAdd={(files) =>
          update("images", [...form.images, ...files].slice(0, 5))
        }
        onRemoveNew={(idx) =>
          update("images", form.images.filter((_, i) => i !== idx))
        }
        onRemoveExisting={(id) => {
          update(
            "existingImages",
            form.existingImages.filter((img) => img.id !== id),
          );
          update("imagesToDelete", [...form.imagesToDelete, id]);
        }}
      />

      <BusinessInfoSection
        name={form.name}
        businessName={form.business_name}
        description={form.description}
        achievements={form.achievements}
        onChange={(k, v) => update(k as keyof FormState, v as any)}
      />

      <LocationSection
        address={form.address}
        latitude={form.latitude}
        longitude={form.longitude}
        state={form.state}
        district={form.district}
        pincode={form.pincode}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />

      <OperatingHoursSection
        openTime={form.open_time}
        closeTime={form.close_time}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />

      <DimensionsSection
        data={form.dimension_data}
        maxPersons={form.max_persons}
        courts={form.courts}
        gameType={form.game_type}
        onChangeDimensions={updateDimensions}
        onChangeMaxPersons={(n) => update("max_persons", n)}
        onChangeCourts={() => {}}
      />

      <AmenitiesSection
        facilities={form.facilities}
        onChange={updateFacility}
      />

      <CourtShiftSection
        shifts={form.court_shifts}
        gameType={form.game_type}
        venueOpenTime={form.open_time}
        venueCloseTime={form.close_time}
        onChangeShift={updateCourtShift}
        onAddShift={handleAddShift}
        onRemoveShift={handleRemoveShift}
      />

      <div className="pt-add-venue-save-bar">
        {error && <div className="pt-save-error">{error}</div>}
        <button
          className="pt-add-venue-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : isEdit ? "Update Venue" : "Save Venue"}
        </button>
      </div>
    </div>
  );
};

// ─── Helpers ────────────────────────────────────────────────
function toTimeString(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function rebuildCourtShifts(t: PartnerTurf): CourtShift[] {
  const shifts: CourtShift[] = [];
  for (let i = 1; i <= t.courts; i++) {
    const day = t.timings[`court_${i}_day`];
    const night = t.timings[`court_${i}_night`];
    shifts.push({
      court_number: i,
      day_shift: {
        start_time: day?.start_time ?? "",
        end_time: day?.end_time ?? "",
        prices: parsePrices(day?.prices),
      },
      night_shift: {
        start_time: night?.start_time ?? "",
        end_time: night?.end_time ?? "",
        prices: parsePrices(night?.prices),
      },
    });
  }
  return shifts.length ? shifts : [buildEmptyShift(1)];
}

function parsePrices(prices?: WeekPricesApi): WeekPrices {
  if (!prices) return emptyPrices();
  return {
    mon: Number(prices.mon) || 0,
    tue: Number(prices.tue) || 0,
    wed: Number(prices.wed) || 0,
    thu: Number(prices.thu) || 0,
    fri: Number(prices.fri) || 0,
    sat: Number(prices.sat) || 0,
    sun: Number(prices.sun) || 0,
  };
}

export default AddVenuePage;