// src/context/UserAuthContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { userTokenStorage, USER_KEY } from '../api/client';
import type { LoginData, LoginUser } from '../types/userAuth';

interface UserAuthContextValue {
  user: LoginUser | null;
  isAuthenticated: boolean;
  loginSuccess: (data: LoginData) => void;
  logout: () => void;
}

const UserAuthContext = createContext<UserAuthContextValue | undefined>(undefined);

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LoginUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const loginSuccess = (data: LoginData) => {
    userTokenStorage.set(data.access);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    userTokenStorage.clear();
    setUser(null);
  };

  return (
    <UserAuthContext.Provider value={{ user, isAuthenticated: !!user, loginSuccess, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = (): UserAuthContextValue => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within <UserAuthProvider>');
  return ctx;
};