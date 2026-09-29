// src/router/index.tsx
import React, { Suspense, useEffect } from "react";
import { BrowserRouter, useRoutes, RouteObject } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { UserAuthProvider } from "../context/UserAuthContext";
import { FavoritesProvider } from "../context/FavoritesContext";
import { NotificationsProvider } from "../context/NotificationsContext";
import { PartnerAuthProvider } from "../context/PartnerAuthContext";
import { ProfileGuardProvider } from "../context/ProfileGuardContext";
import { PartnerNotificationsProvider } from "../context/PartnerNotificationsContext";
import { commonRoutes } from "./common.routes";
import { adminRoutes } from "./admin.routes";
import { userRoutes } from "./user.routes";
import { partnerRoutes } from "./partner.routes";
import { useMetaPageView } from "../hooks/useMetaPageView";
import { metaDeeplinkReceived, setUserContext } from '../lib/metaPixel';

const PageLoader = () => (
  <div className="auth-loading">
    <div className="auth-loading__spinner" />
  </div>
);

// Combine all RouteObject[] arrays. Route ranking in useRoutes handles
// specificity correctly, so /partner/venues/new wins over /partner/venues/:id.
const allRoutes: RouteObject[] = [
  ...commonRoutes,
  ...adminRoutes,
  ...userRoutes,
  ...partnerRoutes,
];

// Inner component so useRoutes has a Router context above it.
const AppRoutes: React.FC = () => {
  
  useMetaPageView();
  useEffect(() => {
    setUserContext({});
    metaDeeplinkReceived();
  }, []);

  return useRoutes(allRoutes);}

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserAuthProvider>
          <FavoritesProvider>
            <NotificationsProvider>
              <PartnerAuthProvider>
                <PartnerNotificationsProvider>
                <ProfileGuardProvider>
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </ProfileGuardProvider>
                </PartnerNotificationsProvider>
              </PartnerAuthProvider>
            </NotificationsProvider>
          </FavoritesProvider>
        </UserAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;