// src/components/common/PrivacyPolicy.tsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

interface SectionGroup {
  heading?: string;
  items: string[];
}

const SECTIONS: {
  title: string;
  body?: string[];
  list?: SectionGroup[];
}[] = [
  {
    title: "Information We Collect",
    body: [
      "We collect the following types of information when you use Book Your Turf:",
    ],
    list: [
      {
        heading: "Personal Information",
        items: ["Full Name", "Email Address", "Phone Number", "Profile details (if provided)"],
      },
      {
        heading: "Booking & Transaction Data",
        items: [
          "Turf bookings and schedules",
          "Payment details (processed via secure third-party payment gateways)",
          "Transaction history",
        ],
      },
      {
        heading: "Location Data",
        items: [
          "Approximate or precise location (to show nearby turfs and venues)",
        ],
      },
      {
        heading: "Device & Usage Information",
        items: [
          "Device type, operating system",
          "App usage statistics",
          "Log data (IP address, access times, etc.)",
        ],
      },
      {
        heading: "Optional Information",
        items: [
          "Preferences, interests, and feedback",
          "Responses to surveys or promotional offers",
        ],
      },
    ],
  },
  {
    title: "How We Use Your Information",
    list: [
      {
        items: [
          "To provide and maintain our services",
          "To process bookings and payments securely",
          "To display nearby sports venues and availability",
          "To send booking confirmations and reminders",
          "To improve app functionality and user experience",
          "To provide customer support",
          "To send updates, offers, and promotional notifications (only with consent)",
          "To prevent fraud and ensure platform security",
        ],
      },
    ],
  },
  {
    title: "Payment Information",
    body: [
      "We support secure payment methods including Google Pay (GPay), PhonePe, UPI Payments, Debit/Credit Cards, and Netbanking.",
      "Note: We do not store your sensitive payment details. All transactions are processed securely through trusted third-party payment gateways.",
    ],
  },
  {
    title: "Data Sharing and Disclosure",
    body: [
      "We do not sell, rent, or trade your personal information. We may share your information only in the following cases:",
    ],
    list: [
      {
        items: [
          "With turf owners (only necessary booking details)",
          "With trusted service providers (payment gateways, notification services)",
          "To comply with legal obligations or government requests",
          "To protect our rights, users, and platform security",
        ],
      },
    ],
  },
  {
    title: "Data Security",
    body: [
      "We are committed to ensuring that your information is secure. We implement encryption and secure communication protocols, restricted data access controls, and regular system monitoring.",
      "However, no digital platform can guarantee 100% security.",
    ],
  },
  {
    title: "Cookies and Session Technologies",
    body: [
      "Book Your Turf may use cookies or similar technologies to analyze app usage and performance, improve user experience, and remember preferences. You can control cookie preferences through your device settings.",
      "Our app may contain links to third-party websites or services. Once you leave our app, we are not responsible for the privacy practices of those platforms. We recommend reviewing their privacy policies.",
    ],
  },
  {
    title: "User Rights & Control",
    body: ["You have the right to:"],
    list: [
      {
        items: [
          "Access your personal data",
          "Update or correct your information",
          "Opt out of marketing communications",
          "Delete your account directly from the app",
        ],
      },
    ],
  },
  {
    title: "Data Retention",
    body: [
      "We retain your data only as long as necessary for providing services, legal compliance, and dispute resolution. Once no longer required, your data will be securely deleted.",
    ],
  },
  {
    title: "Children's Privacy",
    body: [
      "Book Your Turf is not intended for users under the age of 13. We do not knowingly collect data from children.",
    ],
  },
  {
    title: "Changes to This Privacy Policy",
    body: [
      "We may update this Privacy Policy from time to time. Changes will be posted within the app, and users are encouraged to review it periodically.",
    ],
  },
  {
    title: "Contact Us",
    body: [
      "If you have any questions or concerns about this Privacy Policy, you can contact us at nottaminfotech@gmail.com.",
    ],
  },
];

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Privacy Policy · Book Your Turf";
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
          <h1 className="byt-legal__title">Privacy Policy</h1>
          <p className="byt-legal__intro">
            Book Your Turf is committed to protecting your privacy and ensuring
            that your personal information is handled in a safe and responsible
            manner. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use the Book Your Turf
            mobile application and related services.
          </p>
          <p className="byt-legal__intro">
            By using our application, you agree to the collection and use of
            information in accordance with this policy.
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
                  {group.heading && (
                    <h3 className="byt-legal__group-heading">
                      {group.heading}
                    </h3>
                  )}
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

export default PrivacyPolicy;