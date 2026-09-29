import React, { createContext, useContext, useState } from "react";
import CompleteProfileModal from "../components/partner/CompleteProfileModal";
import { usePartnerAuth } from "./PartnerAuthContext";

interface GuardCtx {
  openCompleteProfile: (onSuccess?: () => void) => void;
}

const ProfileGuardContext = createContext<GuardCtx | undefined>(undefined);

export const ProfileGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isGuest } = usePartnerAuth();
  const [open, setOpen] = useState(false);
  const [onSuccess, setOnSuccess] = useState<(() => void) | undefined>();

  const openCompleteProfile = (cb?: () => void) => {
    setOnSuccess(() => cb);
    setOpen(true);
  };

  return (
    <ProfileGuardContext.Provider value={{ openCompleteProfile }}>
      {children}
      {isGuest && (
        <CompleteProfileModal
          open={open}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
        />
      )}
    </ProfileGuardContext.Provider>
  );
};

export const useProfileGuard = () => {
  const ctx = useContext(ProfileGuardContext);
  if (!ctx) throw new Error("useProfileGuard must be used inside ProfileGuardProvider");
  return ctx;
};