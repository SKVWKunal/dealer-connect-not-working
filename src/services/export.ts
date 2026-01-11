/**
 * Export Service
 * 
 * Handles client-side Excel/CSV export functionality.
 * Uses native browser APIs for file generation.
 */

import { auditService } from './audit';
import { authService } from './auth';
import { ModuleKey } from '@/types';

interface ExportOptions {
  filename: string;
  format: 'csv' | 'xlsx';
  module: ModuleKey;
}

class ExportService {
  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  async exportToCSV<T extends Record<string, any>>(
    data: T[],
    columns: { key: keyof T; header: string }[],
    options: ExportOptions
  ): Promise<void> {
    const user = authService.getCurrentUser();
    
    // Create CSV content
    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(item =>
      columns.map(col => this.escapeCSVValue(item[col.key])).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${options.filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    // Log audit
    if (user) {
      await auditService.log({
        userId: user.id,
        userEmail: user.email,
        role: user.role,
        module: options.module,
        action: 'export',
        details: {
          format: 'csv',
          filename: options.filename,
          rowCount: data.length
        },
        notes: `Exported ${data.length} records to CSV`
      });
    }
  }

  async exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: { key: keyof T; header: string }[],
    options: ExportOptions
  ): Promise<void> {
    // For prototype, we'll use CSV format for Excel
    // In production, use a library like xlsx or exceljs
    await this.exportToCSV(data, columns, { ...options, format: 'csv' });
  }
}

export const exportService = new ExportService();
