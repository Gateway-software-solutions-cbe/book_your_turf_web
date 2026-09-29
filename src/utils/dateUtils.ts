// src/utils/dateUtils.ts (create this file)

/**
 * Format a Date object to 'YYYY-MM-DD' string in LOCAL timezone
 * Avoids timezone shift issues caused by toISOString()
 */
export const formatLocalDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a Date object to 'DD-MM-YYYY' string in LOCAL timezone
 * Used for calendar API
 */
export const formatLocalDateDDMMYYYY = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};