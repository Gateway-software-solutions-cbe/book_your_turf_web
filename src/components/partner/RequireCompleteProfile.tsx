import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { usePartnerAuth } from "../../context/PartnerAuthContext";
import { useProfileGuard } from "../../context/ProfileGuardContext";
import "./layout/PartnerLayout.css"

const RequireCompleteProfile: React.FC = () => {
  const { isGuest, loading } = usePartnerAuth();
  const { openCompleteProfile } = useProfileGuard();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isGuest) {
      navigate("/partner/dashboard", { replace: true });
      // small delay so the redirect completes before modal mounts
      const t = setTimeout(() => openCompleteProfile(), 150);
      return () => clearTimeout(t);
    }
  }, [isGuest, loading, navigate, openCompleteProfile]);

  if (loading) {
    return <div className="pt-route-loader">Loading...</div>;
  }

  return isGuest ? null : <Outlet />;
};

export default RequireCompleteProfile;