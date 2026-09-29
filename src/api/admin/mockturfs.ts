import apiClient from './client';
import type { MockTurf, MockTurfFormData } from '../../types/admin/mockturf';

// ─── Mock Turfs API ────────────────────────────────────────────────────────────
// POST uses multipart/form-data (image upload). PATCH also supports multipart.

const buildFormData = (data: MockTurfFormData): FormData => {
  const fd = new FormData();
  fd.append('name', data.name);
  fd.append('address', data.address);
  fd.append('phone_number', data.phone_number);
  if (data.facilities) fd.append('facilities', JSON.stringify(data.facilities));
  if (data.image)      fd.append('image', data.image);
  if (data.is_active !== undefined) fd.append('is_active', String(data.is_active));
  return fd;
};

/** GET /api/admin/mock-turfs/?is_active=true|false */
export const listMockTurfs = async (is_active?: boolean): Promise<MockTurf[]> => {
  const params = is_active !== undefined ? { is_active } : undefined;
  const res = await apiClient.get<MockTurf[]>('/api/admin/mock-turfs/', { params });
  return res.data;
};

/** GET /api/admin/mock-turfs/{id}/ */
export const getMockTurf = async (id: number): Promise<MockTurf> => {
  const res = await apiClient.get<MockTurf>(`/api/admin/mock-turfs/${id}/`);
  return res.data;
};

/** POST /api/admin/mock-turfs/ — multipart/form-data */
export const createMockTurf = async (data: MockTurfFormData): Promise<MockTurf> => {
  const res = await apiClient.post<{ data: MockTurf }>(
    '/api/admin/mock-turfs/',
    buildFormData(data),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  // API returns { result, message, data: {...} }
  return res.data?.data ?? (res.data as unknown as MockTurf);
};

/** PATCH /api/admin/mock-turfs/{id}/ */
export const updateMockTurf = async (id: number, data: Partial<MockTurfFormData>): Promise<MockTurf> => {
  const fd = new FormData();
  if (data.name !== undefined)         fd.append('name', data.name);
  if (data.address !== undefined)      fd.append('address', data.address);
  if (data.phone_number !== undefined) fd.append('phone_number', data.phone_number);
  if (data.facilities !== undefined)   fd.append('facilities', JSON.stringify(data.facilities));
  if (data.image)                      fd.append('image', data.image);
  if (data.is_active !== undefined)    fd.append('is_active', String(data.is_active));

  const res = await apiClient.patch<{ data: MockTurf }>(
    `/api/admin/mock-turfs/${id}/`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data?.data ?? (res.data as unknown as MockTurf);
};

/** DELETE /api/admin/mock-turfs/{id}/ */
export const deleteMockTurf = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/mock-turfs/${id}/`);
};