// src/utils/timeUtils.ts
export const formatTime12h = (t?: string | null): string => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

export const normalizeHourlyTime = (value: string): string => {
  if (!value) return "";

  const hours = value.split(":")[0];

  return `${hours}:00`;
};