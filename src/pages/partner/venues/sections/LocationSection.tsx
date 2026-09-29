import React, { useState } from "react";
import MapPicker, { PickedLocation } from "../../../admin/MapPicker";

interface Props {
  address: string;
  latitude: number | null;
  longitude: number | null;
  state: string;
  district: string;
  pincode: string;
  onChange: (patch: Partial<{
    address: string;
    latitude: number | null;
    longitude: number | null;
    state: string;
    district: string;
    pincode: string;
  }>) => void;
}

// Read Google Maps API key from env (Vite or CRA)
const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== "undefined" &&
    // @ts-ignore
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
  (typeof process !== "undefined" &&
    process.env?.REACT_APP_GOOGLE_MAPS_API_KEY) ||
  "";

const LocationSection: React.FC<Props> = ({
  address,
  latitude,
  longitude,
  state,
  district,
  pincode,
  onChange,
}) => {
  const [mapOpen, setMapOpen] = useState(false);

  // Admin MapPicker emits { lat: string, lng: string, address, state, district, pincode }
  const handlePicked = (loc: PickedLocation) => {
    onChange({
      address: loc.address || address,
      latitude: Number(loc.lat) || null,
      longitude: Number(loc.lng) || null,
      state: loc.state || state,
      district: loc.district || district,
      pincode: loc.pincode || pincode,
    });
    setMapOpen(false);
  };

  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">📍</span>
        <div>
          <h3>Location</h3>
          <p>Tap map to pin your venue</p>
        </div>
      </header>

      <button
        type="button"
        className="pt-map-picker-trigger"
        onClick={() => setMapOpen(true)}
      >
        <span className="pt-map-picker-icon">🗺</span>
        <span>
          {latitude != null && longitude != null
            ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            : "Tap to select location on map"}
        </span>
        <span className="pt-map-picker-btn">Map</span>
      </button>

      <div className="pt-field">
        <label className="pt-field-label">Full Address</label>
        <textarea
          className="pt-input pt-textarea"
          placeholder="Street, area, landmark"
          value={address}
          onChange={(e) => onChange({ address: e.target.value })}
        />
      </div>

      <div className="pt-grid-2">
        <div className="pt-field">
          <label className="pt-field-label">State</label>
          <input
            className="pt-input"
            placeholder="Select state"
            value={state}
            onChange={(e) => onChange({ state: e.target.value })}
          />
        </div>

        <div className="pt-field">
          <label className="pt-field-label">District</label>
          <input
            className="pt-input"
            placeholder="Select district"
            value={district}
            onChange={(e) => onChange({ district: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-field">
        <label className="pt-field-label">Pincode</label>
        <input
          className="pt-input"
          placeholder="e.g. 600075"
          maxLength={6}
          inputMode="numeric"
          value={pincode}
          onChange={(e) =>
            onChange({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })
          }
        />
      </div>

      {/* Modal wrapper for the inline MapPicker */}
      {mapOpen && (
        <div
          className="pt-map-modal-overlay"
          onClick={() => setMapOpen(false)}
        >
          <div
            className="pt-map-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="pt-map-modal-header">
              <h3>Pick Venue Location</h3>
              <button
                type="button"
                className="pt-map-modal-close"
                onClick={() => setMapOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <div className="pt-map-modal-body">
              {GOOGLE_MAPS_API_KEY ? (
                <MapPicker
                  apiKey={GOOGLE_MAPS_API_KEY}
                  initialLat={latitude != null ? String(latitude) : undefined}
                  initialLng={longitude != null ? String(longitude) : undefined}
                  onLocationSelect={handlePicked}
                />
              ) : (
                <div className="pt-auth-error">
                  Google Maps API key is missing. Set{" "}
                  <code>VITE_GOOGLE_MAPS_API_KEY</code> in your env file.
                </div>
              )}
            </div>

            <footer className="pt-map-modal-footer">
              <button
                type="button"
                className="pt-btn-outline-otp"
                onClick={() => setMapOpen(false)}
              >
                Done
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
};

export default LocationSection;