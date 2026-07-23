import React, { useEffect, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PickedLocation {
  lat:      string;
  lng:      string;
  address:  string;
  state:    string;
  district: string;
  pincode:  string;
}

interface Props {
  apiKey:           string;
  initialLat?:      string;
  initialLng?:      string;
  onLocationSelect: (loc: PickedLocation) => void;
}

// ─── Declare google global (loaded dynamically) ────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    _mapsLoaded?: boolean;
  }
}

// ─── Load the Maps script once ─────────────────────────────────────────────────
const loadMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window._mapsLoaded && window.google?.maps) {
      resolve();
      return;
    }
    if (document.querySelector('#gmaps-script')) {
      // Script tag exists but not loaded yet — wait for it
      const existing = document.querySelector('#gmaps-script')!;
      existing.addEventListener('load', () => { window._mapsLoaded = true; resolve(); });
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id  = 'gmaps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => { window._mapsLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// ─── Extract address components from geocoder result ──────────────────────────
const extractComponents = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: any[],
): { state: string; district: string; pincode: string } => {
  let state = '', district = '', pincode = '';
  for (const comp of components) {
    const types: string[] = comp.types;
    if (types.includes('administrative_area_level_1')) state    = comp.long_name;
    if (types.includes('administrative_area_level_3') ||
        types.includes('locality'))                   district  = comp.long_name;
    if (types.includes('postal_code'))                pincode   = comp.long_name;
  }
  return { state, district, pincode };
};

// ─── MapPicker ─────────────────────────────────────────────────────────────────

const MapPicker: React.FC<Props> = ({ apiKey, initialLat, initialLng, onLocationSelect }) => {
  const mapRef       = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);
  const [status, setStatus]   = useState<'loading' | 'ready' | 'error'>('loading');
  const [picked, setPicked]   = useState<{ lat: string; lng: string } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );

  useEffect(() => {
    let map:    unknown = null;
    let marker: unknown = null;

    const DEFAULT_CENTER = { lat: 13.0827, lng: 80.2707 }; // Chennai fallback

    loadMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current || !searchRef.current) return;

        const g = window.google.maps;

        const initialCenter = picked
          ? { lat: parseFloat(picked.lat), lng: parseFloat(picked.lng) }
          : DEFAULT_CENTER;

        // Init map
        map = new g.Map(mapRef.current, {
          center: initialCenter,
          zoom: picked ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Init draggable marker (only if we have an initial position)
        if (picked) {
          marker = new g.Marker({
            position: initialCenter,
            map,
            draggable: true,
            title: 'Turf location',
          });
        }

        // Geocoder for reverse lookup
        const geocoder = new g.Geocoder();

        const handleLatLng = (latLng: { lat: () => number; lng: () => number }) => {
          const lat = latLng.lat().toFixed(6);
          const lng = latLng.lng().toFixed(6);

          // Reverse geocode to get address components
          geocoder.geocode({ location: { lat: latLng.lat(), lng: latLng.lng() } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (results: any[], geocoderStatus: string) => {
              if (geocoderStatus === 'OK' && results[0]) {
                const place = results[0];
                const { state, district, pincode } = extractComponents(place.address_components);
                setPicked({ lat, lng });
                onLocationSelect({
                  lat, lng,
                  address: place.formatted_address,
                  state, district, pincode,
                });
              } else {
                setPicked({ lat, lng });
                onLocationSelect({ lat, lng, address: '', state: '', district: '', pincode: '' });
              }
            },
          );
        };

        // Click on map → place/move marker
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).addListener('click', (e: any) => {
          if (!marker) {
            marker = new g.Marker({ position: e.latLng, map, draggable: true, title: 'Turf location' });
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (marker as any).setPosition(e.latLng);
          }
          handleLatLng(e.latLng);
        });

        // Drag marker end
        if (marker) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (marker as any).addListener('dragend', (e: any) => handleLatLng(e.latLng));
        }

        // Places Autocomplete on the search input
        const autocomplete = new g.places.Autocomplete(searchRef.current, {
          fields: ['formatted_address', 'geometry', 'address_components'],
          componentRestrictions: { country: 'in' }, // India only
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const loc = place.geometry.location;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any).setCenter(loc);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any).setZoom(16);

          if (!marker) {
            marker = new g.Marker({ position: loc, map, draggable: true, title: 'Turf location' });
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (marker as any).setPosition(loc);
          }

          const lat = loc.lat().toFixed(6);
          const lng = loc.lng().toFixed(6);
          const { state, district, pincode } = extractComponents(place.address_components ?? []);
          setPicked({ lat, lng });
          onLocationSelect({
            lat, lng,
            address: place.formatted_address ?? '',
            state, district, pincode,
          });
        });

        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="d-flex flex-column gap-3">
      {/* Search box */}
      <div className="input-group">
        <span className="input-group-text">🔍</span>
        <input
          ref={searchRef}
          className="form-control"
          type="text"
          placeholder="Search for the turf location…"
          disabled={status !== 'ready'}
        />
      </div>

      {/* Map container */}
      <div className="position-relative overflow-hidden rounded border" style={{ height: 320 }}>
        {status === 'loading' && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2 bg-light z-1">
            <div className="spinner-border text-success" role="status" />
            <span>Loading map…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-danger-subtle text-danger z-1 p-3 text-center">
            <span>⚠️ Failed to load Google Maps. Check your API key.</span>
          </div>
        )}
        <div ref={mapRef} className="w-100 h-100" />
      </div>

      {/* Picked coordinates readout */}
      {picked && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-0 py-2">
          <span>📍</span>
          <span>{picked.lat}, {picked.lng}</span>
          <span className="small text-secondary">— drag the pin or click to reposition</span>
        </div>
      )}
      {!picked && status === 'ready' && (
        <p className="small text-secondary text-center mb-0">Click on the map or search above to set the turf location.</p>
      )}
    </div>
  );
};

export default MapPicker;
