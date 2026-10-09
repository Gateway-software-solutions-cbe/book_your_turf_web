// src/pages/admin/BookingsPage.tsx



import React, {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";



import { useNavigate } from "react-router-dom";



import { listBookings } from "../../api/admin/bookings";



import type {

  Booking,

  BookingType,

  PaymentStatus,

  ListBookingsParams,

} from "../../types/admin/booking";



import {

  exportData,

  sanitizeForExport,

  formatDateForExport,

  formatCurrencyForExport,

} from "../../utils/exportUtils";



import {
  getEffectiveBookingTotal,
  getTotalCollectedAmount,

} from "../../utils/bookingPayment";



import "./tbm-theme.css";



type DisplayBookingStatus = "Fully Paid" | "Advance Paid" | "Cancelled";



// ─── Constants ──────────────────────────────────────────────────────────────



const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];



const TODAY = new Date().toISOString().split("T")[0];



const getToday = (): string => {

  const date = new Date();



  const year = date.getFullYear();



  const month = String(date.getMonth() + 1).padStart(2, "0");



  const day = String(date.getDate()).padStart(2, "0");



  return `${year}-${month}-${day}`;

};



const REFRESH_SECONDS = 3600; // 60 minutes



const THEME_KEY = "tbm-theme";



const formatCurrency = (val: string | number) => {

  const n = typeof val === "string" ? parseFloat(val || "0") : val;



  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

};



const formatSlotDate = (iso: string) =>

  new Date(iso).toLocaleDateString("en-US", {

    month: "short",

    day: "2-digit",

    year: "numeric",

  });



const formatBookedOn = (iso: string) => {

  if (!iso) return "—";



  return new Date(iso).toLocaleString("en-IN", {

    day: "2-digit",



    month: "short",



    year: "numeric",



    hour: "2-digit",



    minute: "2-digit",

  });

};

const sortBookingsAscending = (

  items: Booking[],

): Booking[] => {

  return [...items].sort((a, b) => {

    const aCreated = new Date(a.created_at).getTime();

    const bCreated = new Date(b.created_at).getTime();



    const validA = Number.isFinite(aCreated) ? aCreated : 0;

    const validB = Number.isFinite(bCreated) ? bCreated : 0;



    if (validA !== validB) {

      return validA - validB;

    }



    return a.id - b.id;

  });

};



const sortBookingsRecentFirst = (

  items: Booking[],

): Booking[] => {

  return [...items].sort((a, b) => {

    const aCreated = new Date(a.created_at).getTime();

    const bCreated = new Date(b.created_at).getTime();



    const validA = Number.isFinite(aCreated) ? aCreated : 0;

    const validB = Number.isFinite(bCreated) ? bCreated : 0;



    if (validA !== validB) {

      return validB - validA;

    }



    // Fallback when created_at is missing or identical.

    return b.id - a.id;

  });

};





type TabType = "today" | "all";



type ToastType = "success" | "error" | "info";



interface Toast {

  id: number;

  message: string;

  type: ToastType;

}



// Keep the current bookings list/filter state while opening a booking detail page.

// Filters are cleared only when the user clicks "Reset Filters".

const BOOKINGS_VIEW_STATE_KEY = "tbm-bookings-view-state";



interface BookingsViewState {

  activeTab: TabType;

  page: number;

  pageSize: number;

  search: string;

  debSearch: string;

  dateFrom: string;

  dateTo: string;

  bookingType: BookingType | "";

  paymentStatus: PaymentStatus | "";

  isCancelled: "" | "true" | "false";

}



const getSavedBookingsViewState = (): Partial<BookingsViewState> => {

  try {

    const raw = sessionStorage.getItem(BOOKINGS_VIEW_STATE_KEY);

    if (!raw) return {};



    const parsed = JSON.parse(raw) as Partial<BookingsViewState>;

    return parsed && typeof parsed === "object" ? parsed : {};

  } catch {

    return {};

  }

};



const saveBookingsViewState = (state: BookingsViewState) => {

  try {

    sessionStorage.setItem(BOOKINGS_VIEW_STATE_KEY, JSON.stringify(state));

  } catch {

    // Ignore storage failures; the page continues to work normally.

  }

};



// ─── Badges ─────────────────────────────────────────────────────────────────



const TypeBadge: React.FC<{ type: BookingType }> = ({ type }) => {

  const cls =

    type === "Online"

      ? "tbm-badge-online"

      : type === "Walk-in"

        ? "tbm-badge-walkin"

        : "tbm-badge-offline";



  return <span className={`tbm-badge ${cls}`}>{type}</span>;

};



const PaymentBadge: React.FC<{

  status: DisplayBookingStatus;

}> = ({ status }) => {

  const cls =

    status === "Fully Paid"

      ? "tbm-badge-paid"

      : status === "Cancelled"

        ? "tbm-badge-cancelled"

        : "tbm-badge-partial";



  return <span className={`tbm-badge ${cls}`}>{status}</span>;

};



const normalizePaymentValue = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const isAppPayment = (payment: Booking["payments"][number]): boolean => {
  const method = normalizePaymentValue(payment.method);
  const type = normalizePaymentValue(payment.type);

  return (
    method.includes("razorpay") ||
    method.includes("wallet") ||
    type === "online" ||
    type === "wallet"
  );
};

const isCashPayment = (payment: Booking["payments"][number]): boolean => {
  const method = normalizePaymentValue(payment.method);
  const type = normalizePaymentValue(payment.type);

  return (
    method.includes("cash") ||
    method.includes("venue") ||
    type === "cash"
  );
};

const getAppCollectedAmount = (booking: Booking): number => {
  return (booking.payments ?? [])
    .filter(isAppPayment)
    .reduce(
      (sum, payment) =>
        sum + (Number.parseFloat(String(payment.amount ?? 0)) || 0),
      0,
    );
};

const getBookingDisplayStatus = (
  booking: Booking,
): DisplayBookingStatus => {
  if (booking.is_cancelled) {
    return "Cancelled";
  }

  const total = getEffectiveBookingTotal(booking);
  const collected = getTotalCollectedAmount(booking);
  const payments = booking.payments ?? [];

  const hasAppPayment = payments.some(isAppPayment);
  const hasCashPayment = payments.some(isCashPayment);

  // Fully settled exclusively through Razorpay / Wallet.
  if (
    total > 0 &&
    collected >= total - 0.01 &&
    hasAppPayment &&
    !hasCashPayment
  ) {
    return "Fully Paid";
  }

  // Includes mixed app + cash collections and app advances
  // that have not yet settled the entire booking.
  return "Advance Paid";
};

const getPaymentBreakdown = (booking: Booking) => {
  const payments = booking.payments ?? [];

  const amountOf = (payment: Booking["payments"][number]) =>
    Number.parseFloat(String(payment.amount ?? 0)) || 0;

  const isAppPayment = (payment: Booking["payments"][number]) => {
    const method = String(payment.method ?? "").toLowerCase();
    const type = String(payment.type ?? "").toLowerCase();

    return (
      method.includes("razorpay") ||
      method.includes("wallet") ||
      type === "online" ||
      type === "wallet"
    );
  };

  const isCashPayment = (payment: Booking["payments"][number]) => {
    const method = String(payment.method ?? "").toLowerCase();
    const type = String(payment.type ?? "").toLowerCase();

    return (
      method.includes("cash") ||
      method.includes("venue") ||
      type === "cash"
    );
  };

  const appPaid = payments
    .filter(isAppPayment)
    .reduce((sum, payment) => sum + amountOf(payment), 0);

  const cashPaid = payments
    .filter(isCashPayment)
    .reduce((sum, payment) => sum + amountOf(payment), 0);

  const total = getEffectiveBookingTotal(booking);

  // Do not erase the payment history for cancelled bookings.
  const outstanding = Math.max(0, total - appPaid - cashPaid);

  return {
    total,
    appPaid,
    cashPaid,
    outstanding,
  };
};



// ─── Pagination ─────────────────────────────────────────────────────────────



const Pagination: React.FC<{

  page: number;

  totalPages: number;

  onChange: (p: number) => void;

}> = ({ page, totalPages, onChange }) => {

  const pages: (number | "…")[] = [];



  const maxVisible = 5;



  let start = Math.max(1, page - Math.floor(maxVisible / 2));



  let end = Math.min(totalPages, start + maxVisible - 1);



  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);



  if (start > 1) {

    pages.push(1);



    if (start > 2) pages.push("…");

  }



  for (let i = start; i <= end; i++) pages.push(i);



  if (end < totalPages) {

    if (end < totalPages - 1) pages.push("…");



    pages.push(totalPages);

  }



  return (

    <div className="tbm-pagination-controls">

      <button

        className="tbm-page-btn nav-btn"

        disabled={page <= 1}

        onClick={() => onChange(page - 1)}

      >

        ◀ Prev

      </button>



      {pages.map((p, i) =>

        p === "…" ? (

          <span key={`dots-${i}`} className="tbm-page-btn dots">

            …

          </span>

        ) : (

          <button

            key={p}

            className={`tbm-page-btn ${p === page ? "active" : ""}`}

            onClick={() => onChange(p)}

          >

            {p}

          </button>

        ),

      )}



      <button

        className="tbm-page-btn nav-btn"

        disabled={page >= totalPages || totalPages === 0}

        onClick={() => onChange(page + 1)}

      >

        Next ▶

      </button>

    </div>

  );

};



// ─── BookingsPage ───────────────────────────────────────────────────────────



const BookingsPage: React.FC = () => {

  const navigate = useNavigate();



  const [theme, setTheme] = useState<"light" | "dark">(

    () => (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light",

  );



  const [toasts, setToasts] = useState<Toast[]>([]);



  const [bookings, setBookings] = useState<Booking[]>([]);



  const [totalCount, setTotalCount] = useState(0);



  const [todayCount, setTodayCount] = useState(0);



  const [allCount, setAllCount] = useState(0);



  const [isLoading, setIsLoading] = useState(true);



  const [error, setError] = useState<string | null>(null);



  const [isExporting, setIsExporting] = useState(false);



  const savedViewState = getSavedBookingsViewState();



  const [activeTab, setActiveTab] = useState<TabType>(

    savedViewState.activeTab ?? "today",

  );

  const [page, setPage] = useState(savedViewState.page ?? 1);

  const [pageSize, setPageSize] = useState(savedViewState.pageSize ?? 20);



  const [search, setSearch] = useState(savedViewState.search ?? "");

  const [debSearch, setDebSearch] = useState(savedViewState.debSearch ?? "");

  const [dateFrom, setDateFrom] = useState(savedViewState.dateFrom ?? "");

  const [dateTo, setDateTo] = useState(savedViewState.dateTo ?? "");

  const [bookingType, setBookingType] = useState<BookingType | "">(

    savedViewState.bookingType ?? "",

  );

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">(

    savedViewState.paymentStatus ?? "",

  );

  const [isCancelled, setIsCancelled] = useState<"" | "true" | "false">(

    savedViewState.isCancelled ?? "",

  );



  const [countdown, setCountdown] = useState(REFRESH_SECONDS);



  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  const toastIdRef = useRef(0);



  const hasLoadedOnceRef = useRef(false);



  const requestIdRef = useRef(0);



  const refreshInFlightRef = useRef(false);



  useEffect(() => {

    saveBookingsViewState({

      activeTab,

      page,

      pageSize,

      search,

      debSearch,

      dateFrom,

      dateTo,

      bookingType,

      paymentStatus,

      isCancelled,

    });

  }, [

    activeTab,

    page,

    pageSize,

    search,

    debSearch,

    dateFrom,

    dateTo,

    bookingType,

    paymentStatus,

    isCancelled,

  ]);



  // ── Theme ────────────────────────────────────────────────────────────────



  const toggleTheme = () => {

    const next = theme === "light" ? "dark" : "light";



    setTheme(next);



    localStorage.setItem(THEME_KEY, next);

  };



  const pushToast = useCallback((message: string, type: ToastType = "info") => {

    const id = ++toastIdRef.current;



    setToasts((t) => [...t, { id, message, type }]);



    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);

  }, []);



  // ── Search debounce ─────────────────────────────────────────────────────



  const handleSearchChange = (val: string) => {

    setSearch(val);



    if (debRef.current) clearTimeout(debRef.current);



    debRef.current = setTimeout(() => {

      setDebSearch(val);



      setPage(1);

    }, 400);

  };



  // ── Fetch ────────────────────────────────────────────────────────────────



  const fetchBookings = useCallback(async () => {

    const requestId = ++requestIdRef.current;



    if (!hasLoadedOnceRef.current) {

      setIsLoading(true);

    }



    setError(null);



    try {

      const params: ListBookingsParams = {

        page,



        page_size: pageSize,

      };



      if (debSearch) {

        params.search = debSearch;

      }



      if (bookingType) {

        params.booking_type = bookingType;

      }



      if (paymentStatus) {

        params.payment_status = paymentStatus;

      }



      if (isCancelled) {

        params.is_cancelled = isCancelled === "true";

      }



      if (activeTab === "today") {

        params.slot_date = getToday();

      } else {

        if (dateFrom) {

          params.date_from = dateFrom;

        }



        if (dateTo) {

          params.date_to = dateTo;

        }

      }



      const data = await listBookings(params);



      // Ignore an older request that finished after a newer request.



      if (requestId !== requestIdRef.current) {

        return;

      }



      const fetchedBookings = data.results ?? [];



const hasDateRange = Boolean(dateFrom || dateTo);



setBookings(

  hasDateRange

    ? sortBookingsAscending(fetchedBookings)

    : sortBookingsRecentFirst(fetchedBookings),

);



      setTotalCount(data.count ?? 0);



      hasLoadedOnceRef.current = true;

    } catch (err) {

      console.error("Bookings fetch failed:", err);



      // Do not destroy already-loaded data because of a



      // temporary refresh/API failure.



      if (!hasLoadedOnceRef.current) {

        setBookings([]);



        setTotalCount(0);



        setError("Failed to load bookings.");

      } else {

        setError("Unable to refresh bookings. Showing the last loaded data.");

      }

    } finally {

      if (requestId === requestIdRef.current) {

        setIsLoading(false);

      }

    }

  }, [

    page,



    pageSize,



    debSearch,



    bookingType,



    paymentStatus,



    isCancelled,



    activeTab,



    dateFrom,



    dateTo,

  ]);



  // Independent of which tab is active — both badges always reflect the



  // real totals (with the shared filters applied), not just whatever the



  // currently active tab happens to have loaded.



  const fetchCounts = useCallback(async () => {

    try {

      const baseParams: ListBookingsParams = {

        page: 1,

        page_size: 1,

      };



      if (debSearch) baseParams.search = debSearch;

      if (bookingType) baseParams.booking_type = bookingType;

      if (paymentStatus) baseParams.payment_status = paymentStatus;

      if (isCancelled) {

        baseParams.is_cancelled = isCancelled === "true";

      }



      // All Bookings follows the active filters, including date range.

      const allParams: ListBookingsParams = {

        ...baseParams,

      };



      if (dateFrom) allParams.date_from = dateFrom;

      if (dateTo) allParams.date_to = dateTo;



      // Today's Bookings remains today's count and is not restricted by

      // the All Bookings date-range filter.

      const [todayData, allData] = await Promise.all([

        listBookings({

          ...baseParams,

          slot_date: TODAY,

        }),

        listBookings(allParams),

      ]);



      setTodayCount(todayData.count ?? 0);

      setAllCount(allData.count ?? 0);

    } catch {

      // Keep the last known counts if a background count request fails.

    }

  }, [debSearch, bookingType, paymentStatus, isCancelled, dateFrom, dateTo]);



  useEffect(() => {

    fetchBookings();

  }, [fetchBookings]);



  useEffect(() => {

    fetchCounts();

  }, [fetchCounts]);



  const refreshAllData = useCallback(async () => {

    if (refreshInFlightRef.current) {

      return;

    }



    refreshInFlightRef.current = true;



    try {

      await Promise.all([fetchBookings(), fetchCounts()]);

    } finally {

      refreshInFlightRef.current = false;

    }

  }, [fetchBookings, fetchCounts]);



  // ── Auto-refresh timer ──────────────────────────────────────────────────



  useEffect(() => {

    const timer = setInterval(() => {

      setCountdown((c) => {

        if (c <= 1) {

          void refreshAllData();



          pushToast("⏰ Auto-refreshed (10 min)", "info");



          return REFRESH_SECONDS;

        }



        return c - 1;

      });

    }, 1000);



    return () => clearInterval(timer);

  }, [fetchBookings, fetchCounts, pushToast]);



  const manualRefresh = async () => {

    setCountdown(REFRESH_SECONDS);



    await refreshAllData();



    pushToast("🔄 Data refreshed", "success");

  };



  const switchTab = (tab: TabType) => {

    setActiveTab(tab);

    setPage(1);



    // Do not clear filters here.

    // Filters are cleared only by Reset Filters.

    pushToast(

      tab === "today" ? "📅 Today's bookings" : "📋 All bookings",

      "info",

    );

  };



  const applyFilters = async () => {

    setDebSearch(search.trim());



    setPage(1);



    pushToast("🔍 Filters applied", "success");

  };



  const resetFilters = () => {

    setSearch("");

    setDebSearch("");

    setDateFrom("");

    setDateTo("");

    setBookingType("");

    setPaymentStatus("");

    setIsCancelled("");

    setPageSize(20);

    setPage(1);



    try {

      sessionStorage.removeItem(BOOKINGS_VIEW_STATE_KEY);

    } catch {

      // Ignore storage failures.

    }



    pushToast("↩️ Filters reset", "info");

  };



  // ── Export ───────────────────────────────────────────────────────────────



  const fetchAllForExport = useCallback(async (): Promise<Booking[]> => {

    let all: Booking[] = [];



    let currentPage = 1;



    let hasMore = true;



    const baseParams: ListBookingsParams = { page_size: 100 };



    if (debSearch) baseParams.search = debSearch;



    if (bookingType) baseParams.booking_type = bookingType;



    if (paymentStatus) baseParams.payment_status = paymentStatus;



    if (isCancelled) baseParams.is_cancelled = isCancelled === "true";



    if (activeTab === "today") {

      baseParams.slot_date = TODAY;

    } else {

      if (dateFrom) baseParams.date_from = dateFrom;



      if (dateTo) baseParams.date_to = dateTo;

    }



    while (hasMore) {

      try {

        const data = await listBookings({ ...baseParams, page: currentPage });



        if (data.results?.length) all = [...all, ...data.results];



        hasMore = data.next !== null && !!data.results?.length;



        currentPage++;



        if (currentPage > 100) break;

      } catch {

        break;

      }

    }



    return all;

  }, [

    debSearch,

    bookingType,

    paymentStatus,

    isCancelled,

    activeTab,

    dateFrom,

    dateTo,

  ]);



  const handleExport = async () => {

    if (bookings.length === 0) {

      pushToast("No data to export", "error");



      return;

    }



    setIsExporting(true);



    try {

      const all = await fetchAllForExport();



      if (all.length === 0) {

        pushToast("No data to export", "error");



        return;

      }



      const rows = sanitizeForExport(

        all.map((b) => {

          const slots =

            b.slots

              ?.map(

                (s) =>

                  `${new Date(s.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ${s.start_time}-${s.end_time}${s.is_next_day ? " +1" : ""}`,

              )

              .join("; ") || "";



          return {

            "Booking ID": b.id,



            "Booking Code": b.booking_code || "",



            "Booking Type": b.booking_type || "",



            "Customer Name": b.customer?.name || "",



            "Customer Email": b.customer?.email || "",



            "Customer Phone": b.customer?.number || b.customer?.mobile || "",



            Partner: b.partner_name || "",



            Turf: b.turf_name || "",



            "Court Number": b.court_number || "",



            Slots: slots,



            "Total Amount": formatCurrencyForExport(b.total_amount),



            "Paid Amount": formatCurrencyForExport(b.paid_amount),



            "Pending Amount": formatCurrencyForExport(b.pending_amount),



            "Admin Discount": formatCurrencyForExport(b.admin_discount_amount),



            "Partner Discount": formatCurrencyForExport(

              b.partner_discount_amount,

            ),



            "Total Discount": formatCurrencyForExport(b.total_discount_amount),



            "Payment Status": getBookingDisplayStatus(b),



            "Booking Status": b.is_cancelled ? "Cancelled" : "Active",



            "Created Date": formatDateForExport(b.created_at),

          };

        }),

      );



      exportData(rows, {

        fileName: `turf-bookings-${TODAY}`,

        format: "excel",

        sheetName: "Bookings",

      });



      pushToast(`📥 Exported ${all.length} bookings`, "success");

    } catch {

      pushToast("Export failed. Please try again.", "error");

    } finally {

      setIsExporting(false);

    }

  };



  // ── Derived stats (current page) ────────────────────────────────────────



  const totalRevenue = useMemo(

    () => bookings.reduce((s, b) => s + parseFloat(b.paid_amount || "0"), 0),

    [bookings],

  );



  const totalPending = useMemo(

    () => bookings.reduce((s, b) => s + parseFloat(b.pending_amount || "0"), 0),

    [bookings],

  );



  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));



  const startIdx = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;



  const endIdx = Math.min(page * pageSize, totalCount);



  const timerPct = countdown / REFRESH_SECONDS;



  const timerColor =

    timerPct <= 0.1

      ? "#ef4444"

      : timerPct <= 0.25

        ? "#f97316"

        : timerPct <= 0.5

          ? "#eab308"

          : undefined;



  return (

    <div className="tbm-app tbm-bookings-page" data-theme={theme === "dark" ? "dark" : undefined}>

      <div className="tbm-toast-container">

        {toasts.map((t) => (

          <div key={t.id} className={`tbm-toast ${t.type}`}>

            <span className="tbm-toast-message">{t.message}</span>

          </div>

        ))}

      </div>



      <div className="tbm-container">

        {/* Header */}



        <header className="tbm-header">

          <div className="tbm-header-top">

            <div className="tbm-logo-section">

              <div className="tbm-logo-icon">⚽</div>



              <div className="tbm-header-title">

                <h1>Turf Booking Manager</h1>



                <p>Customer Support Dashboard • Real-time Management</p>

              </div>

            </div>



            <div className="tbm-header-controls">

              <button

                className="tbm-theme-toggle"

                onClick={toggleTheme}

                title="Toggle Light/Dark Theme"

              >

                {theme === "dark" ? "☀️" : "🌙"}

              </button>



              {/* <div className="tbm-timer-display">



                <span>⏱ Auto-refresh:</span>



                <div className="tbm-timer-circle" style={timerColor ? { color: timerColor, borderColor: timerColor } : undefined}>



                  {formatTimer(countdown)}



                </div>



              </div> */}



              <button

                className="tbm-btn-refresh"

                onClick={manualRefresh}

                disabled={isLoading}

              >

                🔄 Refresh

              </button>

            </div>

          </div>



          <div className="tbm-stats-grid">

            <div className="tbm-stat-card">

              <div className="tbm-stat-header">

                <div className="tbm-stat-icon total">📊</div>



                <span className="tbm-stat-trend up">LIVE</span>

              </div>



              <div className="tbm-stat-value">

                {allCount.toLocaleString("en-IN")}

              </div>



              <div className="tbm-stat-label">Total Bookings</div>

            </div>



            <div className="tbm-stat-card">

              <div className="tbm-stat-header">

                <div className="tbm-stat-icon today">📅</div>



                <span className="tbm-stat-trend up">TODAY</span>

              </div>



              <div className="tbm-stat-value">

                {todayCount.toLocaleString("en-IN")}

              </div>



              <div className="tbm-stat-label">Today's Bookings</div>

            </div>



            <div className="tbm-stat-card">

              <div className="tbm-stat-header">

                <div className="tbm-stat-icon revenue">💰</div>



                <span className="tbm-stat-trend up">REV</span>

              </div>



              <div className="tbm-stat-value">

                {formatCurrency(totalRevenue)}

              </div>



              <div className="tbm-stat-label">Total Revenue</div>

            </div>



            <div className="tbm-stat-card">

              <div className="tbm-stat-header">

                <div className="tbm-stat-icon pending">⚠️</div>



                <span className="tbm-stat-trend down">PND</span>

              </div>



              <div className="tbm-stat-value">

                {formatCurrency(totalPending)}

              </div>



              <div className="tbm-stat-label">Pending Amount</div>

            </div>

          </div>

        </header>



        {/* Tabs */}



        <div className="tbm-tabs">

          <button

            className={`tbm-tab-btn ${activeTab === "today" ? "active" : ""}`}

            onClick={() => switchTab("today")}

          >

            <span>📅</span>

            <span>Today's Bookings</span>



            <span className="tbm-tab-count">{todayCount}</span>

          </button>



          <button

            className={`tbm-tab-btn ${activeTab === "all" ? "active" : ""}`}

            onClick={() => switchTab("all")}

          >

            <span>📋</span>

            <span>All Bookings</span>



            <span className="tbm-tab-count">{allCount}</span>

          </button>

        </div>



        {/* Filters */}



        <div className="tbm-filters">

          <div className="tbm-section-title">

            <div className="tbm-section-title-icon">🔍</div>

            Search &amp; Filter Options

          </div>



          <div className="tbm-filters-grid">

            <div className="tbm-filter-group">

              <label className="tbm-filter-label">🔎 Search</label>



              <input

                type="text"

                placeholder="Name, Email, Phone..."

                value={search}

                onChange={(e) => handleSearchChange(e.target.value)}

                onKeyDown={(e) => e.key === "Enter" && applyFilters()}

              />

            </div>



            {activeTab === "all" && (

              <div className="tbm-filter-group tbm-date-range">

                <label className="tbm-filter-label">📆 Date Range</label>



                <div>

                  <input

                    type="date"

                    value={dateFrom}

                    onChange={(e) => {

                      setDateFrom(e.target.value);

                      setPage(1);

                    }}

                    max={dateTo || undefined}

                  />



                  <span

                    style={{

                      color: "var(--text-muted)",

                      fontSize: 11,

                      fontWeight: 600,

                    }}

                  >

                    to

                  </span>



                  <input

                    type="date"

                    value={dateTo}

                    onChange={(e) => {

                      setDateTo(e.target.value);

                      setPage(1);

                    }}

                    min={dateFrom || undefined}

                  />

                </div>

              </div>

            )}



            <div className="tbm-filter-group">

              <label className="tbm-filter-label">📄 Per Page</label>



              <select

                value={pageSize}

                onChange={(e) => {

                  setPageSize(parseInt(e.target.value, 10));

                  setPage(1);

                }}

              >

                {PAGE_SIZE_OPTIONS.map((n) => (

                  <option key={n} value={n}>

                    {n} records

                  </option>

                ))}

              </select>

            </div>



            <div className="tbm-filter-group">

              <label className="tbm-filter-label">💳 Payment Status</label>



              <select

                value={paymentStatus}

                onChange={(e) => {

                  setPaymentStatus(e.target.value as PaymentStatus | "");

                  setPage(1);

                }}

              >

                <option value="">All Statuses</option>

                <option value="Fully Paid">Fully Paid</option>

                <option value="Advance Paid">Partially Paid</option>

              </select>

            </div>



            <div className="tbm-filter-group">

              <label className="tbm-filter-label">🌐 Booking Type</label>



              <select

                value={bookingType}

                onChange={(e) => {

                  setBookingType(e.target.value as BookingType | "");

                  setPage(1);

                }}

              >

                <option value="">All Types</option>

                <option value="Online">Online</option>

                <option value="Offline">Offline</option>

              </select>

            </div>



            <div className="tbm-filter-group">

              <label className="tbm-filter-label">❌ Booking status</label>



              <select

                value={isCancelled}

                onChange={(e) => {

                  setIsCancelled(e.target.value as "" | "true" | "false");

                  setPage(1);

                }}

              >

                <option value="">All Bookings</option>



                <option value="false">Active Only</option>



                <option value="true">Cancelled Only</option>

              </select>

            </div>

          </div>



          <div className="tbm-action-buttons">

            <button className="tbm-btn tbm-btn-primary" onClick={applyFilters}>

              🔍 Apply Filters

            </button>



            <button className="tbm-btn tbm-btn-outline" onClick={resetFilters}>

              ↩️ Reset Filters

            </button>



            <button

              className="tbm-btn tbm-btn-export"

              onClick={handleExport}

              disabled={isExporting}

            >

              {isExporting ? "⏳ Exporting…" : "📥 Export CSV"}

            </button>

          </div>

        </div>



        {/* Table */}



        <div className="tbm-table-section" style={{ position: "relative" }}>

          {isLoading && (

            <div className="tbm-loading-overlay">

              <div>

                <div className="tbm-loader"></div>



                <div className="tbm-loader-text">Loading bookings…</div>

              </div>

            </div>

          )}



          <div className="tbm-table-header-bar">

            <div className="tbm-results-info">

              Showing <strong>{bookings.length}</strong> of{" "}

              <strong>{totalCount}</strong> bookings

            </div>



            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>

              Page{" "}

              <strong style={{ color: "var(--primary-light)" }}>{page}</strong>{" "}

              of <strong>{totalPages}</strong>

            </div>

          </div>



          {error && (

            <div style={{ padding: 16 }}>

              <div className="tbm-toast error" style={{ minWidth: 0 }}>

                <span className="tbm-toast-message">{error}</span>



                <button

                  className="tbm-btn tbm-btn-outline"

                  onClick={() => fetchBookings()}

                >

                  Retry

                </button>

              </div>

            </div>

          )}



          {!error && bookings.length === 0 && !isLoading ? (

            <div className="tbm-empty-state">

              <div className="tbm-empty-icon">🔍</div>



              <div className="tbm-empty-title">No Bookings Found</div>



              <div className="tbm-empty-desc">

                Try adjusting your filters or search criteria.

              </div>

            </div>

          ) : (

            <div className="tbm-table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>S.No</th>



                    <th>Code</th>



                    <th>Type</th>



                    <th>Turf / Court</th>



                    <th>User Details</th>



                    <th>Booked On</th>



                    <th>Slots (12hr)</th>



<th>Total</th>
<th>App Paid</th>
<th>Cash at Venue</th>
<th>Balance Due</th>
<th>Status</th>
                    <th>Action</th>

                  </tr>

                </thead>



                <tbody>

                  {bookings.map((b, idx) => {

                    const discount = parseFloat(b.total_discount_amount || "0");
                    const breakdown = getPaymentBreakdown(b);
const displayStatus = getBookingDisplayStatus(b);



                    return (

                      <tr

                        key={b.id}

                        className={

                          b.booking_type === "Online" ? "online-booking" : ""

                        }

                        onClick={(e) => {

                          e.stopPropagation();

                          navigate(`/admin/bookings/${b.id}`);

                        }}

                        style={{ cursor: "pointer" }}

                      >

                        <td>

                          <div className="tbm-serial">{startIdx + idx}</div>

                        </td>



                        <td>

                          <div className="tbm-booking-code">

                            {b.booking_code}

                          </div>



                          <div

                            style={{

                              fontSize: 9,

                              color: "var(--text-muted)",

                              marginTop: 2,

                            }}

                          >

                            ID: {b.id}

                          </div>

                        </td>



                        <td>

                          <TypeBadge type={b.booking_type} />

                        </td>



                        <td>

                          <div className="tbm-user-name">{b.turf_name}</div>



                          <div className="tbm-user-contact">

                            Court {b.court_number}

                          </div>

                        </td>



                        <td>

                          <div className="tbm-user-cell">

                            <span className="tbm-user-name">

                              {b.customer?.name ?? "—"}

                            </span>



                            <span className="tbm-user-contact">

                              📧 {b.customer?.email}

                            </span>



                            <span className="tbm-user-contact">

                              📱 {b.customer?.number || b.customer?.mobile}

                            </span>

                          </div>

                        </td>



                        <td>

                          <div className="tbm-user-cell">

                            <span className="tbm-user-name">

                              {formatBookedOn(b.created_at)}

                            </span>



                            <span className="tbm-user-contact">

                              Booking #{b.id}

                            </span>

                          </div>

                        </td>



                        <td>

                          <div style={{ display: "flex", flexWrap: "wrap" }}>

                            {b.slots?.map((slot, si) => (

                              <div className="tbm-slot-chip" key={si}>

                                <span className="tbm-slot-date">

                                  {formatSlotDate(slot.date)}

                                </span>



                                <span className="tbm-slot-time">

                                  {slot.start_time} - {slot.end_time}

                                </span>



                                {slot.is_next_day && (

                                  <span

                                    style={{

                                      color: "var(--warning)",

                                      fontSize: 9,

                                    }}

                                  >

                                    +1

                                  </span>

                                )}

                              </div>

                            ))}

                          </div>

                        </td>



                        <td className="tbm-amount-cell tbm-amount-total">

                          {formatCurrency(breakdown.total)}



                          {discount > 0 && (

                            <div

                              style={{

                                fontSize: 9,

                                color: "var(--success)",

                                fontWeight: 600,

                              }}

                            >

                              -{formatCurrency(b.total_discount_amount)}

                            </div>

                          )}

                        </td>



                        <td className="tbm-amount-cell tbm-amount-paid">

                         {formatCurrency(breakdown.appPaid)}

                        </td>
                        <td className="tbm-amount-cell">
  {formatCurrency(breakdown.cashPaid)}
</td>



                        <td className="tbm-amount-cell tbm-amount-pending">

                          {formatCurrency(breakdown.outstanding)}

                        </td>



                        <td>

                          <PaymentBadge status={displayStatus} />

                        </td>



                        <td>

                          <button

                            className="tbm-btn-view"

                            onClick={(e) => {

                              e.stopPropagation();

                              navigate(`/admin/bookings/${b.id}`);

                            }}

                          >

                            View

                          </button>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}



          <div className="tbm-pagination">

            <div className="tbm-pagination-info">

              {totalCount > 0

                ? `Showing ${startIdx}-${endIdx} of ${totalCount} results`

                : "No results found"}

            </div>



            <Pagination

              page={page}

              totalPages={totalPages}

              onChange={setPage}

            />

          </div>

        </div>

      </div>

    </div>

  );

};



export default BookingsPage;
