import React, { useState } from "react";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { partnerAuthApi } from "../../api/partner/auth";
import "./CompleteProfileModal.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  dismissible?: boolean; // if false, close (X) button is hidden
}

const CompleteProfileModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  dismissible = true,
}) => {
  const { partner, updatePartner } = usePartnerAuth();
  const [name, setName] = useState(partner?.name || "");
  const [email, setEmail] = useState(partner?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setError("");
    if (!name.trim()) return setError("Please enter your full name");
    if (!email.trim()) return setError("Please enter a valid email");
    if (password.length < 4) return setError("Password must be at least 4 characters");

    setLoading(true);
    try {
      const res = await partnerAuthApi.updateProfile({
        name: name.trim(),
        email: email.trim(),
        number: partner?.number,
        password,
      });
      updatePartner(res.data);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-modal-overlay" onClick={dismissible ? onClose : undefined}>
      <div className="pt-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="pt-modal-handle" />

        <div className="pt-modal-header">
          <div className="pt-modal-title-wrap">
            <span className="pt-modal-title-icon">📍</span>
            <h3>Complete Your Profile</h3>
          </div>
          {dismissible && (
            <button className="pt-modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <p className="pt-modal-desc">
          Add your name, email and password to start adding turfs.
        </p>

        {error && <div className="pt-auth-error">{error}</div>}

        <div className="pt-modal-form">
          <div className="pt-modal-input-wrap">
            <span className="pt-modal-input-icon">👤</span>
            <input
              className="pt-modal-input"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="pt-modal-input-wrap">
            <span className="pt-modal-input-icon">✉</span>
            <input
              className="pt-modal-input"
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="pt-modal-input-wrap">
            <span className="pt-modal-input-icon">🔒</span>
            <input
              className="pt-modal-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="pt-modal-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password"
            >
              {showPassword ? "🙈" : "🚫"}
            </button>
          </div>

          <button
            className="pt-modal-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfileModal;