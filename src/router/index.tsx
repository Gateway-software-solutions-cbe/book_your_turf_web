// src/router/index.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { UserAuthProvider } from '../context/UserAuthContext';
import { commonRoutes } from './common.routes';
import { adminRoutes } from './admin.routes';
import { userRoutes } from './user.routes';
// import { partnerRoutes } from './partner.routes';

const PageLoader = () => (
  <div className="auth-loading">
    <div className="auth-loading__spinner" />
  </div>
);

// ─── Flatten routes helper ──────────────────────────────────────────────
const flattenRoutes = (routes: any[]): any[] => {
  let result: any[] = [];
  routes.forEach((route) => {
    result.push(route);
    if (route.children) {
      result = result.concat(flattenRoutes(route.children));
    }
  });
  return result;
};

// ─── Router ──────────────────────────────────────────────────────────────
const AppRouter: React.FC = () => {
  // Combine all routes
  const allRoutes = [
    ...commonRoutes,
    ...adminRoutes,
    ...userRoutes,
    // ...partnerRoutes,
  ];

  return (
    <BrowserRouter>
      <AuthProvider>
        <UserAuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {allRoutes.map((route, index) => {
                // Handle nested routes with element
                if (route.children) {
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={route.element}
                    >
                      {route.children.map((child: any, childIndex: number) => {
                        if (child.children) {
                          return (
                            <Route
                              key={childIndex}
                              path={child.path}
                              element={child.element}
                            >
                              {child.children.map(
                                (grandChild: any, grandIndex: number) => (
                                  <Route
                                    key={grandIndex}
                                    path={grandChild.path}
                                    element={grandChild.element}
                                    index={grandChild.index}
                                  />
                                )
                              )}
                            </Route>
                          );
                        }
                        return (
                          <Route
                            key={childIndex}
                            path={child.path}
                            element={child.element}
                            index={child.index}
                          />
                        );
                      })}
                    </Route>
                  );
                }
                return (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                    index={route.index}
                  />
                );
              })}
            </Routes>
          </Suspense>
        </UserAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;