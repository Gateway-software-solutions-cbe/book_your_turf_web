// src/hooks/useRegisterDevice.ts
import { useEffect, useRef } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { registerDevice } from '../api/user/devices';
import { buildRegisterDevicePayload } from '../utils/deviceUtils';

const SESSION_FLAG = 'byt_device_registered_this_session';

export const useRegisterDevice = () => {
  const { isAuthenticated } = useUserAuth();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (firedRef.current) return;
    if (sessionStorage.getItem(SESSION_FLAG)) {
      firedRef.current = true;
      return;
    }

    firedRef.current = true;

    (async () => {
      try {
        const payload = await buildRegisterDevicePayload();
        const res = await registerDevice(payload);
        if (res.result === 'success') {
          sessionStorage.setItem(SESSION_FLAG, '1');
          console.log('✅ Device registered:', payload.device_id);
        } else {
          console.warn('⚠️ Device registration failed:', res.message);
        }
      } catch (err) {
        console.error('❌ Device registration error:', err);
      }
    })();
  }, [isAuthenticated]);
};