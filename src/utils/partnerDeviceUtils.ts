import type { PartnerDevicePlatform, RegisterPartnerDeviceRequest } from "../types/partner/device";

const PARTNER_DEVICE_ID_KEY = "partner_device_id";
const PARTNER_PUSH_TOKEN_KEY = "partner_web_push_token";
const IP_GEOLOOKUP_CACHE_KEY = "partner_ip_location";

// ─── IP-based geolocation ────────────────────────────────────────────────
/**
 * Look up the current location via IP using ipapi.co.
 * Free, HTTPS, CORS-enabled, no API key.
 * Cached per browser session to avoid rate limits.
 */
export const detectPartnerLocationViaIP = async (): Promise<
  string | undefined
> => {
  // Cache per session
  const cached = sessionStorage.getItem(IP_GEOLOOKUP_CACHE_KEY);
  if (cached) return cached || undefined;

  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) throw new Error("IP lookup failed");

    const data = await res.json();
    // Prefer "city, region" for a clean label
    const label =
      data.city && data.region
        ? `${data.city}, ${data.region}`
        : data.city || data.region || data.country_name || undefined;

    if (label) sessionStorage.setItem(IP_GEOLOOKUP_CACHE_KEY, label);
    return label;
  } catch (err) {
    console.warn("[partnerDeviceUtils] IP lookup failed:", err);
    return undefined;
  }
};

// ─── Fallback: timezone-based location ───────────────────────────────────
export const detectPartnerLocationFromTimezone = (): string | undefined => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // "Asia/Kolkata"
    return tz.split("/").pop()?.replace(/_/g, " ");
  } catch {
    return undefined;
  }
};

// ─── Stable client device ID ─────────────────────────────────────────────
export const getPartnerDeviceId = (): string => {
  let id = localStorage.getItem(PARTNER_DEVICE_ID_KEY);
  if (!id) {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    id = `WEB-${rand}`;
    localStorage.setItem(PARTNER_DEVICE_ID_KEY, id);
  }
  return id;
};

// ─── Platform detection ──────────────────────────────────────────────────
export const detectPartnerPlatform = (): PartnerDevicePlatform => {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "web";
};

// ─── Browser + OS label ──────────────────────────────────────────────────
export const getPartnerDeviceName = (): string => {
  const ua = navigator.userAgent;

  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  let os = "";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return os ? `${browser} on ${os}` : browser;
};

// ─── OS version ──────────────────────────────────────────────────────────
export const getPartnerOsVersion = (): string => {
  const ua = navigator.userAgent;

  const android = ua.match(/Android\s+([\d.]+)/);
  if (android) return `Android ${android[1]}`;

  const ios = ua.match(/OS\s+([\d_]+)/);
  if (ios) return `iOS ${ios[1].replace(/_/g, ".")}`;

  const win = ua.match(/Windows NT\s+([\d.]+)/);
  if (win) {
    const map: Record<string, string> = {
      "10.0": "10 / 11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
    };
    return `Windows ${map[win[1]] || win[1]}`;
  }

  const mac = ua.match(/Mac OS X\s+([\d_]+)/);
  if (mac) return `macOS ${mac[1].replace(/_/g, ".")}`;

  if (/Linux/.test(ua)) return "Linux";

  return "Unknown";
};

// ─── Web "push" token (dummy) ────────────────────────────────────────────
export const getOrCreatePartnerWebPushToken = (): string => {
  let token = localStorage.getItem(PARTNER_PUSH_TOKEN_KEY);
  if (!token) {
    token = `partner-web-${Math.random()
      .toString(36)
      .substring(2)}${Date.now().toString(36)}`;
    localStorage.setItem(PARTNER_PUSH_TOKEN_KEY, token);
  }
  return token;
};

export const buildRegisterPartnerDevicePayload =
  async (): Promise<RegisterPartnerDeviceRequest> => {
    // Try IP-based first; fall back to timezone if it fails
    let location = await detectPartnerLocationViaIP();
    if (!location) {
      location = detectPartnerLocationFromTimezone();
    }

    return {
      token: getOrCreatePartnerWebPushToken(),
      device_id: getPartnerDeviceId(),
      device_name: getPartnerDeviceName(),
      platform: detectPartnerPlatform(),
      os_version: getPartnerOsVersion(),
      location: location ?? "Location Unavailable",
    };
  };