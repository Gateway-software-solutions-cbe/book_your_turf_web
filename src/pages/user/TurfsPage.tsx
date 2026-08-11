// src/pages/user/TurfsPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { listTurfs } from '../../api/user/turfs';
import type { Turf, ListTurfsParams } from '../../types/user/turf';
import './style/TurfsPage.css';

// ─── Sport Filter ──────────────────────────────────────────────────────────
interface SportFilterProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

const SportFilter = ({ label, icon, active, onClick }: SportFilterProps) => (
  <button
    className={`sport-filter-btn ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <i className={`bi bi-${icon}`} />
    {label}
  </button>
);

// ─── Turf Card ─────────────────────────────────────────────────────────────
interface TurfCardProps {
  turf: Turf;
  onClick: () => void;
}

const TurfCard = ({ turf, onClick }: TurfCardProps) => {
  const firstImage = turf.images?.[0] || 'https://placehold.co/600x400/0b1f1a/1fa463?text=BYT';
  const isReal = turf.type === 'real';
  const isVerified = isReal && turf.status === 'Approved';
  const isMock = turf.type === 'mock';
  const gameType = turf.game_type || 'Multi-sport';
  
  const distanceDisplay = turf.distance_km !== null && turf.distance_km !== undefined
    ? `${turf.distance_km < 1 ? '<1' : Math.round(turf.distance_km)} km away`
    : null;

  const shortAddress = turf.address?.split(',')?.slice(0, 2)?.join(',') || turf.address || 'Location not available';
  const showVerifiedBadge = isReal && isVerified;
  const showFavourite = isReal && !isMock;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock && turf.phone_number) {
      window.location.href = `tel:${turf.phone_number}`;
    } else if (isReal && isVerified && turf.is_bookable) {
      onClick();
    }
  };

  const getButtonText = () => {
    if (isMock) return 'Contact';
    if (isReal && isVerified && turf.is_bookable) return 'Book Now';
    return 'View Details';
  };

  const getButtonIcon = () => {
    if (isMock) return 'bi-telephone-fill';
    if (isReal && isVerified && turf.is_bookable) return 'bi-arrow-right';
    return 'bi-eye';
  };

  return (
    <div className="turf-card" onClick={onClick}>
      <div className="turf-card__image">
        <img src={firstImage} alt={turf.name} loading="lazy" />
        
        {showVerifiedBadge && (
          <div className="turf-card__verified-badge">
            <i className="bi bi-check-circle-fill" />
          </div>
        )}

        {showFavourite && (
          <button 
            className="turf-card__favourite-btn"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Toggle favourite for:', turf.id);
            }}
          >
            <i className={`bi ${turf.is_favorited ? 'bi-heart-fill' : 'bi-heart'}`} />
          </button>
        )}
      </div>

      <div className="turf-card__body">
        <h3 className="turf-card__name">{turf.name}</h3>
        <p className="turf-card__address">{shortAddress}</p>
        
        <div className="turf-card__meta-row">
          <span className="turf-card__sport">
            <i className="bi bi-tag" />
            {gameType}
          </span>
          {distanceDisplay && (
            <span className="turf-card__distance">
              <i className="bi bi-geo-alt" />
              {distanceDisplay}
            </span>
          )}
        </div>

        <button 
          className={`turf-card__action-btn ${isMock ? 'turf-card__action-btn--call' : ''}`} 
          onClick={handleAction}
        >
          <i className={getButtonIcon()} />
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────
const TurfSkeleton = () => (
  <div className="turf-card turf-card--skeleton">
    <div className="turf-card__image skeleton" />
    <div className="turf-card__body">
      <div className="skeleton-text" style={{ width: '70%' }} />
      <div className="skeleton-text" style={{ width: '50%' }} />
      <div className="skeleton-text" style={{ width: '60%' }} />
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────
const EmptyState = ({ onRetry, searchQuery, sportName }: { onRetry: () => void; searchQuery: string; sportName: string }) => (
  <div className="empty-state">
    <div className="empty-state__icon">
      <i className="bi bi-search" />
    </div>
    <h3 className="empty-state__title">No turfs found</h3>
    <p className="empty-state__desc">
      {searchQuery 
        ? `No turfs match your search "${searchQuery}"` 
        : sportName 
          ? `No "${sportName}" turfs available within 25km of your location`
          : 'No turfs available within 25km of your location'}
    </p>
    <button className="empty-state__btn" onClick={onRetry}>
      <i className="bi bi-arrow-clockwise me-1" />
      Refresh
    </button>
  </div>
);

// ─── Search Bar ──────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const SearchBar = ({ value, onChange, onClear }: SearchBarProps) => (
  <div className={`search-bar ${value ? 'has-value' : ''}`}>
    <i className="bi bi-search" />
    <input
      type="text"
      placeholder="Search turfs, locations..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <button className="search-clear" onClick={onClear}>
        <i className="bi bi-x-circle-fill" />
      </button>
    )}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────

const TurfsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserAuth();

  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // ─── Sport Filters ──────────────────────────────────────────────────────
  const sports = [
    { label: 'All', icon: 'grid' },
    { label: 'Cricket & Football', icon: 'people' },
    { label: 'Pickleball', icon: 'tennis' },
    { label: 'Badminton', icon: 'badminton' },
  ];

  // ─── Sport Name to API Format Map ─────────────────────────────────────
  const sportMap: Record<string, string> = {
    'Cricket & Football': 'cricket & football',
    'Pickleball': 'pickleball',
    'Badminton': 'badminton',
  };

  // ─── Get Sport Display Name ────────────────────────────────────────────
  const getSportDisplayName = (sport: string | null): string => {
    if (!sport) return '';
    const map: Record<string, string> = {
      'cricket & football': 'Cricket & Football',
      'pickleball': 'Pickleball',
      'badminton': 'Badminton',
    };
    return map[sport] || sport;
  };

  // ─── Get User Location ──────────────────────────────────────────────────
  const getUserLocation = useCallback(async (): Promise<{ lat: number; lng: number }> => {
    if (user?.latitude && user?.longitude) {
      return {
        lat: parseFloat(user.latitude),
        lng: parseFloat(user.longitude),
      };
    }

    const storedLat = localStorage.getItem('user_lat');
    const storedLng = localStorage.getItem('user_lng');
    if (storedLat && storedLng) {
      return {
        lat: parseFloat(storedLat),
        lng: parseFloat(storedLng),
      };
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      localStorage.setItem('user_lat', String(coords.lat));
      localStorage.setItem('user_lng', String(coords.lng));
      return coords;
    } catch {
      console.log('Using default location: Chennai');
      return { lat: 13.0827, lng: 80.2707 };
    }
  }, [user]);

  // ─── Load Location on Mount ────────────────────────────────────────────
  useEffect(() => {
    const loadLocation = async () => {
      const location = await getUserLocation();
      setUserLocation(location);
      setLocationLoaded(true);
    };
    loadLocation();
  }, [getUserLocation]);

  // ─── Parse search from URL ─────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
      setIsSearching(true);
    } else {
      setSearchQuery('');
      setIsSearching(false);
    }
  }, [location.search]);

  // ─── Update URL when search changes ──────────────────────────────────
  const updateSearchParam = useCallback((query: string) => {
    const params = new URLSearchParams(location.search);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    const newUrl = params.toString() ? `${location.pathname}?${params}` : location.pathname;
    navigate(newUrl, { replace: true });
  }, [location.pathname, location.search, navigate]);

  // ─── Handle Search Change ─────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsSearching(!!value.trim());
    updateSearchParam(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    updateSearchParam('');
  };

  // ─── Fetch Turfs ──────────────────────────────────────────────────────

  const fetchTurfs = useCallback(async (reset = true) => {
    if (!locationLoaded || !userLocation) return;

    if (reset) {
      setLoading(true);
      setPage(1);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 1 : page + 1;
      
      // ─── Determine if we should search ALL turfs ──────────────────────
      const isManualSearch = searchQuery.trim().length > 0;
      
      // Sport filter value
      const sportValue = selectedSport && selectedSport !== 'All' 
        ? sportMap[selectedSport] 
        : null;

      console.log('🔍 Search state:', { 
        searchQuery, 
        isManualSearch, 
        selectedSport, 
        sportValue 
      });

      // ─── CASE 1: Manual Search (user typed in search bar) ──────────────
      if (isManualSearch) {
        const searchParams: ListTurfsParams = {
          page: currentPage,
          page_size: 50,
          search: searchQuery,
        };

        // If sport filter is also active, filter results manually after fetch
        // (Since API search might not support sport filtering properly)

        console.log('🔍 Manual Search (ALL turfs):', searchParams);
        const response = await listTurfs(searchParams);

        if (response.result === 'success' && response.data) {
          let { results, count } = response.data;
          
          // ─── Manual sport filter (client-side) ──────────────────────────
          if (sportValue) {
            results = results.filter(t => 
              t.game_type?.toLowerCase().includes(sportValue.toLowerCase())
            );
            count = results.length;
            console.log(`🏏 Filtered by sport "${sportValue}": ${results.length} turfs`);
          }
          
          // Calculate distances
          const processedResults = results.map(turf => {
            if (turf.distance_km === null && turf.latitude && turf.longitude) {
              turf.distance_km = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                parseFloat(turf.latitude),
                parseFloat(turf.longitude)
              );
            }
            return turf;
          });

          // Sort: Real turfs first (by distance), mock turfs at the end
          const sortedResults = [...processedResults].sort((a, b) => {
            if (a.type === 'mock' && b.type !== 'mock') return 1;
            if (b.type === 'mock' && a.type !== 'mock') return -1;
            if (a.distance_km === null && b.distance_km === null) return 0;
            if (a.distance_km === null) return 1;
            if (b.distance_km === null) return -1;
            return a.distance_km - b.distance_km;
          });

          if (reset) {
            setTurfs(sortedResults);
          } else {
            setTurfs(prev => [...prev, ...sortedResults]);
          }
          setTotalCount(count);
          setHasMore(results.length > 0 && currentPage * 20 < count);
        }
      } 
      // ─── CASE 2: Sport Filter Only (no manual search) ──────────────────
      else if (sportValue) {
        // Fetch ALL turfs within 25km, then filter by sport client-side
        const sportParams: ListTurfsParams = {
          page: currentPage,
          page_size: 50,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: 25,
        };

        console.log('📍 Fetching all turfs within 25km for sport filter:', sportParams);
        const response = await listTurfs(sportParams);

        if (response.result === 'success' && response.data) {
          let { results, count } = response.data;
          
          // ─── Filter by sport client-side ────────────────────────────────
          const filteredResults = results.filter(t => {
            // Only real turfs (no mock turfs in sport filter)
            if (t.type === 'mock') return false;
            // Check if game_type matches the sport
            const gameType = t.game_type?.toLowerCase() || '';
            return gameType.includes(sportValue.toLowerCase());
          });
          
          console.log(`🏏 Sport filter "${sportValue}": ${filteredResults.length} turfs found`);
          
          // Sort by distance (nearest first)
          const sortedResults = [...filteredResults].sort((a, b) => {
            if (a.distance_km === null && b.distance_km === null) return 0;
            if (a.distance_km === null) return 1;
            if (b.distance_km === null) return -1;
            return a.distance_km - b.distance_km;
          });

          if (reset) {
            setTurfs(sortedResults);
          } else {
            setTurfs(prev => [...prev, ...sortedResults]);
          }
          setTotalCount(sortedResults.length);
          setHasMore(results.length > 0 && currentPage * 20 < count);
        }
      }
      // ─── CASE 3: Default (No search, no sport filter) ──────────────────
      else {
        const defaultParams: ListTurfsParams = {
          page: currentPage,
          page_size: 50,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: 25,
        };

        console.log('📍 Default (within 25km):', defaultParams);
        const response = await listTurfs(defaultParams);

        if (response.result === 'success' && response.data) {
          const { results, count } = response.data;
          
          // Filter: Only real turfs (no mock turfs in default view)
          const realTurfs = results.filter(t => t.type === 'real');
          
          // Sort by distance (nearest first)
          const sortedResults = [...realTurfs].sort((a, b) => {
            if (a.distance_km === null && b.distance_km === null) return 0;
            if (a.distance_km === null) return 1;
            if (b.distance_km === null) return -1;
            return a.distance_km - b.distance_km;
          });

          if (reset) {
            setTurfs(sortedResults);
          } else {
            setTurfs(prev => [...prev, ...sortedResults]);
          }
          setTotalCount(sortedResults.length);
          setHasMore(results.length > 0 && currentPage * 20 < count);
        }
      }

      if (!reset) {
        setPage(currentPage);
      }

    } catch (err: any) {
      console.error('❌ Failed to fetch turfs:', err);
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, selectedSport, page, userLocation, locationLoaded]);

  // ─── Distance Calculation Helper ──────────────────────────────────────
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // ─── Effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (locationLoaded && userLocation) {
      fetchTurfs(true);
    }
  }, [searchQuery, selectedSport, locationLoaded, userLocation]);

  // ─── Infinite Scroll ──────────────────────────────────────────────────

  useEffect(() => {
    if (loading || !hasMore || !locationLoaded) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchTurfs(false);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, locationLoaded]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport === 'All' ? null : sport);
  };

  const handleTurfClick = (turf: Turf) => {
    navigate(`/turfs/${turf.id}`, { state: { turf } });
  };

  const handleRetry = () => {
    fetchTurfs(true);
  };

  // ─── Get Sport Display Name for Empty State ──────────────────────────
  const sportDisplayName = selectedSport && selectedSport !== 'All' 
    ? selectedSport 
    : '';

  return (
    <div className="turfs-page">
      {/* Header */}
      <div className="turfs-page__header">
        <div>
          <h1 className="turfs-page__greeting">
            Hello {user?.name?.split(' ')[0] || 'Guest'}
          </h1>
          <p className="turfs-page__subtitle">Find your perfect turf</p>
        </div>
        <div className="turfs-page__location-badge">
          <i className="bi bi-geo-alt-fill" />
          <span>
            {searchQuery.trim() 
              ? `Searching: "${searchQuery}"` 
              : `${totalCount} turf${totalCount !== 1 ? 's' : ''} within 25km`}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="turfs-page__search-wrapper">
        <SearchBar 
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
        />
      </div>

      {/* Filters */}
      <div className="turfs-page__filters-row">
        <div className="turfs-page__filters">
          {sports.map((sport) => (
            <SportFilter
              key={sport.label}
              label={sport.label}
              icon={sport.icon}
              active={selectedSport === sport.label || (sport.label === 'All' && !selectedSport)}
              onClick={() => handleSportSelect(sport.label)}
            />
          ))}
        </div>
        <div className="turfs-page__results-count">
          {totalCount > 0 && (
            <span>{totalCount} turf{totalCount !== 1 ? 's' : ''} found</span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="turfs-page__error">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>{error}</span>
          <button onClick={handleRetry}>Try Again</button>
        </div>
      )}

      {/* Turfs Grid */}
      {loading ? (
        <div className="turfs-grid">
          {[...Array(6)].map((_, i) => (
            <TurfSkeleton key={i} />
          ))}
        </div>
      ) : turfs.length === 0 ? (
        <EmptyState 
          onRetry={handleRetry} 
          searchQuery={searchQuery}
          sportName={sportDisplayName}
        />
      ) : (
        <>
          <div className="turfs-grid">
            {turfs.map((turf) => (
              <TurfCard
                key={turf.id}
                turf={turf}
                onClick={() => handleTurfClick(turf)}
              />
            ))}
          </div>

          {/* Load More */}
          <div ref={loadMoreRef} className="turfs-page__load-trigger">
            {loadingMore && (
              <div className="turfs-page__loading-more">
                <div className="spinner-border spinner-border-sm text-success" role="status" />
                <span>Loading more turfs...</span>
              </div>
            )}
            {!hasMore && turfs.length > 0 && (
              <div className="turfs-page__end-message">
                <span>🎯 You've seen all {totalCount} turfs</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TurfsPage;