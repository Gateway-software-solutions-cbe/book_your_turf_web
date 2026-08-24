// src/components/admin/layout/iconMapper.tsx
import React from 'react';

// Map backend icon paths to your React components
export const ICON_MAP: Record<string, React.ReactNode> = {
  '/icons/dashboard.svg': (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10Zm8-3a1 1 0 0 0 0 2h2a1 1 0 0 0 0-2H10Zm-4 6a1 1 0 0 0 1 1h6a1 1 0 0 0 0-2H7a1 1 0 0 0-1 1Z"/>
    </svg>
  ),
  '/icons/users.svg': (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.808A7.47 7.47 0 0 1 14.5 16Z"/>
    </svg>
  ),
  '/icons/partners.svg': (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6A3 3 0 1 1 7 6a3 3 0 0 1 6 0ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM15.22 15.126A3.001 3.001 0 0 0 12 13H8a3 3 0 0 0-3.22 2.126 8.994 8.994 0 0 0 10.44 0ZM19.078 14.123A5.01 5.01 0 0 0 15 12a4.98 4.98 0 0 0-1.952.393A5.012 5.012 0 0 1 15.172 17H19a1 1 0 0 0 .914-1.406 5.01 5.01 0 0 0-.836-1.471ZM4.952 12.392A5.01 5.01 0 0 0 1 17a1 1 0 0 0 .914 1.406h3.828a5.012 5.012 0 0 1 2.124-4.607A4.98 4.98 0 0 0 6 13a5.01 5.01 0 0 0-1.048.392Z"/>
    </svg>
  ),
  '/icons/turfs.svg': (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.674 2.075a.75.75 0 0 1 .652 0l7.25 3.5A.75.75 0 0 1 17 6.957V16.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.957a.75.75 0 0 1-.576-.382l7.25-3.5ZM11 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd"/>
    </svg>
  ),
  '/icons/bookings.svg': (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd"/>
    </svg>
  ),
  '/icons/transactions.svg': (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 0 0-2 2v1h16V6a2 2 0 0 0-2-2H4Z"/>
      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM4 13a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm5-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2H9Z" clipRule="evenodd"/>
    </svg>
  ),
  // Add more icon mappings as needed
};

export const getIconComponent = (iconPath: string): React.ReactNode => {
  return ICON_MAP[iconPath] || (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/>
    </svg>
  );
};