import React from "react";
import "./BookingConfirmedModal.css";

interface Props {
  bookingId: string;
  customerName: string;
  customerMobile: string;
  turfName: string;
  date: string;
  slots: { start_time_12h: string; end_time_12h: string; is_next_day: boolean }[];
  totalAmount: string;
  paidAmount: string;
  onClose: () => void;
}

const formatWhatsAppDate = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const computePaymentStatus = (
  total: string,
  paid: string,
): "PAID" | "ADVANCE PAID" | "PENDING" => {
  const t = Number(total) || 0;
  const p = Number(paid) || 0;
  if (p <= 0) return "PENDING";
  if (p >= t) return "PAID";
  return "ADVANCE PAID";
};

const BookingConfirmedModal: React.FC<Props> = ({
  bookingId,
  customerName,
  customerMobile,
  turfName,
  date,
  slots,
  totalAmount,
  paidAmount,
  onClose,
}) => {
  const balance = Math.max(
    0,
    Number(totalAmount) - Number(paidAmount || 0),
  );

  const paymentStatus = computePaymentStatus(totalAmount, paidAmount);
  const slotLines = slots
  .slice()
  .sort((a, b) => {
    if (a.is_next_day !== b.is_next_day) return a.is_next_day ? 1 : -1;
    return a.start_time_12h.localeCompare(b.start_time_12h);
  })
  .map((s) =>
    `${s.start_time_12h} - ${s.end_time_12h}${s.is_next_day ? " (Next Day)" : ""}`,
  );

  const handleWhatsApp = () => {
  const lines = [
    `🚨 *BOOK YOUR TURF - BOOKING CONFIRMATION*`,
    ``,
    `📋 *Booking ID:* ${bookingId}`,
    ``,
    `👤 *Customer Details:*`,
    `· *Name:* ${customerName}`,
    `· *Mobile:* ${customerMobile}`,
    ``,
    `📍 *Venue Details:*`,
    `· *Turf:* ${turfName}`,
    `· *Date:* ${formatWhatsAppDate(date)}`,
    ``,
    `⏰ *Time Slots:*`,
    ...slotLines.map((s) => `· ${s}`),
    ``,
    `💰 *Payment Summary:*`,
    `· *Total Amount:* ₹${totalAmount}`,
    `· *Paid Amount:* ₹${paidAmount}`,
    `· *Balance:* ₹${balance.toFixed(2)}`,
    `· *Status:* ${paymentStatus}`,
    ``,
    `✅ *Booking Confirmed!*`,
    `Thank you for choosing Book Your Turf!`,
  ];

  const text = encodeURIComponent(lines.join("\n"));
  const phone = customerMobile.replace(/\D/g, "");
  const waNumber = phone.length === 10 ? `91${phone}` : phone;
  window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank");
  onClose(); // dismiss after firing
};

  return (
    <div className="pt-bc-overlay" onClick={onClose}>
      <div className="pt-bc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Success tick */}
        <div className="pt-bc-icon">✓</div>
        <h2 className="pt-bc-title">Booking Confirmed!</h2>
        <p className="pt-bc-subtitle">Booking confirmed successfully</p>

        {/* Customer details */}
        <div className="pt-bc-customer">
          <div className="pt-bc-customer-row">
            <span className="pt-bc-customer-icon">👤</span>
            <span>{customerName}</span>
          </div>
          <div className="pt-bc-customer-row">
            <span className="pt-bc-customer-icon">📞</span>
            <span>+91 {customerMobile}</span>
          </div>
        </div>

        {/* Booking ID */}
        <div className="pt-bc-id">
          <span className="pt-bc-id-label">Booking ID</span>
          <span className="pt-bc-id-value">{bookingId}</span>
        </div>

        {/* Amounts */}
        <div className="pt-bc-amounts">
          <div className="pt-bc-amount-row">
            <span>Total</span>
            <span className="pt-bc-amount-total">₹{totalAmount}</span>
          </div>
          <div className="pt-bc-amount-row">
            <span>Paid</span>
            <span className="pt-bc-amount-paid">₹{paidAmount}</span>
          </div>
          {balance > 0 && (
            <div className="pt-bc-amount-row pt-bc-balance-row">
              <span>Balance</span>
              <span className="pt-bc-amount-balance">
                ₹{balance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* WhatsApp share */}
        <button className="pt-bc-whatsapp" onClick={handleWhatsApp}>
          <span className="pt-bc-wa-icon">💬</span>
          SHARE VIA WHATSAPP
        </button>

        <button className="pt-bc-close" onClick={onClose}>
          NO THANKS
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmedModal;