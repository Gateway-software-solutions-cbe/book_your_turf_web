
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../../asset/cp.jpeg';
import "./style/partnerAuth.css";

const PartnerAuthLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="pt-auth-container pt-choice-container">
      {/* Animated sports arena background */}
      <div className="pt-arena-background" aria-hidden="true">
        <div className="pt-arena-glow pt-arena-glow-one" />
        <div className="pt-arena-glow pt-arena-glow-two" />
        <div className="pt-arena-grid" />
        <div className="pt-arena-circle" />

        <div className="pt-arena-field">
          <div className="pt-field-center-circle" />
          <div className="pt-field-center-line" />
          <div className="pt-field-box pt-field-box-left" />
          <div className="pt-field-box pt-field-box-right" />
        </div>

        <div className="pt-floating-ball pt-ball-one">⚽</div>
        <div className="pt-floating-ball pt-ball-two">⚽</div>
      </div>

      <section className="pt-choice-layout">
        {/* Left branding section */}
        <aside className="pt-choice-brand">
          <div className="pt-brand-topline">
            <span className="pt-brand-live-dot" />
            <span>BOOK YOUR GAME. OWN YOUR ARENA.</span>
          </div>

          {/* Actual BookYourTurf logo */}
          <div className="pt-choice-logo">
            <img
              src={logo}
              alt="BookYourTurf logo"
            />
          </div>

          <div className="pt-brand-copy">
            <span className="pt-brand-eyebrow">
              <span className="pt-eyebrow-line" />
              PARTNER CENTRAL
            </span>

            <h1 className="pt-choice-title">
              Your turf.
              <br />
              Your business.
              <br />
              <span>Your game.</span>
            </h1>

            <p className="pt-choice-subtitle">
              Manage bookings, grow your venue, and bring
              more players to your turf — all in one place.
            </p>
          </div>

          {/* Partner benefits */}
          <div className="pt-brand-feature">
            <div className="pt-feature-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 19V9m5 10V5m5 14v-7m5 7V3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <strong>Built for your business</strong>
              <span>Bookings, availability and more.</span>
            </div>
          </div>

          <div className="pt-brand-feature">
            <div className="pt-feature-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3 4.5 6v5.5c0 4.6 3.2 7.7 7.5 9.5 4.3-1.8 7.5-4.9 7.5-9.5V6L12 3Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="m9 12 2 2 4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <strong>One partner platform</strong>
              <span>Everything you need to get started.</span>
            </div>
          </div>

          <div className="pt-brand-bottom">
            <span className="pt-brand-bottom-line" />
            <span>PLAY MORE. GROW MORE.</span>
          </div>
        </aside>

        {/* Right authentication section */}
        <section className="pt-choice-panel">
          <div className="pt-choice-card">

            <div className="pt-choice-mobile-logo">
              <img
                src="/src/asset/cp.jpeg"
                alt="BookYourTurf logo"
              />
            </div>

            <div className="pt-choice-heading">
              <span className="pt-choice-kicker">
                <span className="pt-status-dot" />
                WELCOME TO THE TEAM
              </span>

              <h2 className="pt-panel-title">
                Welcome, Partner!
              </h2>

              <p className="pt-panel-subtitle">
                Ready to take your turf business to the next
                level? Choose how you'd like to continue.
              </p>
            </div>

            {/* Authentication actions */}
            <div className="pt-choice-actions">

              <button
                type="button"
                className="pt-choice-btn pt-choice-btn-primary"
                onClick={() => navigate("/partner/phone-auth")}
              >
                <span className="pt-choice-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="10"
                      cy="7"
                      r="4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M19 8v6m-3-3h6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <span className="pt-choice-btn-copy">
                  <strong>New Partner</strong>
                  <small>Register your turf business</small>
                </span>

                <span className="pt-choice-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              <button
                type="button"
                className="pt-choice-btn pt-choice-btn-outline"
                onClick={() => navigate("/partner/login")}
              >
                <span className="pt-choice-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M10 17l5-5-5-5m5 5H3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <span className="pt-choice-btn-copy">
                  <strong>Existing Partner</strong>
                  <small>Sign in to manage your venue</small>
                </span>

                <span className="pt-choice-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

            </div>

            {/* Trust section */}
            <div className="pt-choice-divider">
              <span />
              <small>YOUR GAME STARTS HERE</small>
              <span />
            </div>

            <div className="pt-choice-trust">
              <span className="pt-trust-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 3 4.5 6v5.5c0 4.6 3.2 7.7 7.5 9.5 4.3-1.8 7.5-4.9 7.5-9.5V6L12 3Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span>
                <strong>Your venue, your control</strong>
                <small>
                  A dedicated space for BookYourTurf partners.
                </small>
              </span>
            </div>

            {/* Company footer */}
            <footer className="pt-choice-footer">
              <span>OWNED &amp; OPERATED BY</span>
              <strong>Nottam Infotech Private Limited</strong>
              <small>
                © {new Date().getFullYear()} BookYourTurf.
                All rights reserved.
              </small>
            </footer>

          </div>
        </section>
      </section>
    </main>
  );
};

export default PartnerAuthLanding;