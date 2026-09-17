// src/utils/deviceUtils.ts
import type { DevicePlatform, RegisterDeviceRequest } from '../types/user/device';

const DEVICE_ID_KEY = 'byt_device_id';
const IP_GEOLOOKUP_CACHE_KEY = 'byt_ip_location';

export const detectLocationViaIP = async (): Promise<string | undefined> => {
  // Cache for the session — avoid hitting rate limits
  const cached = sessionStorage.getItem(IP_GEOLOOKUP_CACHE_KEY);
  if (cached) return cached || undefined;

  try {
    // Free, no API key, HTTPS, CORS-enabled
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (!res.ok) throw new Error('IP lookup failed');

    const data = await res.json();
    // Prefer city + region for a clean label
    const label =
      data.city && data.region
        ? `${data.city}, ${data.region}`
        : data.city || data.region || data.country_name || undefined;

    if (label) sessionStorage.setItem(IP_GEOLOOKUP_CACHE_KEY, label);
    return label;
  } catch (err) {
    console.warn('IP location lookup failed:', err);
    return undefined;
  }
};

// ─── Stable client device ID ──────────────────────────────────────────────
export const getClientDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    // Format: WEB-XXXXXX (like the app's "AND-V1TD...")
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    id = `WEB-${rand}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

// ─── Platform detection ───────────────────────────────────────────────────
export const detectPlatform = (): DevicePlatform => {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'web';
};

// ─── OS version (best-effort) ─────────────────────────────────────────────
export const detectOsVersion = (): string => {
  const ua = navigator.userAgent;

  // Android: "Android 15"
  const android = ua.match(/Android\s+([\d.]+)/);
  if (android) return `Android ${android[1]}`;

  // iOS: "iPhone OS 17_0" → 17.0
  const ios = ua.match(/OS\s+([\d_]+)/);
  if (ios) return `iOS ${ios[1].replace(/_/g, '.')}`;

  // Windows: "Windows NT 10.0"
  const win = ua.match(/Windows NT\s+([\d.]+)/);
  if (win) {
    const map: Record<string, string> = {
      '10.0': '10 / 11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
    };
    return `Windows ${map[win[1]] || win[1]}`;
  }

  // macOS: "Mac OS X 10_15_7"
  const mac = ua.match(/Mac OS X\s+([\d_]+)/);
  if (mac) return `macOS ${mac[1].replace(/_/g, '.')}`;

  // Linux
  if (/Linux/.test(ua)) return 'Linux';

  return 'Unknown';
};

// ─── Device name (browser + OS) ───────────────────────────────────────────
export const detectDeviceName = (): string => {
  const ua = navigator.userAgent;

  // Browser
  let browser = 'Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari';
  else if (/OPR\//.test(ua)) browser = 'Opera';

  // OS label
  const platform = detectPlatform();
  let osLabel = 'Device';
  if (platform === 'android') osLabel = 'Android';
  else if (platform === 'ios') osLabel = 'iPhone';
  else if (/Windows/.test(ua)) osLabel = 'Windows PC';
  else if (/Macintosh/.test(ua)) osLabel = 'Mac';
  else if (/Linux/.test(ua)) osLabel = 'Linux PC';

  return `${browser} on ${osLabel}`;
};

// ─── Location (timezone-based, best-effort) ───────────────────────────────
export const detectLocation = (): string | undefined => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // "Asia/Kolkata"
    const city = tz.split('/').pop()?.replace(/_/g, ' ');         // "Kolkata"
    return city;
  } catch {
    return undefined;
  }
};

// ─── Push token (dummy on web) ────────────────────────────────────────────
/**
 * On web we don't have FCM by default. If you later add Firebase Web push,
 * replace this with the real token. For now, generate a stable pseudo-token
 * so the backend has something to store.
 */
export const getOrCreateWebPushToken = (): string => {
  const KEY = 'byt_web_push_token';
  let token = localStorage.getItem(KEY);
  if (!token) {
    token = `web-${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    localStorage.setItem(KEY, token);
  }
  return token;
};

// ─── Build the full registration payload ──────────────────────────────────
export const buildRegisterDevicePayload =
  async (): Promise<RegisterDeviceRequest> => {
    const location = await detectLocationViaIP();
    return {
      token: getOrCreateWebPushToken(),
      device_id: getClientDeviceId(),
      device_name: detectDeviceName(),
      platform: detectPlatform(),
      os_version: detectOsVersion(),
      location,
    };
  };

