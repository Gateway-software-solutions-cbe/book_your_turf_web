import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useProfileGuard } from "../../context/ProfileGuardContext";
import { partnerDashboardApi } from "../../api/partner/dashboard";
import { partnerSlotsApi } from "../../api/partner/slots";
import type {
  PartnerDashboardStats,
  PendingBalanceData,
  RevenueData,
} from "../../types/partner/dashboard";
import type { PartnerBooking } from "../../types/partner/slot";
import DashboardStatCard from "../../components/partner/DashboardStatCard";
import welcomeHeroImage from "../../asset/welcome_with_yellow.png";
import {
  metaPartnerDashboardViewed,
  setPartnerContext,
} from "../../lib/metaPixel";
import RevenueBreakdownModal from "../../components/partner/RevenueBreakdownModal";
import PendingBalanceModal from "../../components/partner/PendingBalanceModal";
import "./PartnerDashboardPage.css";

const currency = (v: string | number): string => {
  const n = Number(v) || 0;
  const sign = n < 0 ? "-" : "";

  return (
    sign +
    "₹" +
    Math.abs(n).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
  );
};

const PartnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { partner, isGuest } = usePartnerAuth();
  const { openCompleteProfile } = useProfileGuard();

  const [stats, setStats] = useState<PartnerDashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [pendingBalance, setPendingBalance] =
    useState<PendingBalanceData | null>(null);
  const [recentBookings, setRecentBookings] = useState<PartnerBooking[]>([]);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dashboardViewedFiredRef = useRef(false);

  // Auto-prompt guest once per session
  useEffect(() => {
    if (!isGuest) return;
    if (sessionStorage.getItem("pt_auto_prompt_done")) return;
    sessionStorage.setItem("pt_auto_prompt_done", "1");
    const t = setTimeout(() => openCompleteProfile(), 500);
    return () => clearTimeout(t);
  }, [isGuest, openCompleteProfile]);

  // Fetch dashboard data
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      try {
        const [dashRes, revRes, pendingRes, bookingsRes] =
          await Promise.all([
            partnerDashboardApi.getDashboard(),
            partnerDashboardApi.getRevenue(),
            partnerDashboardApi.getPendingBalance("past"),
            partnerSlotsApi.listBookings({
              page: 1,
              page_size: 3,
            }),
          ]);

        setStats(dashRes.data);
        setRevenue(revRes.data);
        setPendingBalance(pendingRes.data);
        setRecentBookings(bookingsRes.data?.results ?? []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (dashboardViewedFiredRef.current) return;
    if (!partner) return;

    dashboardViewedFiredRef.current = true;

    const partnerType: "owner_new" | "owner_active" =
      (stats?.approved_venues_count ?? 0) > 0
        ? "owner_active"
        : "owner_new";

    setPartnerContext({
      partner_id: partner.id,
      business_name: partner.business_name,
      partner_type: partnerType,
      venues_count: stats?.approved_venues_count ?? 0,
    });

    metaPartnerDashboardViewed({
      partner_type: partnerType,
      venues_count: stats?.approved_venues_count ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner, stats?.approved_venues_count]);

  const displayName = partner?.name?.trim() || "Partner";

  /* =========================================================
     METRICS — mirrored from the mobile app
     ========================================================= */

  // Revenue = overall collected
  const overallRevenue = Number(revenue?.overall_collected ?? 0);

  // Online/Offline split from the dashboard stats response
  // (RevenueData doesn't expose per-channel collected amounts).
  const overallRevenueOnline = Number(
    stats?.overall_collected_online_amount ?? 0
  );
  const overallRevenueOffline = Number(
    stats?.overall_collected_offline_amount ?? 0
  );

  // Today's bookings
  const todayOnline = stats?.today_upcoming_online_count ?? 0;
  const todayOffline = stats?.today_upcoming_offline_count ?? 0;
  const todayTotal = todayOnline + todayOffline;

  // Raw all-time completed counts
  const completedOnline =
    stats?.overall_previous_completed_online_bookings_count ?? 0;
  const completedOffline =
    stats?.overall_previous_completed_offline_bookings_count ?? 0;

  // Card values — blended to match mobile:
  //   "Online 65"        = completed online (64) + today's upcoming online (1)
  //   "All Bookings 174" = completed (173) + upcoming total (1)
  const upcomingOnline = stats?.upcoming_bookings_online_count ?? 0;
  const upcomingOffline = stats?.upcoming_bookings_offline_count ?? 0;
  const upcomingTotal = upcomingOnline + upcomingOffline;

  const onlineCardValue = completedOnline + todayOnline; // 65
  const allBookingsOnline = completedOnline + todayOnline; // 65
  const allBookingsOffline = completedOffline; // 109
  const allBookingsTotal = allBookingsOnline + allBookingsOffline; // 174

  // This-month completed counts (Online/Offline "This Month" sub-line)
  const thisMonthOnlineCompleted =
    stats?.overall_previous_completed_this_month_online_count ?? 0;
  const thisMonthOfflineCompleted =
    stats?.overall_previous_completed_this_month_offline_count ?? 0;

  // Balance — matches mobile: the upcoming pending amount.
  //   overall_upcoming_pending_amount = 800
  // Do NOT use pendingBalance.overall_pending here — that endpoint
  // returns the all-time past balance (₹171,589).
  const balanceValue = Number(
    stats?.overall_upcoming_pending_amount ??
      stats?.this_month_upcoming_pending_amount ??
      0
  );

    // Revenue modal values
  const monthRevenueOnline = Number(
    stats?.overall_previous_completed_this_month_online_amount ?? 0
  );
  const monthRevenueOffline = Number(
    stats?.overall_previous_completed_this_month_offline_amount ?? 0
  );
  const monthRevenueTotal = overallRevenue; // 127011 from revenue.overall_collected

  // Advance / Fully Paid are NOT in the dashboard response you shared.
  // Placeholders below keep the modal structure intact; replace with
  // real fields when the backend exposes them.
  const monthRevenueAdvance = 0;
  const monthRevenueFullyPaid = monthRevenueTotal - monthRevenueAdvance;

  // Pending balance modal values
  const pastPendingTotal = Number(
    stats?.overall_pending_amount_for_completed_bookings ?? 0
  ); // 171589
  const pastPendingOnline = Number(stats?.pending_online_amount ?? 0); // 9100
  const pastPendingOffline = Number(stats?.pending_offline_amount ?? 0); // 163289

  const upcomingPendingTotal = Number(
    stats?.overall_upcoming_pending_amount ?? 0
  ); // 800
  const upcomingPendingOnline = Number(
    stats?.upcoming_this_month_online_amount ?? 0
  ); // 1600 — closest online-side pending field available
  const upcomingPendingOffline = Number(
    stats?.overall_upcoming_offline_amount ?? 0
  ); // 0

  return (
    <div className="pt-dash">
      {error && <div className="pt-auth-error">{error}</div>}

      {/* Welcome hero */}
      <section
        className="pt-dash-hero"
        aria-label="Welcome to BookYourTurf"
      >
        <img
          className="pt-dash-hero-image"
          src={welcomeHeroImage}
          alt="BookYourTurf sports welcome banner featuring football players"
        />
      </section>

      {/* Stat cards grid */}
      {loading ? (
        <div className="pt-dash-loading">Loading dashboard...</div>
      ) : (
        <div className="pt-dash-grid">
          <DashboardStatCard
            icon="📍"
            label="Venues"
            value={String(stats?.approved_venues_count ?? 0)}
            onClick={() => navigate("/partner/venues")}
          />

          <DashboardStatCard
            icon="₹"
            label="Revenue"
            value={currency(overallRevenue)}
            subLines={[
              {
                label: "Online",
                value: currency(overallRevenueOnline),
              },
              {
                label: "Offline",
                value: currency(overallRevenueOffline),
              },
            ]}
            // onClick={() => setRevenueModalOpen(true)}
          />

          <DashboardStatCard
            icon="📅"
            label="Today's"
            value={String(todayTotal)}
            subLines={[
              {
                label: "Online",
                value: String(todayOnline),
              },
              {
                label: "Offline",
                value: String(todayOffline),
              },
            ]}
            onClick={() => navigate("/partner/bookings")}
          />

          <DashboardStatCard
  icon="📖"
  label="All Bookings"
  value={String(allBookingsTotal)}
  subLines={[
    { label: "Online", value: String(allBookingsOnline) },
    { label: "Offline", value: String(allBookingsOffline) },
  ]}
  onClick={() => navigate("/partner/bookings?range=all")}
/>

          <DashboardStatCard
            icon="📶"
            label="Online"
            value={String(onlineCardValue)}
            subLines={[
              {
                label: "Today",
                value: String(todayOnline),
              },
              {
                label: "This Month",
                value: String(thisMonthOnlineCompleted),
              },
            ]}
            onClick={() => navigate("/partner/bookings?range=all&type=online")}
          />

          <DashboardStatCard
            icon="📞"
            label="Offline"
            value={String(completedOffline)}
            subLines={[
              {
                label: "Today",
                value: String(todayOffline),
              },
              {
                label: "This Month",
                value: String(thisMonthOfflineCompleted),
              },
            ]}
            onClick={() => navigate("/partner/bookings?range=all&type=offline")}
          />

          <DashboardStatCard
            icon="💳"
            label="Balance"
            value={currency(balanceValue)}
            subLines={[
              {
                label: "Collected",
                value: currency(overallRevenue),
              },
              {
                label: "Pending",
                value: currency(balanceValue),
              },
            ]}
            // onClick={() => setBalanceModalOpen(true)}
          />

          <DashboardStatCard
            icon="🗓"
            label="Upcoming"
            value={String(upcomingTotal)}
            subLines={[
              {
                label: "Online",
                value: String(upcomingOnline),
              },
              {
                label: "Offline",
                value: String(upcomingOffline),
              },
            ]}
            onClick={() => navigate("/partner/bookings")}
          />
        </div>
      )}

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <section className="pt-dash-recent">
          <header className="pt-dash-recent-header">
            <h3>Recent Bookings</h3>

            <button
              className="pt-dash-viewall"
              onClick={() => navigate("/partner/bookings")}
            >
              View All
            </button>
          </header>

          <div className="pt-dash-recent-list">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="pt-dash-recent-item"
                onClick={() => navigate("/partner/bookings")}
              >
                <div className="pt-dash-recent-icon">📅</div>

                <div className="pt-dash-recent-body">
                  <span className="pt-dash-recent-title">
                    {b.turf_name}
                  </span>

                  <span className="pt-dash-recent-customer">
                    👤 {b.customer.name}
                  </span>
                </div>

                <span className="pt-dash-recent-date">
                  {b.slots[0]?.date
                    ? new Date(b.slots[0].date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
            <RevenueBreakdownModal
        open={revenueModalOpen}
        onClose={() => setRevenueModalOpen(false)}
        month={{
          // No dedicated "this month collected" field exists, so use
          // the this-month completed booking amount as the closest proxy.
          total: Number(
            stats?.overall_previous_completed_this_month_booking_amount ?? 0
          ),
          online: Number(
            stats?.overall_previous_completed_this_month_online_amount ?? 0
          ),
          offline: Number(
            stats?.overall_previous_completed_this_month_offline_amount ?? 0
          ),
          // Advance / Fully Paid aren't in the API at all.
          advance: 0,
          fullyPaid: Number(
            stats?.overall_previous_completed_this_month_booking_amount ?? 0
          ),
        }}
      />

      <PendingBalanceModal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        past={{
          total: pastPendingTotal,
          online: pastPendingOnline,
          offline: pastPendingOffline,
        }}
        upcoming={{
          total: upcomingPendingTotal,
          online: upcomingPendingOnline,
          offline: upcomingPendingOffline,
        }}
      />
    </div>
  );
};

export default PartnerDashboardPage;