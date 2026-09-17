// src/pages/user/ProfilePage.tsx
import { useState, useRef, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext';
import './style/ProfilePage.css';

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatWallet = (val: string | undefined) => {
  const n = parseFloat(val || '0');
  return isNaN(n) ? '0.00' : n.toFixed(2);
};

const getInitials = (name?: string) =>
  (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'U';

// ─── Page ─────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, updateProfile, refreshUserData } = useUserAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.profile_image_url || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Refresh on mount to ensure freshest data ───────────────────────
  useEffect(() => {
    refreshUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync local state when user changes externally ──────────────────
  useEffect(() => {
    if (!isEditing) {
      setName(user?.name || '');
      setEmail(user?.email || '');
      setImagePreview(user?.profile_image_url || null);
      setImageFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Image picker ───────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: max 2MB, image only
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const payload: { name: string; email: string; profile_image?: File } = {
        name: trimmedName,
        email: trimmedEmail,
      };
      if (imageFile) payload.profile_image = imageFile;

      console.log('📤 Updating profile:', {
        ...payload,
        profile_image: imageFile ? imageFile.name : undefined,
      });

      await updateProfile(payload);

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setImageFile(null);

      // Refresh from server to get the new profile_image_url
      await refreshUserData();

      // Auto-hide success toast
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('❌ Update failed:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Cancel edit ────────────────────────────────────────────────────
  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setImageFile(null);
    setImagePreview(user?.profile_image_url || null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-page__empty">
          <i className="bi bi-person-x" />
          <p>Not signed in</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-page__header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information and account details</p>
        </div>
        {!isEditing && (
          <button
            className="profile-page__edit-btn"
            onClick={() => setIsEditing(true)}
          >
            <i className="bi bi-pencil-square" /> Edit Profile
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="profile-page__alert profile-page__alert--error">
          <i className="bi bi-exclamation-circle-fill" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="profile-page__alert profile-page__alert--success">
          <i className="bi bi-check-circle-fill" />
          <span>{success}</span>
        </div>
      )}

      {/* Card */}
      <div className="profile-card">
        {/* Avatar */}
        <div className="profile-card__avatar-wrap">
          <div className="profile-card__avatar">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" />
            ) : (
              <span className="profile-card__avatar-initials">
                {getInitials(user.name)}
              </span>
            )}

            {/* Edit overlay (only when editing) */}
            {isEditing && (
              <button
                type="button"
                className="profile-card__avatar-overlay"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile picture"
              >
                <i className="bi bi-camera-fill" />
                <span>Change</span>
              </button>
            )}
          </div>

          {isEditing && imagePreview && (
            <button
              type="button"
              className="profile-card__avatar-remove"
              onClick={handleRemoveImage}
            >
              <i className="bi bi-trash" /> Remove
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Name + verified badge */}
        <div className="profile-card__name-wrap">
          <h2 className="profile-card__name">
            {user.name || 'Set your name'}
          </h2>
          {user.is_number_verified && (
            <span className="profile-card__verified" title="Phone verified">
              <i className="bi bi-patch-check-fill" /> Verified
            </span>
          )}
        </div>

        <p className="profile-card__sub">
          {user.email || 'Add your email'}
        </p>

        {/* Fields */}
        <div className="profile-card__fields">
          {/* Name */}
          <div className="profile-field">
            <label>
              <i className="bi bi-person" /> Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={80}
              />
            ) : (
              <span className="profile-field__value">
                {user.name || <em className="text-muted">Not set</em>}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="profile-field">
            <label>
              <i className="bi bi-envelope" /> Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={120}
              />
            ) : (
              <span className="profile-field__value">
                {user.email || <em className="text-muted">Not set</em>}
              </span>
            )}
          </div>

          {/* Phone (always read-only) */}
          <div className="profile-field">
            <label>
              <i className="bi bi-telephone" /> Phone Number
              {user.is_number_verified && (
                <span className="profile-field__verified">
                  <i className="bi bi-patch-check-fill" /> Verified
                </span>
              )}
            </label>
            <div className="profile-field__phone">
              <span>{user.number || '—'}</span>
              <span className="profile-field__locked" title="Phone cannot be changed">
                <i className="bi bi-lock-fill" /> Locked
              </span>
            </div>
          </div>

          {/* Referral code */}
          {user.referral_code && (
            <div className="profile-field">
              <label>
                <i className="bi bi-share" /> Referral Code
              </label>
              <div className="profile-field__copy">
                <span>{user.referral_code}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(user.referral_code);
                    setSuccess('Referral code copied');
                    setTimeout(() => setSuccess(null), 2000);
                  }}
                >
                  <i className="bi bi-clipboard" /> Copy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="profile-card__actions">
            <button
              className="profile-card__btn profile-card__btn--ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="profile-card__btn profile-card__btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2" /> Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Wallet summary card */}
      <div className="profile-wallet-card">
        <div className="profile-wallet-card__item">
          <span className="profile-wallet-card__label">Wallet Balance</span>
          <span className="profile-wallet-card__value">
            ₹{formatWallet(user.wallet_balance)}
          </span>
        </div>
        <div className="profile-wallet-card__divider" />
        <div className="profile-wallet-card__item">
          <span className="profile-wallet-card__label">Game Coins</span>
          <span className="profile-wallet-card__value">
            {user.game_coins ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;