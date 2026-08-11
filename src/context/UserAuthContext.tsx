// src/context/UserAuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userTokenStorage, USER_KEY } from '../api/admin/client';
import type { LoginData, LoginUser } from '../types/user/userAuth';
import apiClient from '../api/admin/client';

interface UserAuthContextValue {
  user: LoginUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  walletBalance: number;
  gameCoins: number;
  loginSuccess: (data: LoginData) => void;
  logout: () => void;
  updateUser: (user: LoginUser) => void;
  refreshUserData: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextValue | undefined>(undefined);

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LoginUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const walletBalance = user ? parseFloat(user.wallet_balance) : 0;
  const gameCoins = user ? user.game_coins : 0;

  const loginSuccess = (data: LoginData) => {
    userTokenStorage.set(data.access);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    userTokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const updateUser = (updatedUser: LoginUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get<{ result: string; data: LoginUser }>('/api/user/profile/');
      const updatedUser = response.data.data;
      if (updatedUser) {
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // ─── Token validation on mount ──────────────────────────────────────
  useEffect(() => {
    const validateToken = async () => {
      const token = userTokenStorage.get();
      
      // If no token, just set loading to false
      if (!token) {
        setIsLoading(false);
        return;
      }

      // If we have a user in localStorage but no token, clear everything
      if (!token && user) {
        logout();
        setIsLoading(false);
        return;
      }

      // Validate token by fetching user profile
      try {
        const response = await apiClient.get<{ result: string; data: LoginUser }>('/api/user/profile/');
        if (response.data.data) {
          updateUser(response.data.data);
        }
      } catch (error) {
        // Token is invalid or expired
        console.error('Token validation failed:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        walletBalance,
        gameCoins,
        loginSuccess,
        logout,
        updateUser,
        refreshUserData,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = (): UserAuthContextValue => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within <UserAuthProvider>');
  return ctx;
};