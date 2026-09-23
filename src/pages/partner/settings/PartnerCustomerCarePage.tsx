import React from "react";
import { useNavigate } from "react-router-dom";
import "./PartnerCustomerCarePage.css";

const SUPPORT_PHONE = "+91 9940663099";
const SUPPORT_EMAIL = "bookyourturfinda@gmail.com";
// const OFFICE_ADDRESS =
//   "Old No 57/62, New No 111, 1st Floor, Above KFC, Wallahjah Rd, Ellis Puram, Anna Salai, Triplicane, Chennai, Tamil Nadu - 600002";

const PartnerCustomerCarePage: React.FC = () => {
  const navigate = useNavigate();

  const handleCall = () => {
    window.location.href = `tel:${SUPPORT_PHONE.replace(/\s/g, "")}`;
  };

  const handleEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}`;
  };

  return (
    <div className="pt-cc-page">
      <header className="pt-cc-header">
        <button
          className="pt-cc-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ‹
        </button>
        <div>
          <h1>Customer Care</h1>
          <p>Contact support team</p>
        </div>
      </header>

      <section className="pt-cc-cards">
        <button className="pt-cc-card pt-cc-card-green" onClick={handleCall}>
          <span className="pt-cc-card-icon">📞</span>
          <div className="pt-cc-card-body">
            <span className="pt-cc-card-title">Call Us</span>
            <span className="pt-cc-card-sub">{SUPPORT_PHONE}</span>
          </div>
          <span className="pt-cc-card-arrow">›</span>
        </button>

        <button className="pt-cc-card pt-cc-card-blue" onClick={handleEmail}>
          <span className="pt-cc-card-icon">✉️</span>
          <div className="pt-cc-card-body">
            <span className="pt-cc-card-title">Email Us</span>
            <span className="pt-cc-card-sub">{SUPPORT_EMAIL}</span>
          </div>
          <span className="pt-cc-card-arrow">›</span>
        </button>
      </section>

      {/* <section className="pt-cc-office">
        <h3>Head Office</h3>
        <p>{OFFICE_ADDRESS}</p>
      </section> */}

      {/* <p className="pt-cc-footer">© 2026 Book Your Turf</p> */}
    </div>
  );
};

export default PartnerCustomerCarePage;