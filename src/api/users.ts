import apiClient from './client';
import type { User, PaginatedUsers, ListUsersParams, UpdateUserRequest } from '../types/user';

// ─── Create User ───────────────────────────────────────────────────────────────

export interface CreateUserRequest {
  name:           string;
  email:          string;
  number:         string;
  referral_code?: string;
  is_active?:     boolean;
  profile_image?: File;
}

/**
 * POST /api/admin/users/
 * Creates a new user via multipart/form-data.
 * Returns 201 with the created user object.
 */
export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const fd = new FormData();
  fd.append('name', data.name);
  fd.append('email', data.email);
  fd.append('number', data.number);
  if (data.referral_code !== undefined) fd.append('referral_code', data.referral_code);
  if (data.is_active     !== undefined) fd.append('is_active', String(data.is_active));
  if (data.profile_image)               fd.append('profile_image', data.profile_image);

  const res = await apiClient.post<{ result: string; data: User }>(
    '/api/admin/users/', fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return (res.data as { data?: User }).data ?? (res.data as unknown as User);
};

// ─── Users API ─────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/users/ */
export const listUsers = async (params?: ListUsersParams): Promise<PaginatedUsers> => {
  const res = await apiClient.get('/api/admin/users/', { params });
  const body = res.data;
  if (body?.data?.results !== undefined) return body.data;
  return body;
};

/**
 * GET /api/admin/users/{id}/ */
export const getUser = async (id: number): Promise<User> => {
  const res = await apiClient.get<{ result: string; data: User }>(`/api/admin/users/${id}/`);
  // Handle both wrapped { result, data } and plain User response defensively
  return (res.data as { data?: User }).data ?? (res.data as unknown as User);
};

/**
 * PATCH /api/admin/users/{id}/ */
export const updateUser = async (id: number, data: UpdateUserRequest): Promise<User> => {
  const hasImage = !!data.profile_image;

  if (hasImage) {
    const fd = new FormData();
    if (data.name      !== undefined) fd.append('name',      data.name);
    if (data.email     !== undefined) fd.append('email',     data.email);
    if (data.number    !== undefined) fd.append('number',    data.number);
    if (data.is_active !== undefined) fd.append('is_active', String(data.is_active));
    fd.append('profile_image', data.profile_image!);

    const res = await apiClient.patch<{ result: string; message: string; data: User }>(
      `/api/admin/users/${id}/`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return (res.data as { data?: User }).data ?? (res.data as unknown as User);
  }

  const payload: Record<string, unknown> = {};
  if (data.name      !== undefined) payload.name      = data.name;
  if (data.email     !== undefined) payload.email     = data.email;
  if (data.number    !== undefined) payload.number    = data.number;
  if (data.is_active !== undefined) payload.is_active = data.is_active;

  const res = await apiClient.patch<{ result: string; message: string; data: User }>(
    `/api/admin/users/${id}/`,
    payload,
  );
  return (res.data as { data?: User }).data ?? (res.data as unknown as User);
};