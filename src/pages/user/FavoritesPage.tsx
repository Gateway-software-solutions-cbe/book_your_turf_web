// src/pages/user/FavoritesPage.tsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import FavoriteButton from '../../components/user/FavoriteButton';
import type { FavoriteTurf } from '../../types/user/turf';
import { formatTime12h } from '../../utils/timeUtils';
import './style/FavoritesPage.css';

// ─── Turf card ────────────────────────────────────────────────────────────
const FavoriteTurfCard = ({ turf }: { turf: FavoriteTurf }) => {
  // ✅ images are objects — direct .url access, no fallback needed
  const image = turf.images?.[0]?.url;

  const hasHours = !!(turf.open_time || turf.close_time);

  return (
    <Link to={`/turfs/${turf.id}`} className="fav-turf-card">
      <div className="fav-turf-card__media">
        {image ? (
          <img src={image} alt={turf.name} loading="lazy" />
        ) : (
          <div className="fav-turf-card__placeholder">
            <i className="bi bi-image" />
          </div>
        )}

        <FavoriteButton turfId={turf.id} size="md" position="top-right" />

        <span className="fav-turf-card__sport">
          {turf.game_type || 'Multi-sport'}
        </span>
      </div>

      <div className="fav-turf-card__body">
        <h3 className="fav-turf-card__name">{turf.name}</h3>

        <div className="fav-turf-card__location">
          <i className="bi bi-geo-alt-fill" />
          <span>{turf.address || `${turf.district}, ${turf.state}`}</span>
        </div>

        <div className="fav-turf-card__meta">
          {hasHours && (
            <span>
              <i className="bi bi-clock" />
              {formatTime12h(turf.open_time)} – {formatTime12h(turf.close_time)}
            </span>
          )}
          {turf.max_persons != null && (
            <span>
              <i className="bi bi-people" />
              {turf.max_persons} max
            </span>
          )}
        </div>

        <div className="fav-turf-card__cta">
          <span>View Turf</span>
          <i className="bi bi-arrow-right" />
        </div>
      </div>
    </Link>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────
const FavoritesPage = () => {
  const navigate = useNavigate();
  const { favorites, isLoading, refresh } = useFavorites();

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="favorites-page">
      <div className="favorites-page__header">
        <div>
          <h1>Favorite Turfs</h1>
          <p>Your saved turfs, all in one place</p>
        </div>
        {favorites.length > 0 && (
          <span className="favorites-page__count">
            {favorites.length} saved
          </span>
        )}
      </div>

      {isLoading && (
        <div className="favorites-page__loading">
          <div className="spinner-border text-success" role="status" />
          <p>Loading your favourites...</p>
        </div>
      )}

      {!isLoading && favorites.length === 0 && (
        <div className="favorites-page__empty">
          <div className="favorites-page__empty-icon">
            <i className="bi bi-heart" />
          </div>
          <h3>No favorites yet</h3>
          <p>Tap the ♥ on any turf to save it here for quick access.</p>
          <button onClick={() => navigate('/turfs')}>
            <i className="bi bi-search" /> Browse Turfs
          </button>
        </div>
      )}

      {!isLoading && favorites.length > 0 && (
        <div className="favorites-page__grid">
          {favorites.map((turf) => (
            <FavoriteTurfCard key={turf.id} turf={turf} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;