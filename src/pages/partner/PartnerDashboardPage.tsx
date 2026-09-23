import React, { useEffect, useState } from "react";
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
import "./PartnerDashboardPage.css";

const currency = (v: string | number): string => {
  const n = Number(v) || 0;
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    "₹" +
    Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })
  );
};

const PartnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { partner, isGuest } = usePartnerAuth();
  const { openCompleteProfile } = useProfileGuard();

  const [stats, setStats] = useState<PartnerDashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [pendingBalance, setPendingBalance] = useState<PendingBalanceData | null>(
    null,
  );
  const [recentBookings, setRecentBookings] = useState<PartnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const [dashRes, revRes, pendingRes, bookingsRes] = await Promise.all([
          partnerDashboardApi.getDashboard(),
          partnerDashboardApi.getRevenue(),
          partnerDashboardApi.getPendingBalance("past"),
          partnerSlotsApi.listBookings({ page: 1, page_size: 3 }),
        ]);

        setStats(dashRes.data);
        setRevenue(revRes.data);
        setPendingBalance(pendingRes.data);
        setRecentBookings(bookingsRes.data?.bookings?.results ?? []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayName = partner?.name?.trim() || "Partner";

  // Total bookings (completed + upcoming)
  const allBookingsCount =
    (stats?.overall_previous_completed_bookings_count ?? 0) +
    (stats?.upcoming_bookings_total_count ?? 0);
  const allBookingsOnline =
    (stats?.overall_previous_completed_online_bookings_count ?? 0) +
    (stats?.upcoming_bookings_online_count ?? 0);
  const allBookingsOffline =
    (stats?.overall_previous_completed_offline_bookings_count ?? 0) +
    (stats?.upcoming_bookings_offline_count ?? 0);

  // Today's bookings
  const todayOnline = stats?.today_upcoming_online_count ?? 0;
  const todayOffline = stats?.today_upcoming_offline_count ?? 0;
  const todayTotal = todayOnline + todayOffline;

  return (
    <div className="pt-dash">
      {error && <div className="pt-auth-error">{error}</div>}

      {/* Welcome banner */}
      {/* <section className="pt-dash-welcome">
        <h1>Hello {displayName}</h1>
        <p className="pt-dash-location">📍 Chennai</p>
      </section> */}

      {/* Hero welcome image */}
      <section className="pt-dash-hero">
        <div className="pt-dash-hero-content">
          <h2>WELCOME</h2>
          <p>
            Manage smarter, earn better, grow faster with{" "}
            <strong>BOOK YOUR TURF</strong>
          </p>
        </div>
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
            value={currency(revenue?.overall_collected ?? 0)}
            subLines={[
              { label: "Online", value: currency(revenue?.online_collected ?? 0) },
              { label: "Offline", value: currency(revenue?.offline_collected ?? 0) },
            ]}
            onClick={() => navigate("/partner/analytics")}
          />

          <DashboardStatCard
            icon="📅"
            label="Today's"
            value={String(todayTotal)}
            subLines={[
              { label: "Online", value: String(todayOnline) },
              { label: "Offline", value: String(todayOffline) },
            ]}
            onClick={() => navigate("/partner/bookings")}
          />

          <DashboardStatCard
            icon="📖"
            label="All Bookings"
            value={String(allBookingsCount)}
            subLines={[
              { label: "Online", value: String(allBookingsOnline) },
              { label: "Offline", value: String(allBookingsOffline) },
            ]}
            onClick={() => navigate("/partner/bookings")}
          />

          <DashboardStatCard
            icon="📶"
            label="Online"
            value={String(
              stats?.overall_previous_completed_online_bookings_count ?? 0,
            )}
            subLines={[
              { label: "Today", value: String(todayOnline) },
              {
                label: "This Month",
                value: String(
                  stats?.overall_previous_completed_this_month_online_count ??
                    0,
                ),
              },
            ]}
            onClick={() => navigate("/partner/bookings")}
          />

          <DashboardStatCard
            icon="📞"
            label="Offline"
            value={String(
              stats?.overall_previous_completed_offline_bookings_count ?? 0,
            )}
            subLines={[
              { label: "Today", value: String(todayOffline) },
              {
                label: "This Month",
                value: String(
                  stats?.overall_previous_completed_this_month_offline_count ??
                    0,
                ),
              },
            ]}
            onClick={() => navigate("/partner/bookings")}
          />

          <DashboardStatCard
            icon="💳"
            label="Balance"
            value={currency(pendingBalance?.overall_pending ?? 0)}
            subLines={[
              {
                label: "Collected",
                value: currency(stats?.overall_collected_amount ?? 0),
              },
              {
                label: "Pending",
                value: currency(pendingBalance?.overall_pending ?? 0),
              },
            ]}
            onClick={() => navigate("/partner/bookings")}
          />

          <DashboardStatCard
            icon="🗓"
            label="Upcoming"
            value={String(stats?.upcoming_bookings_total_count ?? 0)}
            subLines={[
              {
                label: "Online",
                value: String(stats?.upcoming_bookings_online_count ?? 0),
              },
              {
                label: "Offline",
                value: String(stats?.upcoming_bookings_offline_count ?? 0),
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
                  <span className="pt-dash-recent-title">{b.turf_name}</span>
                  <span className="pt-dash-recent-customer">
                    👤 {b.customer.name}
                  </span>
                </div>
                <span className="pt-dash-recent-date">
                  {b.slots[0]?.date
                    ? new Date(b.slots[0].date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PartnerDashboardPage;