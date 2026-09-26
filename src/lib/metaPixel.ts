/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  src/lib/metaPixel.ts
 *  Meta Pixel helper — BookYourTurf
 *  Pixel ID: 2629647084171904
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  The Meta Pixel script is already loaded in index.html (it put `fbq`
 *  on the window object).  This file:
 *    1. Declares the TypeScript type for `fbq` so there are no TS errors
 *    2. Exports one typed function per funnel event so every page just calls
 *       e.g.  metaViewContent({ turf_id: '7', turf_name: 'FF Turf' })
 *    3. Adds `content_category: 'user' | 'partner'` on every event so the
 *       Meta team can filter their dashboard by app side
 *    4. Generates a unique event_id for the five key events — this same ID
 *       must be sent to the Meta Conversions API from your AWS server so Meta
 *       doesn't count the same booking twice
 *
 *  ─── HOW TO USE IN A PAGE COMPONENT ────────────────────────────────────────
 *
 *  import { metaViewContent, metaAddToCart } from '../../lib/metaPixel';
 *
 *  // When turf detail page loads:
 *  metaViewContent({ turf_id: turf.id, turf_name: turf.name, price: turf.price_per_hour });
 *
 *  // When user selects a slot:
 *  metaAddToCart({ turf_id: turf.id, value: slot.price });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── 1. TypeScript declaration for fbq (loaded via index.html script tag) ─────
declare global {
  interface Window {
    fbq: (
      action: 'init' | 'track' | 'trackCustom' | 'trackSingle',
      eventNameOrPixelId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = '2629647084171904';

// ── 2. Safe caller — silently skips if Pixel hasn't loaded (e.g. ad-blockers)
function fbq(
  event: string,
  params: Record<string, unknown> = {},
  eventId?: string,
) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;
    if (eventId) {
      window.fbq(
        'track',
        event,
        params,
        { eventID: eventId }
      );
    } else {
      window.fbq(
        'track',
        event,
        params
      );
    }
  } catch {
    // Never crash the app because of an analytics call
  }
}

function fbqCustom(event: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('trackCustom', event, params);
  } catch { /* silent */ }
}

// ── 3. Unique event ID generator (shared with server via booking_id) ─────────
//  Format: BYT-{userId}-{timestamp}-{random4}
//  Pass this same string to your AWS server so it goes into the
//  Meta Conversions API payload, enabling deduplication.
export function generateEventId(userId?: string | number): string {
  const uid   = userId ?? 'anon';
  const ts    = Date.now();
  const rand  = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `BYT-${uid}-${ts}-${rand}`;
}

// ── 4. Determine current app side from URL ────────────────────────────────────
function appSide(): 'user' | 'partner' {
  return window.location.pathname.startsWith('/partner') ? 'partner' : 'user';
}

// ═════════════════════════════════════════════════════════════════════════════
//  5. THE FIVE KEY META FUNNEL EVENTS
//  These are the ones Meta uses to optimise your ad campaigns.
//  Each one fires a standard Meta event AND must be mirrored server-side.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * EVENT 1 — CompleteRegistration
 * Fire when: OTP verified successfully for a NEW user (first time sign up)
 * Page: VerifyOtp.tsx
 */
export function metaCompleteRegistration(params: {
  user_id: string | number;
  method?: 'whatsapp' | 'sms' | 'truecaller';
  new_user: boolean;
}): string {
  if (!params.new_user) return ''; // only for new registrations
  const eventId = generateEventId(params.user_id);
  fbq('CompleteRegistration', {
    content_name:     'BYT User Registration',
    content_category: appSide(),
    currency:         'INR',
    status:           true,
  }, eventId);
  // Store so server can pick it up
  sessionStorage.setItem('byt_reg_event_id', eventId);
  return eventId;
}

/**
 * EVENT 2 — ViewContent
 * Fire when: Turf detail page fully loads (user can see the turf)
 * Page: TurfDetailPage.tsx
 */
export function metaViewContent(params: {
  turf_id: string | number;
  turf_name: string;
  price?: number;
  city?: string;
  sport?: string;
}): string {
  const eventId = generateEventId();
  fbq('ViewContent', {
    content_ids:      [String(params.turf_id)],
    content_name:     params.turf_name,
    content_type:     'turf',
    content_category: appSide(),
    currency:         'INR',
    value:            params.price ?? 0,
    city:             params.city ?? '',
    sport:            params.sport ?? '',
  }, eventId);
  return eventId;
}

/**
 * EVENT 3 — AddToCart
 * Fire when: User taps a time slot on the slot grid (adds it to selection)
 * Page: BookingPage.tsx  OR  TurfDetailPage.tsx (wherever slot grid lives)
 */
export function metaAddToCart(params: {
  turf_id: string | number;
  turf_name?: string;
  value: number;
  slot_datetime?: string;
  sport?: string;
}): string {
  const eventId = generateEventId();
  fbq('AddToCart', {
    content_ids:      [String(params.turf_id)],
    content_name:     params.turf_name ?? '',
    content_type:     'turf_slot',
    content_category: appSide(),
    currency:         'INR',
    value:            params.value,
    slot_datetime:    params.slot_datetime ?? '',
  }, eventId);
  return eventId;
}

/**
 * EVENT 4 — InitiateCheckout
 * Fire when: User taps "Proceed to Pay" — payment screen is shown
 * Page: BookingPage.tsx  (just before navigating to RazorpayPayment)
 */
export function metaInitiateCheckout(params: {
  turf_id: string | number;
  value: number;
  num_slots?: number;
  payment_model?: 'full' | 'token' | 'wallet';
}): string {
  const eventId = generateEventId();
  fbq('InitiateCheckout', {
    content_ids:      [String(params.turf_id)],
    content_type:     'turf_slot',
    content_category: appSide(),
    currency:         'INR',
    value:            params.value,
    num_items:        params.num_slots ?? 1,
    payment_model:    params.payment_model ?? 'full',
  }, eventId);
  // Store so RazorpayPayment.tsx can forward event_id to the server
  sessionStorage.setItem('byt_checkout_event_id', eventId);
  return eventId;
}

/**
 * EVENT 5 — Purchase
 * ⚠️  THIS MUST ALSO FIRE FROM YOUR AWS SERVER via Conversions API.
 * The client fires it here for speed; the server fires it with the same
 * event_id for reliability and deduplication.
 * Page: BookingSuccess.tsx
 */
export function metaPurchase(params: {
  booking_id: string;
  turf_id: string | number;
  value: number;
  user_id?: string | number;
}): string {
  // Re-use the checkout event_id stored earlier so server can match it
  const storedId  = sessionStorage.getItem('byt_checkout_event_id');
  const eventId   = storedId ?? generateEventId(params.user_id);
  fbq('Purchase', {
    content_ids:      [String(params.turf_id)],
    content_type:     'turf_slot',
    content_category: 'user',       // Purchase is always user side
    currency:         'INR',
    value:            params.value,
    booking_id:       params.booking_id,
  }, eventId);
  // Clean up
  sessionStorage.removeItem('byt_checkout_event_id');
  // Store final event_id so AWS Lambda can read it from the booking record
  sessionStorage.setItem('byt_purchase_event_id', eventId);
  return eventId;
}

// ═════════════════════════════════════════════════════════════════════════════
//  6. PAGE-VIEW EVENT — fires automatically from index.html but you can also
//     call this manually after route changes for better SPA tracking
// ═════════════════════════════════════════════════════════════════════════════

export function metaPageView(pageName?: string) {
  fbq('PageView', {
    page_name: pageName ?? window.location.pathname,
    content_category: appSide(),
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  7. CUSTOM FUNNEL EVENTS — page difficulty / drop-off tracking
//  These are the events the Meta team specifically asked for:
//  "which page users find difficulty and not moving further"
// ═════════════════════════════════════════════════════════════════════════════

/** User landed on the turf list but saw no results (supply gap) */
export function metaEmptyState(city?: string, pincode?: string) {
  fbqCustom('EmptyState', { city, pincode, content_category: appSide() });
}

/** User spent time on slot grid but did NOT select any slot */
export function metaSlotGridAbandoned(turfId: string | number, secondsSpent: number) {
  fbqCustom('SlotGridAbandoned', {
    turf_id:          String(turfId),
    seconds_spent:    secondsSpent,
    content_category: 'user',
  });
}

/** User reached payment screen but closed / went back without paying */
export function metaPaymentAbandoned(turfId: string | number, value: number) {
  fbqCustom('PaymentAbandoned', {
    turf_id:          String(turfId),
    value,
    currency:         'INR',
    content_category: 'user',
  });
}

/** Partner opened the app but never published any slots */
export function metaPartnerNoSlotsPublished(partnerId: string | number) {
  fbqCustom('PartnerNoSlotsPublished', {
    partner_id:       String(partnerId),
    content_category: 'partner',
  });
}

/** Partner viewed dashboard but never acknowledged a booking */
export function metaPartnerBookingIgnored(bookingId: string) {
  fbqCustom('PartnerBookingIgnored', {
    booking_id:       bookingId,
    content_category: 'partner',
  });
}

/** User tapped the venue phone number instead of booking online (leakage) */
export function metaCallLeakage(turfId: string | number, stage: string) {
  fbqCustom('CallLeakage', {
    turf_id:          String(turfId),
    stage,
    content_category: 'user',
  });
}