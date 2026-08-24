// src/api/admin/sidenav.ts
import apiClient from './client';
import type { SideNavResponse, SideNavItem } from '../../types/admin/auth';

/**
 * GET /api/admin/sidenav/
 * Fetches the dynamic sidebar navigation for the logged-in admin
 */
export const fetchSideNav = async (): Promise<SideNavItem[]> => {
  try {
    console.log('Making API call to /api/admin/sidenav/');
    const response = await apiClient.get<SideNavResponse>('/api/admin/sidenav/');
    console.log('API Response:', response.data);
    
    // Handle both response formats
    const items = response.data.data?.items ?? [];
    console.log('Sidebar items:', items);
    return items;
  } catch (error) {
    console.error('Error fetching sidebar navigation:', error);
    // Return empty array instead of throwing
    return [];
  }
};