// src/pages/Landing.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  ShieldCheck,
  Wallet,
  Gift,
  ChevronDown,
  Star,
} from "lucide-react";
import MagneticButton from "./MagneticButton";
import { QRCodeSVG } from "qrcode.react";
import logo from "../../asset/bytlogo.png"
import "./landing.css";
import LogoAnimation from "../3d/LogoAnimation";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Turfs", href: "#turfs" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Partners", href: "#partners" },
  { label: "Contact", href: "#contact" },
];

const CITIES = [
  "Andhra Pradesh",
  "Gujarat",
  "Karnataka",
  "Kerala",
  "Keralam",
  "Puducherry",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

const STEPS = [
  {
    number: "01",
    title: "Find your turf",
    body: "Search by location, sport, or venue.",
  },
  {
    number: "02",
    title: "Pick a slot",
    body: "Lock in the exact hour you want.",
  },
  {
    number: "03",
    title: "Pay and play",
    body: "Instant confirmation. Just show up.",
  },
];

const STATS = [
  { label: "Registered Sports Venues", value: 577, suffix: "+" },
  { label: "States live in", value: 5, suffix: "" },
  { label: "Upcoming States live in", value: 5, suffix: "+" },
  { label: "Cities live in", value: 217, suffix: "+" },
  { label: "Matches booked", value: 15400, suffix: "+" },
  { label: "Avg. booking time", value: 45, suffix: "sec" },
];

const CARDS = [
  {
    name: "FF Turf",
    city: "Chennai",
    time: "6:00 AM – 6:00 AM",
    price: "₹650/hr",
    rating: "4.6",
  },
  {
    name: "Dusa Pickleball",
    city: "Madurai",
    time: "6:00 AM – 11:00 PM",
    price: "₹600/hr",
    rating: "4.6",
  },
  {
    name: "Kickoff Grounds",
    city: "Coimbatore",
    time: "Available now",
    price: "₹900/hr",
    rating: "4.9",
  },
];

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target]);
  return value;
}

function StatTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = useCountUp(value, active);

  return (
    <div className="byt-stat-tile" ref={ref}>
      <span className="byt-stat-tile__value">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="byt-stat-tile__label">{label}</span>
    </div>
  );
}

function CountdownBadge() {
  const [timeLeft, setTimeLeft] = useState<{ mm: string; ss: string }>({
    mm: "00",
    ss: "00",
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const updateCountdown = () => {
      const now = new Date();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();

      const slotIntervalMinutes = 60; // Change to 15, 30, 60 etc. to fix the hours

      // Calculate next slot time
      const minutesToNextSlot =
        slotIntervalMinutes - (currentMinutes % slotIntervalMinutes);
      const totalSecondsLeft = minutesToNextSlot * 60 - currentSeconds;

      const mm = String(Math.floor(totalSecondsLeft / 60)).padStart(2, "0");
      const ss = String(totalSecondsLeft % 60).padStart(2, "0");

      setTimeLeft({ mm, ss });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="byt-countdown-badge" aria-hidden="true">
      <span className="byt-countdown-badge__dot" />
      Next slot in {timeLeft.mm}:{timeLeft.ss}
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleMenuRef.current &&
        !roleMenuRef.current.contains(event.target as Node)
      ) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="byt-landing">
      <div className="byt-ticker" aria-hidden="true">
        <div className="byt-ticker__track">
          {[...CITIES, ...CITIES].map((city, i) => (
            <span className="byt-ticker__item" key={`${city}-${i}`}>
              <span className="byt-ticker__dot" />
              Live in {city}
            </span>
          ))}
        </div>
      </div>

      <header className={`byt-header ${scrolled ? "byt-header--solid" : ""}`}>
        <div className="byt-header__inner">
          <Link to="/" className="byt-logo" aria-label="Book Your Turf home">
  <LogoAnimation size={80} />
</Link>

          <nav
            className={`byt-nav ${mobileNavOpen ? "byt-nav--open" : ""}`}
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="byt-header__actions" ref={roleMenuRef}>
            <MagneticButton
              className="byt-btn byt-btn--primary"
              onClick={() => setRoleMenuOpen((open) => !open)}
            >
              Sign in / Sign up
              <ChevronDown
                size={16}
                style={{ marginLeft: 6 }}
                aria-hidden="true"
              />
            </MagneticButton>

            <AnimatePresence>
              {roleMenuOpen && (
                <motion.div
                  className="byt-role-menu"
                  role="menu"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigate("/phone-auth")}
                  >
                    <span className="byt-role-menu__title">
                      Continue as User
                    </span>
                    <span className="byt-role-menu__sub">
                      Book turfs, track your wallet and game coins
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigate("/partner/auth")}
                  >
                    <span className="byt-role-menu__title">
                      Continue as Channel Partner
                    </span>
                    <span className="byt-role-menu__sub">
                      List your turf and manage bookings
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              className="byt-nav-toggle"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileNavOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="byt-hero" id="home">
          <div className="byt-hero__panel byt-hero__panel--dark">
            <motion.p
              className="byt-eyebrow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Turf booking, without the phone calls
            </motion.p>

            <motion.h1
              className="byt-hero__title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Own the pitch.
              <br />
              Book it in seconds.
            </motion.h1>

            <motion.p
              className="byt-hero__body"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Real-time slots, secure payments, and a wallet that remembers your
              game.
            </motion.p>

            <motion.div
              className="byt-hero__cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <MagneticButton
                as="button"
                onClick={() => setRoleMenuOpen((open) => !open)}
                className="byt-btn byt-btn--accent byt-btn--lg"
              >
                Find a turf near you
              </MagneticButton>
              <MagneticButton
                as="a"
                href="#how-it-works"
                className="byt-btn byt-btn--ghost byt-btn--lg"
              >
                See how it works
              </MagneticButton>
            </motion.div>

            <div className="byt-stores">
              <a
                href="https://play.google.com/store/apps/details?id=com.bookyourturf.app"
                target="_blank"
                rel="noopener noreferrer"
                className="byt-store-badge"
              >
                <div className="byt-qr">
                  <QRCodeSVG
                    value="https://play.google.com/store/apps/details?id=com.bookyourturf.app"
                    size={120}
                    level="H"
                  />
                </div>
                <div className="byt-store-badge__text">
                  <span className="byt-store-badge__eyebrow">Get it on</span>
                  <span className="byt-store-badge__name">Google Play</span>
                </div>
              </a>

              <a
                href="https://apps.apple.com/in/app/bookyourturf/id6756934347"
                target="_blank"
                rel="noopener noreferrer"
                className="byt-store-badge"
              >
                <div className="byt-qr">
                  <QRCodeSVG
                    value="https://apps.apple.com/in/app/bookyourturf/id6756934347"
                    size={120}
                    level="H"
                  />
                </div>
                <div className="byt-store-badge__text">
                  <span className="byt-store-badge__eyebrow">
                    Download on the
                  </span>
                  <span className="byt-store-badge__name">App Store</span>
                </div>
              </a>
            </div>
          </div>

          <div className="byt-hero__panel byt-hero__panel--light">
            <CountdownBadge />
            <div className="byt-card-stack">
              {CARDS.map((card, i) => (
                <motion.div
                  className="byt-turf-card"
                  key={card.name}
                  style={{ zIndex: CARDS.length - i }}
                  initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? -4 : 4 }}
                  animate={{
                    opacity: 1,
                    y: [0, -6, 0],
                    rotate: i % 2 === 0 ? -3 : 3,
                  }}
                  transition={{
                    opacity: { duration: 0.5, delay: i * 0.15 },
                    y: {
                      duration: 4 + i,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    },
                  }}
                >
                  <div className="byt-turf-card__top">
                    <span className="byt-turf-card__name">{card.name}</span>
                    <span className="byt-turf-card__rating">
                      <Star size={12} fill="currentColor" aria-hidden="true" />{" "}
                      {card.rating}
                    </span>
                  </div>
                  <span className="byt-turf-card__city">{card.city}</span>
                  <div className="byt-turf-card__bottom">
                    <span>{card.time}</span>
                    <span className="byt-turf-card__price">{card.price}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="byt-section byt-rail" id="how-it-works">
          <div className="byt-section__inner">
            <motion.h2
              className="byt-section__title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              Three steps. No back-and-forth.
            </motion.h2>

            <div className="byt-rail__track">
              <div className="byt-rail__line" />
              {STEPS.map((step, i) => (
                <motion.div
                  className="byt-rail__stop"
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <span className="byt-rail__marker">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="byt-section byt-bento" id="partners">
          <div className="byt-section__inner">
            <motion.h2
              className="byt-section__title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              Built around how you actually play
            </motion.h2>

            <div className="byt-bento__grid" id="turfs">
              <motion.div
                className="byt-bento__tile byt-bento__tile--big"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <div className="byt-bento__icon">
                  <Wallet size={22} aria-hidden="true" />
                </div>
                <h3>Wallet and game coins</h3>
                <p>
                  Every match earns coins. Every refund lands straight in your
                  wallet — no waiting on support tickets.
                </p>
              </motion.div>

              <motion.div
                className="byt-bento__tile byt-bento__tile--instant"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.08 }}
              >
                <div className="byt-bento__icon">
                  <Zap size={20} aria-hidden="true" />
                </div>
                <h3>Instant booking</h3>
                <p>Slots update live.</p>
              </motion.div>

              <motion.div
                className="byt-bento__tile byt-bento__tile--secure"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.16 }}
              >
                <div className="byt-bento__icon">
                  <ShieldCheck size={20} aria-hidden="true" />
                </div>
                <h3>Secure payments</h3>
                <p>Card, UPI, or wallet.</p>
              </motion.div>

              <motion.div
                className="byt-bento__tile byt-bento__tile--referral"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.24 }}
              >
                <div className="byt-bento__icon">
                  <Gift size={20} aria-hidden="true" />
                </div>
                <h3>Referral rewards</h3>
                <p>
                  Share your code. When your friends play, you both earn credit.
                </p>
              </motion.div>

              <div className="byt-bento__tile byt-bento__tile--stats">
                {STATS.map((stat) => (
                  <StatTile key={stat.label} {...stat} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="byt-cta-banner">
          <div className="byt-cta-banner__inner">
            <h2>Ready for kickoff?</h2>
            <p>Download the app and book your first slot in under a minute.</p>
            <div className="byt-cta-banner__actions">
              <MagneticButton
                as="a"
                href="/phone-auth"
                onClick={() => navigate("/phone-auth")}
                className="byt-btn byt-btn--accent byt-btn--lg"
              >
                Create your account
              </MagneticButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="byt-footer" id="contact">
        <div className="byt-footer__inner">
          <div className="byt-footer__col">
            <h3 className="byt-footer__brand">BookYourTurf</h3>
            <p>
              BookYourTurf is a complete digital platform designed to simplify
              turf management and player booking with real-time availability,
              seamless payments, and automation.
            </p>
            <h4 className="byt-footer__quicklinks-heading">Quick links</h4>
            <ul>
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <Link to="/admin/login">Admin panel</Link>
              </li>
              {/* <li>
                <Link to="/login">Login</Link>
              </li> */}
            </ul>
          </div>

          <div className="byt-footer__col byt-footer__col--contact">
            <h4>Contact</h4>
            <div className="byt-footer__contact-grid">
              <div>
                <p className="byt-footer__label">Email</p>
                <ul>
                  <li>
                    <a href="mailto:nottaminfotech@gmail.com">
                      nottaminfotech@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="mailto:bookyourturfindia@gmail.com">
                      bookyourturfindia@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="mailto:bookyourturfmdu@gmail.com">
                      bookyourturfmdu@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="byt-footer__label">Customer care</p>
                <p>
                  +91 9940663099 &middot;{" "}
                  <a href="mailto:contact@bookyourturf.net">
                    contact@bookyourturf.net
                  </a>
                </p>
                <p className="byt-footer__label">Support</p>
                <p>
                  +91 9566001173 &middot;{" "}
                  <a href="mailto:support@bookyourturf.net">
                    support@bookyourturf.net
                  </a>
                </p>
                <p className="byt-footer__label">Admin</p>
                <p>
                  +91 9940990688 &middot;{" "}
                  <a href="mailto:accounts@bookyourturf.net">
                    accounts@bookyourturf.net
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="byt-footer__col">
            <h4>Offices</h4>
            <p className="byt-footer__label">Head office, Chennai</p>
            <p>
              Old No 57/62, New No 111, 1st Floor, Above KFC, Wallahjah Rd,
              Ellis Puram, Anna Salai, Triplicane, Chennai, Tamil Nadu - 600002
            </p>
            <p className="byt-footer__label">Corporate office, Madurai</p>
            <p>
              Plot no: 200 Old LIG Colony, KK Nagar, Madurai, Tamil Nadu -
              625020
            </p>
          </div>
        </div>

        <div className="byt-footer__bottom">
          <span>
            Developed by Gateway Software Solutions
          </span>
          <span>
            &copy; {new Date().getFullYear()} BookYourTurf. All rights reserved.
          </span>
          <div className="byt-footer__bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="byt-footer__bottom-sep" aria-hidden="true">
              ·
            </span>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
