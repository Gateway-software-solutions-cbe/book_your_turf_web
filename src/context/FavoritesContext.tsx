// src/context/FavoritesContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useUserAuth } from './UserAuthContext';
import { listFavorites, toggleFavorite as apiToggle } from '../api/user/favorites';
import type { FavoriteTurf } from '../types/user/turf';

interface FavoritesContextValue {
  favoriteIds: Set<number>;
  favorites: FavoriteTurf[];              // ← was Turf[]
  isLoading: boolean;
  isToggling: (turfId: number) => boolean;
  isFavorite: (turfId: number) => boolean;
  toggle: (turfId: number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useUserAuth();

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<FavoriteTurf[]>([]);   // ← was Turf[]
  const [isLoading, setIsLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await listFavorites();
      if (res.result === 'success' && Array.isArray(res.data)) {
        setFavorites(res.data);
        setFavoriteIds(new Set(res.data.map((t) => t.id)));
      }
    } catch (err) {
      console.error('❌ Failed to load favourites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoriteIds(new Set());
      fetchedRef.current = false;
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refresh();
  }, [isAuthenticated, refresh]);

  const toggle = useCallback(
    async (turfId: number): Promise<boolean> => {
      const wasFavorite = favoriteIds.has(turfId);

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(turfId);
        else next.add(turfId);
        return next;
      });
      setTogglingIds((prev) => new Set(prev).add(turfId));

      try {
        const res = await apiToggle({ turf_id: turfId });
        if (res.result !== 'success') throw new Error(res.message);

        const nowFavorite = res.data?.status === 'liked';

        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (nowFavorite) next.add(turfId);
          else next.delete(turfId);
          return next;
        });

        if (!nowFavorite) {
          setFavorites((prev) => prev.filter((t) => t.id !== turfId));
        }

        return nowFavorite;
      } catch (err) {
        console.error('❌ Toggle failed:', err);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(turfId);
          else next.delete(turfId);
          return next;
        });
        throw err;
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(turfId);
          return next;
        });
      }
    },
    [favoriteIds]
  );

  const isFavorite = useCallback(
    (id: number) => favoriteIds.has(id),
    [favoriteIds]
  );
  const isToggling = useCallback(
    (id: number) => togglingIds.has(id),
    [togglingIds]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favorites,
        isLoading,
        isToggling,
        isFavorite,
        toggle,
        refresh,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within <FavoritesProvider>');
  return ctx;
};