// src/context/UserAuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { userTokenStorage, USER_KEY } from '../api/admin/client';
import type { LoginData, LoginUser } from '../types/user/userAuth';
import { updateProfile } from '../api/user/userAuth';
import type { ProfileUpdateRequest } from '../types/user/userAuth';
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
  updateProfile: (data: ProfileUpdateRequest) => Promise<void>; // ← ADD THIS
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

  // ─── ADD THIS: Update Profile ──────────────────────────────────────────
  const handleUpdateProfile = async (data: ProfileUpdateRequest) => {
    try {
      const response = await updateProfile(data);
      if (response.data.result === 'success' && response.data.data) {
        const updatedProfile = response.data.data;
        
        if (user) {
          const updatedUser: LoginUser = {
            ...user,
            name: updatedProfile.name || user.name,
            email: updatedProfile.email || user.email,
            wallet_balance: updatedProfile.wallet_balance || user.wallet_balance,
            game_coins: updatedProfile.game_coins ?? user.game_coins,
            referral_code: updatedProfile.referral_code || user.referral_code,
          };
          updateUser(updatedUser);
        }
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  // ─── Token validation on mount ──────────────────────────────────────
  useEffect(() => {
    const validateToken = async () => {
      const token = userTokenStorage.get();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (!token && user) {
        logout();
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get<{ result: string; data: LoginUser }>('/api/user/profile/');
        if (response.data.data) {
          updateUser(response.data.data);
        }
      } catch (error) {
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
        updateProfile: handleUpdateProfile, // ← ADD THIS
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