import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { partnerAuthApi } from "../../../api/partner/auth";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import "../settings/PartnerEditProfilePage.css";

const PartnerEditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { partner, updatePartner } = usePartnerAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(partner?.name ?? "");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    partner?.profile_image_url ?? null,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB");
      return;
    }
    setProfileImage(f);
    setPreviewUrl(URL.createObjectURL(f));
    e.target.value = "";
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return null;
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    try {
      const res = await partnerAuthApi.updateProfile({
        name: name.trim(),
        profile_image: profileImage,
      });
      updatePartner(res.data);
      setSuccess("Profile updated successfully");
      setProfileImage(null);
      setTimeout(() => navigate("/partner/profile"), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || "P")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="pt-ep-page">
      <header className="pt-ep-header">
        <button
          className="pt-ep-back"
          onClick={() => navigate("/partner/settings/account-preferences")}
          aria-label="Back"
        >
          ‹
        </button>
        <div>
          <h1>Edit Profile</h1>
          <p>Update your personal info</p>
        </div>
      </header>

      {error && <div className="pt-auth-error">{error}</div>}
      {success && <div className="pt-success-banner">{success}</div>}

      {/* Avatar */}
      <section className="pt-ep-avatar-section">
        <button
          className="pt-ep-avatar"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          aria-label="Change profile photo"
          disabled={saving}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="profile" />
          ) : (
            <span>{initials}</span>
          )}
          <span className="pt-ep-avatar-overlay">
            <span className="pt-ep-avatar-cam">📷</span>
          </span>
        </button>
        <p className="pt-ep-avatar-hint">Tap to change photo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFilePick}
        />
      </section>

      {/* Form */}
      <section className="pt-ep-form">
        <div className="pt-ep-field">
          <label className="pt-ep-label">Full Name</label>
          <input
            className="pt-ep-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            disabled={saving}
          />
        </div>

        <div className="pt-ep-field">
          <label className="pt-ep-label">Email Address</label>
          <input
            className="pt-ep-input pt-ep-input-readonly"
            type="email"
            value={partner?.email ?? ""}
            readOnly
            disabled
          />
          <span className="pt-ep-hint">
            Contact support to change your email
          </span>
        </div>

        <div className="pt-ep-field">
          <label className="pt-ep-label">Mobile Number</label>
          <input
            className="pt-ep-input pt-ep-input-readonly"
            type="tel"
            value={partner?.number ?? ""}
            readOnly
            disabled
          />
          <span className="pt-ep-hint">
            Contact support to change your mobile number
          </span>
        </div>

        <button
          className="pt-ep-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </section>
    </div>
  );
};

export default PartnerEditProfilePage;