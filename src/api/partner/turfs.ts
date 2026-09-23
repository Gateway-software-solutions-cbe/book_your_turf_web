// src/api/partner/turfs.ts
import client from "../admin/client";
import type {
  PartnerTurf,
  CreateTurfPayload,
  UpdateTurfPayload,
  Facilities,
} from "../../types/partner/turf";

const TURFS_BASE = "/api/partner/manage-turfs";

interface ApiResponse<T = unknown> {
  result: "success" | "error";
  message: string;
  data: T;
}

const buildTurfFormData = (
  payload: Partial<CreateTurfPayload & { delete_images?: number[] }>,
): FormData => {
  const fd = new FormData();

  const appendScalar = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    fd.append(key, String(value));
  };

  appendScalar("name", payload.name);
  appendScalar("game_type", payload.game_type);
  appendScalar("address", payload.address);
  appendScalar("description", payload.description);
  appendScalar("achievements", payload.achievements);
  appendScalar("latitude", payload.latitude);
  appendScalar("longitude", payload.longitude);
  appendScalar("state", payload.state);
  appendScalar("district", payload.district);
  appendScalar("pincode", payload.pincode);
  appendScalar("max_persons", payload.max_persons);
  appendScalar("courts", payload.courts);
  appendScalar("open_time", payload.open_time);
  appendScalar("close_time", payload.close_time);

  if (payload.dimension_data) {
    fd.append("dimension_data", JSON.stringify(payload.dimension_data));
  }
  if (payload.facilities) {
    fd.append("facilities", JSON.stringify(payload.facilities));
  }
  if (payload.court_shifts) {
    fd.append("court_shifts", JSON.stringify(payload.court_shifts));
  }

  if (payload.images) {
    payload.images.forEach((file) => fd.append("images", file));
  }

  if (payload.delete_images) {
    payload.delete_images.forEach((id) =>
      fd.append("delete_images", String(id)),
    );
  }

  return fd;
};

export const partnerTurfsApi = {
  list: async () => {
    const { data } = await client.get<ApiResponse<PartnerTurf[]>>(
      `${TURFS_BASE}/`,
    );
    return data;
  },

  detail: async (id: number | string) => {
    const { data } = await client.get<ApiResponse<PartnerTurf>>(
      `${TURFS_BASE}/${id}/`,
    );
    return data;
  },

  create: async (payload: CreateTurfPayload) => {
    const fd = buildTurfFormData(payload);
    const { data } = await client.post<ApiResponse>(`${TURFS_BASE}/`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: number | string, payload: UpdateTurfPayload) => {
    const fd = buildTurfFormData(payload);
    const { data } = await client.patch<ApiResponse<PartnerTurf>>(
      `${TURFS_BASE}/${id}/`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  remove: async (id: number | string) => {
    const { data } = await client.delete<ApiResponse>(`${TURFS_BASE}/${id}/`);
    return data;
  },
};

// ─── Defaults / constants used by the form ───────────────────
export const DEFAULT_WEEK_PRICES = () => ({
  mon: 500,
  tue: 500,
  wed: 500,
  thu: 500,
  fri: 600,
  sat: 700,
  sun: 700,
});

export const FACILITY_OPTIONS: {
  key: keyof Facilities;
  label: string;
  icon: string;
}[] = [
  { key: "parking", label: "Parking", icon: "🅿" },
  { key: "wifi", label: "WiFi", icon: "📶" },
  { key: "Drinking water", label: "Drinking Water", icon: "💧" },
  { key: "Rest room", label: "Rest Room", icon: "🚻" },
  { key: "Sports kits", label: "Sports Kits", icon: "🏏" },
  { key: "CCTV", label: "CCTV", icon: "📹" },
  { key: "Music systems", label: "Music Systems", icon: "🎵" },
  { key: "Dressing room", label: "Dressing Room", icon: "👕" },
];

export const SPORTS_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "Cricket & Football", label: "Cricket & Football", emoji: "⚽" },
  { value: "Badminton", label: "Badminton", emoji: "🏸" },
  { value: "Pickleball", label: "Pickleball", emoji: "🏓" },
];