import { useEffect, useRef } from "react";
import { usePartnerAuth } from "../context/PartnerAuthContext";
import { registerPartnerDevice } from "../api/partner/devices";
import { buildRegisterPartnerDevicePayload } from "../utils/partnerDeviceUtils";

export const useRegisterPartnerDevice = () => {
  const { isAuthenticated } = usePartnerAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current) return;
    registeredRef.current = true;

    (async () => {
      try {
        const payload = await buildRegisterPartnerDevicePayload();
        await registerPartnerDevice(payload);
      } catch (err) {
        console.warn("[useRegisterPartnerDevice] failed:", err);
      }
    })();
  }, [isAuthenticated]);
};