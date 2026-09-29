// src/components/common/TermsAndConditions.tsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Section {
  title: string;
  body?: string[];
  list?: { items: string[] }[];
}

const SECTIONS: Section[] = [
  {
    title: "Booking Policy",
    list: [
      {
        items: [
          "Users can book available slots for sports listed on the Book Your Turf platform.",
          "Bookings are confirmed based on advance / full payment.",
          "Each booking is valid only for the selected time slot & date mentioned at the time of booking.",
          "Users must arrive 10–15 minutes before the booked slot time to avoid delays.",
          "Playtime starts and ends as per the allotted schedule. Delays cannot be adjusted.",
          "User made bookings only for sports activities. Other activities are subject to venue partner discretion.",
        ],
      },
    ],
  },
  {
    title: "Payment Terms",
    list: [
      {
        items: [
          "All payments must be made through the secure payment gateway integrated into Book Your Turf.",
          "Prices displayed include applicable taxes and convenience charges unless stated otherwise.",
          "The Company or Partner is not responsible for failed payments caused by network or payment gateway issues.",
        ],
      },
    ],
  },
  {
    title: "Cancellation & Refund Policy",
    list: [
      {
        items: [
          "Cancellation allowed up to 6 hours before the slot start time. Refunds will be processed after deducting 5% cancellation charges.",
          "No refund for cancellations made after this window or for no-shows.",
          "Refunds will be processed within 7–10 business days to the original payment method.",
        ],
      },
    ],
  },
  {
    title: "User Responsibilities",
    list: [
      {
        items: [
          "Users must follow all sports venue rules including dress code, footwear, safety measures, etc.",
          "Users must not damage venue property such as nets, lights, grass, mats, or equipment. Any damage will be charged.",
          "Alcohol, smoking, or abusive behavior is strictly prohibited.",
        ],
      },
    ],
  },
  {
    title: "Liability Disclaimer",
    list: [
      {
        items: [
          "Book Your Turf acts as an online booking platform between users and sports venue owners.",
          "The Company is not liable for injuries, accidents, or damages occurring at the venue.",
          "Venue management is solely responsible for on-ground safety, lighting, maintenance, and first aid.",
        ],
      },
    ],
  },
  {
    title: "Prohibited Activities",
    list: [
      {
        items: [
          "Misuse the platform or make fake bookings.",
          "Create multiple accounts to misuse offers.",
          "Use the venue for unlawful, illegal, or unsanctioned activities.",
        ],
      },
    ],
  },
  {
    title: "Data & Privacy",
    list: [
      {
        items: [
          "User information (name, contact, email, booking details) will be used only for booking and communication purposes.",
          "Book Your Turf follows standard data privacy and security practices.",
          "User data will not be sold or shared with third parties without consent.",
        ],
      },
    ],
  },
  {
    title: "Platform Rights",
    list: [
      {
        items: [
          "Book Your Turf reserves the right to modify prices, offers, or venue listings without prior notice.",
          "The Company may suspend or block user accounts involved in fraudulent or inappropriate activity.",
        ],
      },
    ],
  },
  {
    title: "Acceptance",
    body: [
      "By clicking Book Now on Book Your Turf, you confirm that you have read, understood, and accepted these Terms & Conditions.",
    ],
  },
];

const TermsAndConditions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Terms & Conditions · Book Your Turf";
  }, []);

  return (
    <div className="byt-legal">
      <div className="byt-legal__inner">
        <button
          type="button"
          className="byt-legal__back"
          onClick={() => navigate(-1)}
        >
          <span aria-hidden="true">←</span> Back
        </button>

        <header className="byt-legal__head">
          <span className="byt-legal__eyebrow">Legal</span>
          <h1 className="byt-legal__title">Terms &amp; Conditions</h1>
          <p className="byt-legal__intro">
            Welcome to <strong>Book Your Turf</strong>, the online platform that
            helps you easily book your sports venues for Box Cricket, Football,
            Badminton &amp; more.
          </p>
          <p className="byt-legal__intro">
            By accessing or using this platform, you agree to the following
            Terms &amp; Conditions.
          </p>
        </header>

        <div className="byt-legal__body">
          {SECTIONS.map((section, i) => (
            <section key={section.title} className="byt-legal__section">
              <h2 className="byt-legal__section-title">
                <span className="byt-legal__section-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>

              {section.body?.map((p, j) => (
                <p key={j} className="byt-legal__paragraph">
                  {p}
                </p>
              ))}

              {section.list?.map((group, gi) => (
                <div key={gi} className="byt-legal__group">
                  <ul className="byt-legal__list">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>

        <footer className="byt-legal__foot">
          <span className="byt-legal__foot-brand">
            Nottam Infotech Private Limited
          </span>
          <span className="byt-legal__foot-meta">
            Owner of Book Your Turf
          </span>
          <Link to="/" className="byt-legal__foot-link">
            ← Back to home
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default TermsAndConditions;