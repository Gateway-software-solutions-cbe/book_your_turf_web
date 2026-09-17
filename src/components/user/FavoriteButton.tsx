// src/components/user/FavoriteButton.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import './FavoriteButton.css';

interface FavoriteButtonProps {
  turfId: number;
  /** Visual size — 'sm' on cards, 'md' on detail page */
  size?: 'sm' | 'md' | 'lg';
  /** Where to place it — affects absolute positioning */
  position?: 'top-right' | 'inline';
  /** Optional class override */
  className?: string;
}

const FavoriteButton = ({
  turfId,
  size = 'md',
  position = 'top-right',
  className = '',
}: FavoriteButtonProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserAuth();
  const { isFavorite, isToggling, toggle } = useFavorites();
  const [burst, setBurst] = useState(false);

  const liked = isFavorite(turfId);
  const loading = isToggling(turfId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/phone-auth');
      return;
    }

    // Trigger burst animation
    setBurst(true);
    setTimeout(() => setBurst(false), 350);

    try {
      await toggle(turfId);
    } catch {
      // Silent — context reverted state
    }
  };

  return (
    <button
      type="button"
      className={`fav-btn fav-btn--${size} fav-btn--${position} ${
        liked ? 'fav-btn--liked' : ''
      } ${burst ? 'fav-btn--burst' : ''} ${className}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={liked}
    >
      <i className={`bi bi-heart${liked ? '-fill' : ''}`} />
    </button>
  );
};

export default FavoriteButton;