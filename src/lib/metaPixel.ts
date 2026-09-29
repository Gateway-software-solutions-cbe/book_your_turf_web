/**
 * src/lib/metaPixel.ts
 * Meta Pixel helper — BookYourTurf
 * Pixel ID: 2629647084171904
 *
 *  Funnel events fired by the client:
 *    OTPVerified          → VerifyOtp (guest enters)
 *    ProfileGateHit       → gated pages (drop-off marker)
 *    CompleteRegistration → CompleteProfile (guest → registered)
 *    ViewContent          → TurfDetailPage (single source of truth)
 *    AddToCart            → BookingPage (slot selected)
 *    InitiateCheckout     → PaymentSummary (checkout started)
 *    Purchase             → BookingSuccess / RazorpayPayment
 *
 *  All events include the user context fields Meta requires:
 *    user_id, user_type, city, area, pincode, cluster,
 *    install_source, campaign_id, adset_id, ad_id, event_id
 */

// ── 1. TypeScript declaration for fbq ────────────────────────────────────
declare global {
  interface Window {
    fbq: (
      action: 'init' | 'track' | 'trackCustom' | 'trackSingle',
      eventNameOrPixelId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = '2629647084171904';

// ── 2. Persistent user context ──────────────────────────────────────────
export type UserType =
  | 'guest'
  | 'registered_not_booked'
  | 'first_booker'
  | 'repeat_booker';

export interface MetaUserContext {
  // ── User identity ────────────────────────────────────────────────
  user_id?: string | number;
  city?: string;
  area?: string;
  pincode?: string;
  cluster?: string;
  user_type?: UserType;

  // ── Ad attribution (Meta deferred deep-link params) ──────────────
  install_source?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  creative_name?: string;

  // ── Deep-link payload (mirrors mobile app spec) ──────────────────
  link_source?: 'ad' | 'push' | 'whatsapp' | 'share_card' | string;
  target_screen?: string;
  target_city?: string;
  target_turf_id?: string;
}

let USER_CONTEXT: MetaUserContext = {};

/**
 * Tracks the last user_id we initialised Meta's advanced matching for.
 * Prevents duplicate `fbq('init', ...)` calls when setUserContext runs
 * multiple times for the same user (which caused DUPLICATE_EVENT warnings).
 */
let lastInitUserId: string | number | null = null;

// ── 3. Cluster derivation ────────────────────────────────────────────────
const CLUSTER_MAP: Record<string, string> = {
  chennai: 'chennai',
  madurai: 'madurai',
  coimbatore: 'coimbatore',
  trichy: 'trichy',
  tiruchirappalli: 'trichy',
  salem: 'salem',
  tirunelveli: 'tirunelveli',
  nellai: 'tirunelveli',
};

const TN_CITIES = [
  'chennai', 'madurai', 'coimbatore', 'trichy', 'tiruchirappalli',
  'salem', 'tirunelveli', 'nellai', 'tiruppur', 'erode',
  'vellore', 'thanjavur', 'kanyakumari', 'nagercoil',
];

export function deriveCluster(city?: string): string | undefined {
  if (!city) return undefined;
  const c = city.trim().toLowerCase();
  if (CLUSTER_MAP[c]) return CLUSTER_MAP[c];
  if (TN_CITIES.includes(c)) return 'rest_tn';
  return 'other_state';
}

// ── 4. Attribution from URL / storage ────────────────────────────────────
const ATTRIBUTION_KEYS = [
  'install_source',
  'campaign_id',
  'adset_id',
  'ad_id',
  'creative_name',       // ← new
  'link_source',         // ← new (ad / push / whatsapp / share_card)
  'target_screen',       // ← new
  'target_city',         // ← new
  'target_turf_id',
] as const;

function readAttributionFromUrl(): MetaUserContext {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out: MetaUserContext = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

function readAttributionFromStorage(): MetaUserContext {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem('byt_attribution');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistAttribution(attribution: MetaUserContext) {
  try {
    if (Object.keys(attribution).length > 0) {
      sessionStorage.setItem('byt_attribution', JSON.stringify(attribution));
    }
  } catch { /* silent */ }
}

function persistUserContext() {
  try {
    sessionStorage.setItem('byt_user_ctx', JSON.stringify(USER_CONTEXT));
  } catch { /* silent */ }
}

function rehydrateUserContext(): MetaUserContext {
  try {
    const raw = sessionStorage.getItem('byt_user_ctx');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── 5. Public — set user context (call from login, location resolve, etc.)
export function setUserContext(ctx: MetaUserContext) {
  const rehydrated = rehydrateUserContext();
  const fromUrl = readAttributionFromUrl();
  const fromStorage = readAttributionFromStorage();
  const attribution = { ...fromStorage, ...fromUrl };

  const cluster = ctx.cluster ?? deriveCluster(ctx.city);

  const USER_TYPE_RANK: Record<UserType, number> = {
    guest: 0,
    registered_not_booked: 1,
    first_booker: 2,
    repeat_booker: 3,
  };

  const currentRank = USER_CONTEXT.user_type
    ? USER_TYPE_RANK[USER_CONTEXT.user_type]
    : -1;
  const incomingRank = ctx.user_type
    ? USER_TYPE_RANK[ctx.user_type]
    : -1;
  const rehydratedRank = rehydrated.user_type
    ? USER_TYPE_RANK[rehydrated.user_type]
    : -1;

  const highestRank = Math.max(currentRank, incomingRank, rehydratedRank);
  const winningUserType: UserType | undefined =
    highestRank >= 0
      ? (Object.keys(USER_TYPE_RANK) as UserType[]).find(
          (k) => USER_TYPE_RANK[k] === highestRank
        )
      : undefined;

  USER_CONTEXT = {
    ...rehydrated,
    ...USER_CONTEXT,
    ...attribution,
    ...ctx,
    ...(cluster ? { cluster } : {}),
    // Override with the never-downgrade winner
    ...(winningUserType ? { user_type: winningUserType } : {}),
  };

  persistAttribution(attribution);
  persistUserContext();

  if (ctx.user_id && lastInitUserId !== ctx.user_id) {
    lastInitUserId = ctx.user_id;
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('init', PIXEL_ID, {
          external_id: String(ctx.user_id),
          ct: ctx.city ? [ctx.city.trim().toLowerCase()] : undefined,
          zp: ctx.pincode,
        });
      }
    } catch { /* silent */ }
  }
}

export function getMetaUserContext(): MetaUserContext {
  return { ...USER_CONTEXT };
}

// ── 6. Safe caller — merges user context into every payload ──────────────
function fbq(
  event: string,
  params: Record<string, unknown> = {},
  eventId?: string,
) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;

    const ctx: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(USER_CONTEXT)) {
      if (v !== undefined && v !== null && v !== '') ctx[k] = v;
    }

    const fullParams = {
      ...ctx,
      content_category: appSide(),
      ...params,
    };

    if (eventId) {
      window.fbq('track', event, fullParams, { eventID: eventId });
    } else {
      window.fbq('track', event, fullParams);
    }
  } catch { /* never crash on analytics */ }
}

function fbqCustom(event: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;

    const ctx: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(USER_CONTEXT)) {
      if (v !== undefined && v !== null && v !== '') ctx[k] = v;
    }

    window.fbq('trackCustom', event, {
      ...ctx,
      content_category: appSide(),
      ...params,
    });
  } catch { /* silent */ }
}

// ── 7. Event ID generator ────────────────────────────────────────────────
export function generateEventId(userId?: string | number): string {
  const uid = userId ?? USER_CONTEXT.user_id ?? 'anon';
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `BYT-${uid}-${ts}-${rand}`;
}

// ── 8. App side ──────────────────────────────────────────────────────────
function appSide(): 'user' | 'partner' {
  if (typeof window === 'undefined') return 'user';
  return window.location.pathname.startsWith('/partner') ? 'partner' : 'user';
}

// ═══════════════════════════════════════════════════════════════════════
//  9. THE FUNNEL EVENTS
// ═══════════════════════════════════════════════════════════════════════

/**
 * OTP verified — user becomes a guest.
 * Fires a custom event (not the standard CompleteRegistration, which is
 * reserved for profile completion).
 */
export function metaOtpVerified(params: {
  user_id: string | number;
  method?: 'whatsapp' | 'sms' | 'truecaller';
  is_new_user: boolean;
}): string {
  const eventId = generateEventId(params.user_id);

  setUserContext({
    user_id: params.user_id,
    user_type: 'guest',
  });

  // setUserContext already persists, but be explicit:
  persistUserContext();

  fbqCustom('OTPVerified', {
    method: params.method ?? 'sms',
    is_new_user: params.is_new_user,
    event_id: eventId,
  });

  sessionStorage.setItem('byt_reg_event_id', eventId);
  return eventId;
}

/**
 * ViewContent — fires from TurfDetailPage only (single source of truth).
 * nearest_turf_km is passed through navigation state from TurfsPage.
 */
export function metaViewContent(params: {
  turf_id: string | number;
  turf_name: string;
  price?: number;
  city?: string;
  sport?: string;
  nearest_turf_km?: number;
}): string {
  const eventId = generateEventId();

  fbq('ViewContent', {
    content_ids: [String(params.turf_id)],
    content_name: params.turf_name,
    content_type: 'turf',
    currency: 'INR',
    value: params.price ?? 0,
    ...(params.sport ? { sport: params.sport } : {}),
    ...(params.city ? { city: params.city } : {}),
    ...(params.nearest_turf_km != null
      ? { nearest_turf_km: params.nearest_turf_km }
      : {}),
  }, eventId);

  return eventId;
}

/**
 * AddToCart — fires from BookingPage when a slot is selected.
 *
 * ⚠️ The caller must invoke this OUTSIDE any setState updater; otherwise
 * React 18 StrictMode double-invokes the updater and we get two events.
 * See BookingPage.tsx handleSlotSelect for the correct pattern.
 */
export function metaAddToCart(params: {
  turf_id: string | number;
  turf_name?: string;
  value: number;
  slot_datetime?: string;
  sport?: string;
  nearest_turf_km?: number;
}): string {
  const eventId = generateEventId();

  fbq('AddToCart', {
    content_ids: [String(params.turf_id)],
    content_name: params.turf_name ?? '',
    content_type: 'turf_slot',
    currency: 'INR',
    value: params.value,
    slot_datetime: params.slot_datetime ?? '',
    ...(params.sport ? { sport: params.sport } : {}),
    ...(params.nearest_turf_km != null
      ? { nearest_turf_km: params.nearest_turf_km }
      : {}),
  }, eventId);

  return eventId;
}

/**
 * InitiateCheckout — fires from PaymentSummary when user taps Pay.
 *
 * Re-fires a lightweight AddToCart so Meta's algorithm always sees a
 * fresh AddToCart → InitiateCheckout pair on the same page view, even
 * if the user paused at CompleteProfile for a while in between.
 * This silences the CHECKOUT_NO_CART warning.
 */
export function metaInitiateCheckout(params: {
  turf_id: string | number;
  value: number;
  num_slots?: number;
  payment_model?: 'full' | 'token' | 'wallet';
  nearest_turf_km?: number;
}): string {
  // Refresh the cart context for this checkout session
  fbq('AddToCart', {
    content_ids: [String(params.turf_id)],
    content_type: 'turf_slot',
    currency: 'INR',
    value: params.value,
    num_items: params.num_slots ?? 1,
  });

  const eventId = generateEventId();

  fbq('InitiateCheckout', {
    content_ids: [String(params.turf_id)],
    content_type: 'turf_slot',
    currency: 'INR',
    value: params.value,
    num_items: params.num_slots ?? 1,
    payment_model: params.payment_model ?? 'full',
    ...(params.nearest_turf_km != null
      ? { nearest_turf_km: params.nearest_turf_km }
      : {}),
  }, eventId);

  sessionStorage.setItem('byt_checkout_event_id', eventId);
  return eventId;
}

/**
 * Purchase — same event_id as InitiateCheckout so Meta deduplicates
 * against the server-side Conversions API mirror.
 */
export function metaPurchase(params: {
  booking_id: string;
  turf_id: string | number;
  value: number;
  user_id?: string | number;
  nearest_turf_km?: number;
}): string {
  const storedId = sessionStorage.getItem('byt_checkout_event_id');
  const eventId = storedId ?? generateEventId(params.user_id);

  fbq('Purchase', {
    content_ids: [String(params.turf_id)],
    content_type: 'turf_slot',
    content_category: 'user',
    currency: 'INR',
    value: params.value,
    booking_id: params.booking_id,
    ...(params.nearest_turf_km != null
      ? { nearest_turf_km: params.nearest_turf_km }
      : {}),
  }, eventId);

  sessionStorage.removeItem('byt_checkout_event_id');
  sessionStorage.setItem('byt_purchase_event_id', eventId);

  // Bump user_type for the rest of the session
  if (USER_CONTEXT.user_type !== 'repeat_booker') {
    const wasFirst = USER_CONTEXT.user_type === 'first_booker';
    USER_CONTEXT.user_type = wasFirst ? 'repeat_booker' : 'first_booker';

    // Persist the upgrade so it survives page reloads / rehydration
    persistUserContext();
  }

  return eventId;
}

// ═══════════════════════════════════════════════════════════════════════
//  10. PAGE-VIEW + CUSTOM EVENTS
// ═══════════════════════════════════════════════════════════════════════

export function metaPageView(pageName?: string) {
  fbq('PageView', {
    page_name: pageName ?? window.location.pathname,
  });
}

export function metaPageViewPartner(pageName?: string) {
  fbqPartner('PageView', {
    page_name: pageName ?? window.location.pathname,
  });
}

export function metaEmptyState(city?: string, pincode?: string) {
  fbqCustom('EmptyState', { city, pincode });
}

export function metaSlotGridAbandoned(
  turfId: string | number,
  secondsSpent: number
) {
  fbqCustom('SlotGridAbandoned', {
    turf_id: String(turfId),
    seconds_spent: secondsSpent,
  });
}

export function metaPaymentAbandoned(turfId: string | number, value: number) {
  fbqCustom('PaymentAbandoned', {
    turf_id: String(turfId),
    value,
    currency: 'INR',
  });
}

export function metaPartnerNoSlotsPublished(partnerId: string | number) {
  fbqCustom('PartnerNoSlotsPublished', { partner_id: String(partnerId) });
}

export function metaPartnerBookingIgnored(bookingId: string) {
  fbqCustom('PartnerBookingIgnored', { booking_id: bookingId });
}

export function metaCallLeakage(turfId: string | number, stage: string) {
  fbqCustom('CallLeakage', {
    turf_id: String(turfId),
    stage,
  });
}

/**
 * ProfileGateHit — user hits a gated action as a guest and is
 * redirected to CompleteProfile.
 */
export function metaProfileGateHit(
  stage:
    | 'book_slot'
    | 'pay_advance'
    | 'pay_full'
    | 'wallet_recharge'
    | 'wallet_convert'
    | 'open_profile',
  returnTo?: string,
) {
  fbqCustom('ProfileGateHit', {
    stage,
    return_to: returnTo ?? '',
    user_type: USER_CONTEXT.user_type ?? 'guest',
  });
}

/**
 * CompleteRegistration — guest submits the CompleteProfile form.
 * Promotes user_type from 'guest' → 'registered_not_booked'.
 */
export function metaProfileCompleted(params: {
  user_id: string | number;
  gate_stage?: string;
  return_to?: string;
}): string {
  USER_CONTEXT.user_type = 'registered_not_booked';

  // Persist the promotion so it survives page reloads
  persistUserContext();

  const eventId = generateEventId(params.user_id);
  fbq('CompleteRegistration', {
    content_name: 'BYT Profile Complete',
    method: 'profile_form',
    status: true,
    currency: 'INR',
    gate_stage: params.gate_stage ?? '',
    return_to: params.return_to ?? '',
  }, eventId);

  return eventId;
}

export function metaDeeplinkReceived() {
  const received = {
    link_source: USER_CONTEXT.link_source,
    target_screen: USER_CONTEXT.target_screen,
    target_city: USER_CONTEXT.target_city,
    target_turf_id: USER_CONTEXT.target_turf_id,
    install_source: USER_CONTEXT.install_source,
    campaign_id: USER_CONTEXT.campaign_id,
    adset_id: USER_CONTEXT.adset_id,
    ad_id: USER_CONTEXT.ad_id,
    creative_name: USER_CONTEXT.creative_name,
  };

  // Only fire if at least one param is present
  const hasAny = Object.values(received).some(
    (v) => v !== undefined && v !== null && v !== ''
  );
  if (!hasAny) return;

  fbqCustom('deeplink_received', received);

  // Store the moment the deep link was received so we can measure ms_to_land
  sessionStorage.setItem('byt_deeplink_received_at', String(Date.now()));
}

export function metaDeeplinkLanded() {
  const targetScreen = USER_CONTEXT.target_screen;
  if (!targetScreen) return;  // nothing promised, nothing to land on

  const receivedAt = Number(
    sessionStorage.getItem('byt_deeplink_received_at') ?? 0
  );
  if (!receivedAt) return;

  const msToLand = Date.now() - receivedAt;
  const landedScreen = window.location.pathname;

  // Very loose matching — you may need to refine this
  const success =
    targetScreen === landedScreen ||
    landedScreen.startsWith(targetScreen) ||
    landedScreen.includes(targetScreen.replace(/^\//, ''));

  fbqCustom('deeplink_landed', {
    target_screen: targetScreen,
    landed_screen: landedScreen,
    success,
    ms_to_land: msToLand,
  });

  sessionStorage.removeItem('byt_deeplink_received_at');
}

export function metaPermissionPrompt(params: {
  permission: 'location' | 'notification';
  result: 'granted' | 'denied' | 'later';
}) {
  fbqCustom('permission_prompt', params);
}

/**
 * location_set — fires once city/area/pincode are resolved (GPS or picker).
 * Mirrors the mobile spec's `location_set` event.
 */
export function metaLocationSet(params: {
  method: 'gps' | 'picker' | 'default';
  city?: string;
  area?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  nearest_turf_km?: number;
  turfs_within_8km?: number;
}) {
  fbqCustom('location_set', {
    method: params.method,
    city: params.city,
    area: params.area,
    pincode: params.pincode,
    lat: params.lat,
    lng: params.lng,
    nearest_turf_km: params.nearest_turf_km,
    turfs_within_8km: params.turfs_within_8km,
    cluster: USER_CONTEXT.cluster,
  });
}

/**
 * turf_list_viewed — fires after the turf list renders on Home.
 * Mirrors the mobile spec's `turf_list_viewed` event.
 */
export function metaTurfListViewed(params: {
  turfs_shown: number;
  turfs_with_slot_today?: number;
  turfs_with_slot_weekend?: number;
  sort?: 'distance' | 'price' | 'rating';
  filters_active?: boolean;
  empty_state?: boolean;
}) {
  fbqCustom('turf_list_viewed', params);
}

/**
 * filter_applied — fires when the user applies a sport / search filter.
 * Mirrors the mobile spec's `filter_applied` event.
 *
 * Note: Meta's mobile spec maps this to the standard `Search` event.
 * If you want it to show under "Search" in Events Manager, change
 * fbqCustom → fbq('Search', ...) here.
 */
export function metaFilterApplied(params: {
  filter_type: 'sport' | 'search' | 'area' | 'date' | 'time_band' | 'price';
  value: string;
  results_count: number;
}) {
  fbqCustom('filter_applied', params);
}

/**
 * slot_grid_viewed — fires when the slot grid first renders for a date.
 * Mirrors the mobile spec's `slot_grid_viewed` event.
 */
export function metaSlotGridViewed(params: {
  turf_id: string | number;
  date: string;
  free_slots: number;
  booked_slots: number;
  blocked_slots: number;
  days_ahead?: number;
}) {
  fbqCustom('slot_grid_viewed', {
    turf_id: String(params.turf_id),
    date: params.date,
    free_slots: params.free_slots,
    booked_slots: params.booked_slots,
    blocked_slots: params.blocked_slots,
    days_ahead: params.days_ahead ?? 0,
  });
}

/**
 * slot_deselected — fires when a user taps an already-selected slot
 * to un-select it. Mirrors the mobile spec's `slot_deselected` event.
 */
export function metaSlotDeselected(params: {
  turf_id: string | number;
  slot_datetime: string;
  seconds_held?: number;
}) {
  fbqCustom('slot_deselected', {
    turf_id: String(params.turf_id),
    slot_datetime: params.slot_datetime,
    seconds_held: params.seconds_held ?? 0,
  });
}

/**
 * login_started — fires when the PhoneAuth screen mounts.
 * Mirrors the mobile spec's `login_started` event.
 */
export function metaLoginStarted(params: {
  trigger?: 'book' | 'profile' | 'rebook' | 'direct';
  turf_id?: string | number;
}) {
  fbqCustom('login_started', {
    trigger: params.trigger ?? 'direct',
    ...(params.turf_id ? { turf_id: String(params.turf_id) } : {}),
  });
}

/**
 * otp_sent — fires after the OTP is successfully dispatched via SMS.
 * Mirrors the mobile spec's `otp_sent` event.
 */
export function metaOtpSent(params: {
  method?: 'whatsapp' | 'sms' | 'truecaller';
  attempt_no?: number;
}) {
  fbqCustom('otp_sent', {
    method: params.method ?? 'sms',
    attempt_no: params.attempt_no ?? 1,
  });
}

/**
 * otp_failed — fires when OTP verification fails.
 * Mirrors the mobile spec's `otp_failed` event.
 *
 * reason values:
 *   'wrong'        — OTP entered but incorrect
 *   'expired'      — OTP was valid but too old
 *   'delivery_fail' — OTP was never delivered
 */
export function metaOtpFailed(params: {
  reason: 'wrong' | 'expired' | 'delivery_fail';
  attempt_no?: number;
}) {
  fbqCustom('otp_failed', {
    reason: params.reason,
    attempt_no: params.attempt_no ?? 1,
  });
}

/**
 * payment_started — fires the moment the user taps the final
 * "Confirm Payment" button. Uses Meta's standard AddPaymentInfo event.
 * Mirrors the mobile spec's `payment_started` event.
 */
export function metaPaymentStarted(params: {
  method: 'wallet' | 'razorpay' | 'upi' | 'card';
  gateway?: string;
  order_id?: string;
}) {
  fbq('AddPaymentInfo', {
    payment_method: params.method,
    gateway: params.gateway ?? params.method,
    ...(params.order_id ? { order_id: params.order_id } : {}),
  });
}

/**
 * confirmation_viewed — fires on the BookingSuccess screen mount.
 * Mirrors the mobile spec's `confirmation_viewed` event.
 */
export function metaConfirmationViewed(params: {
  booking_id: string;
  amount?: number;
  payment_method?: string;
}) {
  fbqCustom('confirmation_viewed', {
    booking_id: params.booking_id,
    ...(params.amount != null ? { amount: params.amount } : {}),
    ...(params.payment_method
      ? { payment_method: params.payment_method }
      : {}),
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  PARTNER / OWNER SIDE — BYT Partner app tracking
//  Mirrors the mobile spec(Owner side).
// ═══════════════════════════════════════════════════════════════════════

/**
 * Partner tier — the partner-side equivalent of `user_type`.
 * Never-downgrade is enforced in `setPartnerContext()`.
 */
export type PartnerType =
  | 'owner_new'       // signed up, no venues published yet
  | 'owner_active'    // 1+ venues published, low booking volume
  | 'owner_power'     // high-volume partner
  | 'owner_dormant';  // no activity in 30+ days

export interface MetaPartnerContext {
  partner_id?: string | number;
  business_name?: string;
  city?: string;
  area?: string;
  pincode?: string;
  cluster?: string;
  partner_type?: PartnerType;
  venues_count?: number;

  // Same attribution fields as the user side
  install_source?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  creative_name?: string;
}

let PARTNER_CONTEXT: MetaPartnerContext = {};
let lastInitPartnerId: string | number | null = null;

function persistPartnerContext() {
  try {
    sessionStorage.setItem(
      'byt_partner_ctx',
      JSON.stringify(PARTNER_CONTEXT),
    );
  } catch { /* silent */ }
}

function rehydratePartnerContext(): MetaPartnerContext {
  try {
    const raw = sessionStorage.getItem('byt_partner_ctx');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * setPartnerContext — mirror of setUserContext for the partner app.
 * Includes a never-downgrade guard on `partner_type`.
 */
export function setPartnerContext(ctx: MetaPartnerContext) {
  const rehydrated = rehydratePartnerContext();
  const fromUrl = readAttributionFromUrl();
  const fromStorage = readAttributionFromStorage();
  const attribution = { ...fromStorage, ...fromUrl };

  const cluster = ctx.cluster ?? deriveCluster(ctx.city);

  const PARTNER_TYPE_RANK: Record<PartnerType, number> = {
    owner_new: 0,
    owner_active: 1,
    owner_power: 2,
    owner_dormant: 3, // dormant sits highest so we never regress from it
  };

  const currentRank = PARTNER_CONTEXT.partner_type
    ? PARTNER_TYPE_RANK[PARTNER_CONTEXT.partner_type]
    : -1;
  const incomingRank = ctx.partner_type
    ? PARTNER_TYPE_RANK[ctx.partner_type]
    : -1;
  const rehydratedRank = rehydrated.partner_type
    ? PARTNER_TYPE_RANK[rehydrated.partner_type]
    : -1;

  // Special rule: dormant is a terminal state only entered by an
  // explicit write. Everywhere else we take the highest non-dormant
  // value so activity always wins over "dormant" until the backend
  // explicitly sets dormant.
  const nonDormantRanks = [
    currentRank,
    incomingRank,
    rehydratedRank,
  ].filter((r) => r >= 0 && r !== PARTNER_TYPE_RANK.owner_dormant);

  const highestRank =
    nonDormantRanks.length > 0 ? Math.max(...nonDormantRanks) : currentRank;

  const winningPartnerType: PartnerType | undefined =
    highestRank >= 0
      ? (Object.keys(PARTNER_TYPE_RANK) as PartnerType[]).find(
          (k) => PARTNER_TYPE_RANK[k] === highestRank,
        )
      : undefined;

  PARTNER_CONTEXT = {
    ...rehydrated,
    ...PARTNER_CONTEXT,
    ...attribution,
    ...ctx,
    ...(cluster ? { cluster } : {}),
    ...(winningPartnerType ? { partner_type: winningPartnerType } : {}),
  };

  persistAttribution(attribution);
  persistPartnerContext();

  if (ctx.partner_id && lastInitPartnerId !== ctx.partner_id) {
    lastInitPartnerId = ctx.partner_id;
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('init', PIXEL_ID, {
          external_id: `partner_${ctx.partner_id}`,
        });
      }
    } catch { /* silent */ }
  }
}

export function getMetaPartnerContext(): MetaPartnerContext {
  return { ...PARTNER_CONTEXT };
}

/**
 * Partner-side fbq — merges PARTNER_CONTEXT into the payload instead
 * of USER_CONTEXT. Same safety semantics.
 */
function fbqPartner(
  event: string,
  params: Record<string, unknown> = {},
  eventId?: string,
) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;

    const ctx: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(PARTNER_CONTEXT)) {
      if (v !== undefined && v !== null && v !== '') ctx[k] = v;
    }

    const fullParams = {
      ...ctx,
      content_category: 'partner',
      ...params,
    };

    if (eventId) {
      window.fbq('track', event, fullParams, { eventID: eventId });
    } else {
      window.fbq('track', event, fullParams);
    }
  } catch { /* silent */ }
}

function fbqPartnerCustom(
  event: string,
  params: Record<string, unknown> = {},
) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;

    const ctx: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(PARTNER_CONTEXT)) {
      if (v !== undefined && v !== null && v !== '') ctx[k] = v;
    }

    window.fbq('trackCustom', event, {
      ...ctx,
      content_category: 'partner',
      ...params,
    });
  } catch { /* silent */ }
}

/**
 * owner_app_open — fires when the PartnerLayout shell mounts.
 * Mirrors the mobile spec's `owner_app_open` event.
 */
export function metaOwnerAppOpen(params?: {
  days_since_last_open?: number;
}) {
  // Compute days since last open using localStorage
  let daysSince = params?.days_since_last_open;
  try {
    const lastOpen = localStorage.getItem('byt_partner_last_open_at');
    if (lastOpen && daysSince == null) {
      daysSince = Math.round(
        (Date.now() - Number(lastOpen)) / 86_400_000,
      );
    }
    localStorage.setItem('byt_partner_last_open_at', String(Date.now()));
  } catch { /* silent */ }

  fbqPartnerCustom('owner_app_open', {
    ...(daysSince != null ? { days_since_last_open: daysSince } : {}),
  });
}

/**
 * calendar_viewed — fires when the Slot Management page mounts.
 */
export function metaCalendarViewed(params: {
  turf_id?: string | number;
  court_number?: number;
  date?: string;
  date_range?: string;
}) {
  fbqPartnerCustom('calendar_viewed', {
    ...(params.turf_id != null ? { turf_id: String(params.turf_id) } : {}),
    ...(params.court_number != null
      ? { court_number: params.court_number }
      : {}),
    ...(params.date ? { date: params.date } : {}),
    ...(params.date_range ? { date_range: params.date_range } : {}),
  });
}

/**
 * slot_blocked — fires after a partner successfully blocks slots.
 */
export function metaSlotBlocked(params: {
  turf_id: string | number;
  court_number?: number;
  slot_datetime: string;
  method?: 'app' | 'whatsapp_command' | 'support';
  reason?: string;
  repeat_type?: string;
  repeat_count?: number;
  slots_count?: number;
}) {
  fbqPartnerCustom('slot_blocked', {
    turf_id: String(params.turf_id),
    ...(params.court_number != null
      ? { court_number: params.court_number }
      : {}),
    slot_datetime: params.slot_datetime,
    method: params.method ?? 'app',
    ...(params.reason ? { reason: params.reason } : {}),
    ...(params.repeat_type ? { repeat_type: params.repeat_type } : {}),
    ...(params.repeat_count != null
      ? { repeat_count: params.repeat_count }
      : {}),
    ...(params.slots_count != null
      ? { slots_count: params.slots_count }
      : {}),
  });
}

/**
 * slot_unblocked — fires after a partner removes a block.
 */
export function metaSlotUnblocked(params: {
  turf_id: string | number;
  court_number?: number;
  slot_datetime: string;
  block_ids?: number[];
}) {
  fbqPartnerCustom('slot_unblocked', {
    turf_id: String(params.turf_id),
    ...(params.court_number != null
      ? { court_number: params.court_number }
      : {}),
    slot_datetime: params.slot_datetime,
    ...(params.block_ids?.length
      ? { block_count: params.block_ids.length }
      : {}),
  });
}

/**
 * slots_published — fires when a partner creates a new venue
 * (which publishes its initial slot availability).
 */
export function metaSlotsPublished(params: {
  turf_id?: string | number;
  turf_name?: string;
  sport?: string;
  courts_count?: number;
  city?: string;
  days_ahead?: number;
  slots_count?: number;
}) {
  fbqPartnerCustom('slots_published', {
    ...(params.turf_id != null ? { turf_id: String(params.turf_id) } : {}),
    ...(params.turf_name ? { turf_name: params.turf_name } : {}),
    ...(params.sport ? { sport: params.sport } : {}),
    ...(params.courts_count != null
      ? { courts_count: params.courts_count }
      : {}),
    ...(params.city ? { city: params.city } : {}),
    ...(params.days_ahead != null ? { days_ahead: params.days_ahead } : {}),
    ...(params.slots_count != null
      ? { slots_count: params.slots_count }
      : {}),
  });
}

/**
 * price_updated — fires when a partner changes slot prices on an
 * existing venue.
 */
export function metaPriceUpdated(params: {
  turf_id: string | number;
  court_number?: number;
  slot_type?: 'day' | 'night' | 'peak' | 'off_peak';
  old_price?: number;
  new_price?: number;
}) {
  fbqPartnerCustom('price_updated', {
    turf_id: String(params.turf_id),
    ...(params.court_number != null
      ? { court_number: params.court_number }
      : {}),
    ...(params.slot_type ? { slot_type: params.slot_type } : {}),
    ...(params.old_price != null ? { old_price: params.old_price } : {}),
    ...(params.new_price != null ? { new_price: params.new_price } : {}),
  });
}

/**
 * booking_acknowledged — fires when a partner views/opens a booking.
 */
export function metaBookingAcknowledged(params: {
  booking_id: string;
  turf_id?: string | number;
  seconds_after_confirm?: number;
}) {
  fbqPartnerCustom('booking_acknowledged', {
    booking_id: params.booking_id,
    ...(params.turf_id != null ? { turf_id: String(params.turf_id) } : {}),
    ...(params.seconds_after_confirm != null
      ? { seconds_after_confirm: params.seconds_after_confirm }
      : {}),
  });
}

/**
 * settlement_viewed — fires when a partner opens the settlement /
 * statement view (currently Booking Summary on web).
 */
export function metaSettlementViewed(params?: {
  period?: string;
  booking_id?: string;
}) {
  fbqPartnerCustom('settlement_viewed', {
    ...(params?.period ? { period: params.period } : {}),
    ...(params?.booking_id ? { booking_id: params.booking_id } : {}),
  });
}

/**
 * owner_support_contacted — fires when a partner taps call/email
 * in the Customer Care screen.
 */
export function metaOwnerSupportContacted(params: {
  channel: 'call' | 'email' | 'whatsapp' | 'chat';
  topic?: string;
}) {
  fbqPartnerCustom('owner_support_contacted', {
    channel: params.channel,
    ...(params.topic ? { topic: params.topic } : {}),
  });
}

/**
 * Partner login started (email/password flow).
 */
export function metaPartnerLoginStarted(params?: {
  method?: 'email' | 'phone';
}) {
  fbqPartnerCustom('login_started', {
    method: params?.method ?? 'email',
    trigger: 'partner',
  });
}

/**
 * Partner login success (email/password flow). Fires on success.
 */
export function metaPartnerLoginSuccess(params: {
  partner_id: string | number;
  business_name?: string;
}) {
  const eventId = generateEventId(`partner_${params.partner_id}`);

  setPartnerContext({
    partner_id: params.partner_id,
    business_name: params.business_name,
  });

  fbqPartnerCustom('login_success', {
    method: 'email',
    event_id: eventId,
  });

  return eventId;
}

/**
 * Partner OTP verified (phone flow). Mirrors the mobile spec's
 * `otp_verified` → Meta's standard CompleteRegistration.
 */
export function metaPartnerOtpVerified(params: {
  partner_id: string | number;
  business_name?: string;
  is_new_partner: boolean;
}) {
  const eventId = generateEventId(`partner_${params.partner_id}`);

  setPartnerContext({
    partner_id: params.partner_id,
    business_name: params.business_name,
    partner_type: params.is_new_partner ? 'owner_new' : 'owner_active',
  });

  fbqPartnerCustom('otp_verified', {
    method: 'sms',
    is_new_partner: params.is_new_partner,
    event_id: eventId,
  });

  // Meta standard event for new partner registration
  if (params.is_new_partner) {
    fbqPartner(
      'CompleteRegistration',
      {
        content_name: 'BYT Partner Registration',
        method: 'sms',
        status: true,
        currency: 'INR',
      },
      eventId,
    );
  }

  return eventId;
}

/**
 * Partner OTP sent.
 */
export function metaPartnerOtpSent(params?: {
  method?: 'whatsapp' | 'sms' | 'truecaller';
  attempt_no?: number;
}) {
  fbqPartnerCustom('otp_sent', {
    method: params?.method ?? 'sms',
    attempt_no: params?.attempt_no ?? 1,
    partner: true,
  });
}

/**
 * Partner OTP failed.
 */
export function metaPartnerOtpFailed(params: {
  reason: 'wrong' | 'expired' | 'delivery_fail';
  attempt_no?: number;
}) {
  fbqPartnerCustom('otp_failed', {
    reason: params.reason,
    attempt_no: params.attempt_no ?? 1,
    partner: true,
  });
}

/**
 * Partner dashboard viewed.
 */
export function metaPartnerDashboardViewed(params?: {
  partner_type?: PartnerType;
  venues_count?: number;
}) {
  fbqPartnerCustom('owner_dashboard_viewed', {
    ...(params?.partner_type ? { partner_type: params.partner_type } : {}),
    ...(params?.venues_count != null
      ? { venues_count: params.venues_count }
      : {}),
  });
}

/**
 * Offline booking confirmed by a partner (walk-in).
 * Fires alongside the existing `confirmation_viewed` on success modal.
 */
export function metaPartnerOfflineBookingConfirmed(params: {
  booking_id: string;
  turf_id: string | number;
  court_number?: number;
  customer_name?: string;
  total_amount: string;
  paid_amount: string;
  balance_amount?: string;
  payment_method?: 'cash' | 'upi' | 'card' | 'other';
  slots_count?: number;
}) {
  fbqPartnerCustom('booking_confirmed', {
    booking_id: params.booking_id,
    turf_id: String(params.turf_id),
    booking_type: 'offline',
    ...(params.court_number != null
      ? { court_number: params.court_number }
      : {}),
    ...(params.customer_name
      ? { customer_name: params.customer_name }
      : {}),
    total_amount: params.total_amount,
    paid_amount: params.paid_amount,
    ...(params.balance_amount
      ? { balance_amount: params.balance_amount }
      : {}),
    ...(params.payment_method
      ? { payment_method: params.payment_method }
      : {}),
    ...(params.slots_count != null
      ? { slots_count: params.slots_count }
      : {}),
  });
}

// ─── Placeholder helpers for future features ────────────────────────────
// These are ready to wire when the corresponding UI ships. Do not call
// them until there's an actual user action triggering them.

export function metaBookingMarkedNoShow(params: {
  booking_id: string;
  turf_id?: string | number;
}) {
  fbqPartnerCustom('booking_marked_no_show', {
    booking_id: params.booking_id,
    ...(params.turf_id != null ? { turf_id: String(params.turf_id) } : {}),
  });
}

export function metaBookingMarkedCompleted(params: {
  booking_id: string;
  turf_id?: string | number;
}) {
  fbqPartnerCustom('booking_marked_completed', {
    booking_id: params.booking_id,
    ...(params.turf_id != null ? { turf_id: String(params.turf_id) } : {}),
  });
}

export function metaDoubleBookingReported(params: {
  booking_id: string;
  reported_by: 'owner' | 'player';
  resolution?: string;
}) {
  fbqPartnerCustom('double_booking_reported', {
    booking_id: params.booking_id,
    reported_by: params.reported_by,
    ...(params.resolution ? { resolution: params.resolution } : {}),
  });
}

export function metaDealCreated(params: {
  turf_id: string | number;
  deal_id?: string | number;
  discount_type?: 'percentage' | 'flat';
  discount_value?: number;
  time_band?: string;
  days?: string[];
}) {
  fbqPartnerCustom('deal_created', {
    turf_id: String(params.turf_id),
    ...(params.deal_id != null ? { deal_id: String(params.deal_id) } : {}),
    ...(params.discount_type
      ? { discount_type: params.discount_type }
      : {}),
    ...(params.discount_value != null
      ? { discount_value: params.discount_value }
      : {}),
    ...(params.time_band ? { time_band: params.time_band } : {}),
    ...(params.days?.length ? { days: params.days.join(',') } : {}),
  });
}

export function metaDealEnded(params: {
  turf_id: string | number;
  deal_id?: string | number;
}) {
  fbqPartnerCustom('deal_ended', {
    turf_id: String(params.turf_id),
    ...(params.deal_id != null ? { deal_id: String(params.deal_id) } : {}),
  });
}