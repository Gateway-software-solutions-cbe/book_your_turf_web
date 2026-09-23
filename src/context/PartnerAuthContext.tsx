import React, { createContext, useContext, useEffect, useState } from "react";
import { partnerAuthApi } from "../api/partner/auth";
import type { PartnerProfile } from "../types/partner/partnerAuth";

interface PartnerAuthContextValue {
  partner: PartnerProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isGuest: boolean;
  loading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  setSession: (access: string, partner: PartnerProfile) => Promise<void>;
  logout: () => void;
  updatePartner: (p: PartnerProfile) => void;
  refreshProfile: () => Promise<PartnerProfile | null>;
}

const PartnerAuthContext = createContext<PartnerAuthContextValue | undefined>(
  undefined,
);

const TOKEN_KEY = "partner_access_token";
const PROFILE_KEY = "partner_profile";

export const PartnerAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Boot: hydrate from localStorage, then refresh profile ─────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedProfile = localStorage.getItem(PROFILE_KEY);

    if (storedToken && storedProfile) {
      setToken(storedToken);
      try {
        setPartner(JSON.parse(storedProfile));
      } catch {
        // corrupt storage — ignore, will re-fetch below
      }
    }
    setLoading(false);

    // If a token exists, refresh the profile so profile_complete is current
    if (storedToken) {
      (async () => {
        try {
          const res = await partnerAuthApi.getProfile();
          const full = res.data;
          localStorage.setItem(PROFILE_KEY, JSON.stringify(full));
          setPartner(full);
        } catch {
          // Token invalid or network issue — keep whatever we had.
        }
      })();
    }
  }, []);

  // ─── login (email/phone + password) ───────────────────────────
  const login = async (loginId: string, password: string) => {
    const res = await partnerAuthApi.login({ login_id: loginId, password });
    const { access } = res.data;

    // Persist token first so the request interceptor picks it up
    localStorage.setItem(TOKEN_KEY, access);
    setToken(access);

    // Fetch authoritative profile so profile_complete is accurate
    try {
      const profileRes = await partnerAuthApi.getProfile();
      const fullProfile = profileRes.data;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(fullProfile));
      setPartner(fullProfile);
    } catch {
      // Fallback to whatever the login endpoint returned
      const fallback = res.data.partner;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(fallback));
      setPartner(fallback);
    }
  };

  // ─── setSession (phone OTP verify) ────────────────────────────
  const setSession = async (
    access: string,
    initialPartner: PartnerProfile,
  ) => {
    // Persist token first so the interceptor is armed
    localStorage.setItem(TOKEN_KEY, access);
    setToken(access);

    // Optimistic set so the UI can react immediately
    localStorage.setItem(PROFILE_KEY, JSON.stringify(initialPartner));
    setPartner(initialPartner);

    // Then fetch the authoritative profile
    try {
      const profileRes = await partnerAuthApi.getProfile();
      const fullProfile = profileRes.data;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(fullProfile));
      setPartner(fullProfile);
    } catch {
      // Keep the optimistic set
    }
  };

  // ─── logout ───────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setToken(null);
    setPartner(null);
  };

  // ─── manual profile update (from modal) ───────────────────────
  const updatePartner = (p: PartnerProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setPartner(p);
  };

  // ─── explicit refresh ─────────────────────────────────────────
  const refreshProfile = async () => {
    if (!token) return null;
    try {
      const res = await partnerAuthApi.getProfile();
      updatePartner(res.data);
      return res.data;
    } catch {
      return null;
    }
  };

  const isAuthenticated = !!token;
  const isProfileComplete = !!partner?.profile_complete;
  const isGuest = isAuthenticated && !isProfileComplete;

  return (
    <PartnerAuthContext.Provider
      value={{
        partner,
        token,
        isAuthenticated,
        isProfileComplete,
        isGuest,
        loading,
        login,
        setSession,
        logout,
        updatePartner,
        refreshProfile,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
};

export const usePartnerAuth = () => {
  const ctx = useContext(PartnerAuthContext);
  if (!ctx)
    throw new Error("usePartnerAuth must be used within PartnerAuthProvider");
  return ctx;
};