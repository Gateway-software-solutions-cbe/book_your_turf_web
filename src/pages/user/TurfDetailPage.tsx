// src/pages/user/TurfDetailPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { listTurfs } from '../../api/user/turfs';
import type { Turf } from '../../types/user/turf';
import { metaViewContent } from '../../lib/metaPixel';
import './style/TurfDetailPage.css';

// ─── Image Slider Component ──────────────────────────────────────────────
interface ImageSliderProps {
  images: string[];      // ✅ Turf.images is string[]
  name: string;
}

const ImageSlider = ({ images, name }: ImageSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const validImages = images?.filter(Boolean) || [];
  const imageList =
    validImages.length > 0
      ? validImages
      : ['https://placehold.co/800x500/0b1f1a/1fa463?text=BYT'];

  useEffect(() => {
    if (isAutoPlaying && imageList.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
      }, 4000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, imageList.length]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  return (
    <div
      className="turf-detail__slider"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="turf-detail__slider-track">
        {imageList.map((img, index) => (
          <div
            key={index}
            className={`turf-detail__slide ${index === currentIndex ? 'active' : ''}`}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            <img src={img} alt={`${name} - ${index + 1}`} loading="lazy" />
          </div>
        ))}
      </div>

      {imageList.length > 1 && (
        <>
          <button
            className="turf-detail__slider-btn turf-detail__slider-btn--prev"
            onClick={goToPrevious}
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            className="turf-detail__slider-btn turf-detail__slider-btn--next"
            onClick={goToNext}
          >
            <i className="bi bi-chevron-right" />
          </button>

          <div className="turf-detail__slider-dots">
            {imageList.map((_, index) => (
              <button
                key={index}
                className={`turf-detail__slider-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="turf-detail__slider-counter">
            {currentIndex + 1} / {imageList.length}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Amenity Item Component ──────────────────────────────────────────────
interface AmenityItemProps {
  icon: string;
  label: string;
  available: boolean;
}

const AmenityItem = ({ icon, label, available }: AmenityItemProps) => (
  <div className={`amenity-item ${available ? 'available' : 'unavailable'}`}>
    <i className={`bi bi-${icon}`} />
    <span>{label}</span>
  </div>
);

// ─── Stat Item Component ──────────────────────────────────────────────────
interface StatItemProps {
  label: string;
  value: string | number;
  icon?: string;
}

const StatItem = ({ label, value, icon }: StatItemProps) => (
  <div className="stat-item">
    {icon && <i className={`bi bi-${icon}`} />}
    <div>
      <span className="stat-item__label">{label}</span>
      <span className="stat-item__value">{value}</span>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────

const TurfDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserAuth();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTurfDetail = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const state = location.state as { turf?: Turf } | null;
        if (state?.turf && state.turf.id === parseInt(id)) {
          console.log('📥 Using turf data from navigation state');
          setTurf(state.turf);
          setLoading(false);
          return;
        }

        console.log('📤 Fetching turf details from API...');
        const response = await listTurfs({ search: String(id), page_size: 50 });

        if (response.result === 'success' && response.data) {
          const foundTurf = response.data.results.find((t) => t.id === parseInt(id));
          if (foundTurf) {
            setTurf(foundTurf);
          } else {
            setError('Turf not found');
          }
        } else {
          setError(response.message || 'Failed to load turf details');
        }
      } catch (err: any) {
        console.error('❌ Failed to fetch turf details:', err);
        setError(err.response?.data?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchTurfDetail();
  }, [id, location.state]);

  useEffect(() => {
  if (!turf) return;

  metaViewContent({
    turf_id: turf.id,
    turf_name: turf.name,
    sport: turf.game_type,
  });

  if (import.meta.env.DEV) {
    console.log('[Meta Pixel] ViewContent → Turf Detail', {
      turf_id: turf.id,
      turf_name: turf.name,
    });
  }
}, [turf]);

  const formatTime = (time: string | null): string => {
    if (!time) return 'Not specified';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getTimeDisplay = (
    openTime: string | null,
    closeTime: string | null
  ): { display: string; isNextDay: boolean } => {
    if (!openTime || !closeTime) {
      return { display: 'Not specified', isNextDay: false };
    }
    const open = formatTime(openTime);
    const close = formatTime(closeTime);
    if (openTime === closeTime) {
      return { display: '24 hours', isNextDay: false };
    }
    const openHour = parseInt(openTime.split(':')[0]);
    const closeHour = parseInt(closeTime.split(':')[0]);
    const isNextDay =
      closeHour < openHour || (closeHour === openHour && closeTime > openTime);
    return {
      display: `${open} - ${close}${isNextDay ? ' (Next Day)' : ''}`,
      isNextDay,
    };
  };

  const getCourtLabel = (gameType: string): string => {
    const type = gameType?.toLowerCase() || '';
    if (type.includes('badminton') || type.includes('pickleball')) {
      return 'Courts';
    }
    return 'Turfs';
  };

  const getSportTags = (gameType: string): string[] => {
    if (!gameType) return ['Multi-sport'];
    return gameType.split('&').map((s) => s.trim()).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="turf-detail__loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading turf details...</p>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="turf-detail__error">
        <i className="bi bi-exclamation-triangle-fill" />
        <h3>Failed to load turf details</h3>
        <p>{error || 'Turf not found'}</p>
        <button
          className="btn btn-outline-success rounded-pill"
          onClick={() => navigate('/turfs')}
        >
          <i className="bi bi-arrow-left me-1" />
          Back to Turfs
        </button>
      </div>
    );
  }

  const isVerified = turf.type === 'real' && turf.status === 'Approved';
  const courtLabel = getCourtLabel(turf.game_type);
  const timeInfo = getTimeDisplay(turf.open_time, turf.close_time);
  const sportTags = getSportTags(turf.game_type);

  const amenities = turf.facilities
    ? [
        { icon: 'car-front', label: 'Parking', available: turf.facilities.parking },
        { icon: 'door-open', label: 'Rest room', available: turf.facilities['Rest room'] },
        { icon: 'dribbble', label: 'Sports kits', available: turf.facilities['Sports kits'] },
        { icon: 'person', label: 'Dressing room', available: turf.facilities['Dressing room'] },
        { icon: 'music-note', label: 'Music systems', available: turf.facilities['Music systems'] },
        { icon: 'cup-hot', label: 'Drinking water', available: turf.facilities['Drinking water'] },
        { icon: 'wifi', label: 'WiFi', available: turf.facilities.wifi },
        { icon: 'cctv', label: 'CCTV', available: turf.facilities.CCTV },
      ].filter((a) => a.available)
    : [];

  return (
    <div className="turf-detail">
      <button className="turf-detail__back-btn" onClick={() => navigate('/turfs')}>
        <i className="bi bi-arrow-left" />
        Back to Turfs
      </button>

      {/* ✅ turf.images is string[] */}
      <ImageSlider images={turf.images} name={turf.name} />

      <div className="turf-detail__content">
        <div className="turf-detail__header">
          <div className="turf-detail__name-section">
            <h1 className="turf-detail__name">{turf.name}</h1>
            {isVerified && (
              <span className="turf-detail__verified-badge">
                <i className="bi bi-check-circle-fill" />
                Verified
              </span>
            )}
          </div>
          <p className="turf-detail__address">
            <i className="bi bi-geo-alt" />
            {turf.address}
          </p>
        </div>

        <div className="turf-detail__stats">
          <StatItem label="Sport" value={sportTags.join(' · ')} icon="tag" />
          <StatItem
            label="Max Persons"
            value={turf.max_persons || 'Not specified'}
            icon="people"
          />
          <StatItem
            label={courtLabel}
            value={turf.courts || 1}
            icon="grid"
          />
        </div>

        <div className="turf-detail__section">
          <h3 className="turf-detail__section-title">
            <i className="bi bi-clock" />
            Opening Hours
          </h3>
          <div className="turf-detail__hours">
            <div className="turf-detail__hours-item">
              <span className="turf-detail__hours-label">Opening Time</span>
              <span className="turf-detail__hours-value">{formatTime(turf.open_time)}</span>
            </div>
            <div className="turf-detail__hours-item">
              <span className="turf-detail__hours-label">Closing Time</span>
              <span className="turf-detail__hours-value">
                {formatTime(turf.close_time)}
                {timeInfo.isNextDay && (
                  <span className="turf-detail__next-day-badge">Next Day</span>
                )}
              </span>
            </div>
            <div className="turf-detail__hours-item turf-detail__hours-item--full">
              <span className="turf-detail__hours-label">Hours</span>
              <span className="turf-detail__hours-value turf-detail__hours-value--highlight">
                {timeInfo.display}
              </span>
            </div>
          </div>
        </div>

        <div className="turf-detail__section">
          <h3 className="turf-detail__section-title">
            <i className="bi bi-grid-3x3-gap-fill" />
            Amenities
          </h3>
          <div className="turf-detail__amenities-grid">
            {amenities.map((amenity, index) => (
              <AmenityItem
                key={index}
                icon={amenity.icon}
                label={amenity.label}
                available={amenity.available}
              />
            ))}
          </div>
        </div>

        <div className="turf-detail__section">
          <h3 className="turf-detail__section-title">
            <i className="bi bi-activity" />
            Available Sports
          </h3>
          <div className="turf-detail__sport-tags">
            {sportTags.map((sport, index) => (
              <span key={index} className="turf-detail__sport-tag">
                {sport}
              </span>
            ))}
          </div>
        </div>

        <div className="turf-detail__book-section">
          <button
            className="turf-detail__book-btn"
            onClick={() => navigate(`/booking/${turf.id}`, { state: { turf } })}
          >
            <i className="bi bi-calendar-plus" />
            Book Now
          </button>
          <p className="turf-detail__book-note">
            Select a date and time slot to book this{' '}
            {courtLabel.toLowerCase().slice(0, -1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TurfDetailPage;