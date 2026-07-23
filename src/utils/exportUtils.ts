// src/utils/exportUtils.ts
import * as XLSX from 'xlsx';

export type ExportFormat = 'excel' | 'csv';

interface ExportOptions {
  fileName: string;
  format: ExportFormat;
  sheetName?: string;
}

/**
 * Export data to Excel or CSV format
 */
export const exportData = <T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): void => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  const { fileName, format, sheetName = 'Sheet1' } = options;

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns (optional)
  const maxWidth = 50;
  const columnWidths: { wch: number }[] = [];
  
  // Get column widths from data
  Object.keys(data[0]).forEach((key) => {
    let maxLength = key.length;
    data.forEach((row) => {
      const value = row[key]?.toString() || '';
      maxLength = Math.max(maxLength, value.length);
    });
    columnWidths.push({ wch: Math.min(maxLength + 2, maxWidth) });
  });
  
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Export based on format
  const fileExtension = format === 'excel' ? 'xlsx' : 'csv';
  const fullFileName = `${fileName}.${fileExtension}`;
  
  if (format === 'excel') {
    XLSX.writeFile(workbook, fullFileName, { bookType: 'xlsx' });
  } else {
    XLSX.writeFile(workbook, fullFileName, { bookType: 'csv' });
  }
};

/**
 * Format date for export
 */
export const formatDateForExport = (date: string | Date): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format currency for export
 */
export const formatCurrencyForExport = (amount: number | string): string => {
  if (!amount) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

/**
 * Sanitize data for export (remove nested objects, format values)
 */
export const sanitizeForExport = <T extends Record<string, any>>(
  data: T[],
  customFormatters?: Record<string, (value: any, row: T) => any>
): Record<string, any>[] => {
  return data.map((row) => {
    const sanitized: Record<string, any> = {};
    
    Object.keys(row).forEach((key) => {
      const value = row[key];
      
      // Use custom formatter if provided
      if (customFormatters && customFormatters[key]) {
        sanitized[key] = customFormatters[key](value, row);
        return;
      }
      
      // Handle different value types
      if (value === null || value === undefined) {
        sanitized[key] = '';
      } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // For nested objects, convert to JSON string or skip
        sanitized[key] = JSON.stringify(value).replace(/"/g, '');
      } else if (Array.isArray(value)) {
        // For arrays, join with commas
        sanitized[key] = value.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
      } else if (typeof value === 'string') {
        // Clean up string values
        sanitized[key] = value.replace(/\n/g, ' ').replace(/\r/g, '');
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  });
};