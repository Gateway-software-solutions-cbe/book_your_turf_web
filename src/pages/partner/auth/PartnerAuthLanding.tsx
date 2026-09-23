import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style/partnerAuth.css";

const PartnerAuthLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-auth-container pt-choice-container">
      <div className="pt-choice-card">
        <div className="pt-choice-logo">
          <img src="/src/asset/bytlogo.png" alt="BookYourTurf" />
        </div>

        <h1 className="pt-choice-title">Welcome Partner!</h1>
        <p className="pt-choice-subtitle">Manage your turf business effortlessly</p>

        <button
          className="pt-choice-btn pt-choice-btn-primary"
          onClick={() => navigate("/partner/phone-auth")}
        >
          <span className="pt-choice-icon">👤+</span>
          <span>New Partner</span>
          <span className="pt-choice-arrow">›</span>
        </button>

        <button
          className="pt-choice-btn pt-choice-btn-outline"
          onClick={() => navigate("/partner/login")}
        >
          <span className="pt-choice-icon">→]</span>
          <span>Existing Partner</span>
          <span className="pt-choice-arrow">›</span>
        </button>

        <div className="pt-choice-footer">
          <p className="pt-choice-owned">Owned by</p>
          <p className="pt-choice-company">Nottam Infotech Private Limited</p>

          {/* <div className="pt-choice-divider" />

          <p className="pt-choice-note">
            For players: Download our exclusive player app
          </p>

          <div className="pt-choice-stores">
            <a href="#" className="pt-store-btn" aria-label="Play Store">
              <span>🤖</span>
            </a>
            <a href="#" className="pt-store-btn" aria-label="App Store">
              <span>🍎</span>
            </a>
          </div>
          <div className="pt-store-labels">
            <span>Play Store</span>
            <span>App Store</span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default PartnerAuthLanding;