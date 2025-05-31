/**
 * @file PDF Export Hook
 * @description Custom hook for PDF export functionality
 * @created 2025-05-28
 */

import { useState } from 'react';

interface ExportOptions {
  type: 'offer' | 'report' | 'test';
  id?: string;
  data?: any;
}

export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportHTML = async (options: ExportOptions) => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/export/html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const html = await response.text();
      
      // Open HTML in new window for printing/PDF save
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load, then trigger print dialog
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        throw new Error('Unable to open print window. Please check popup blocker settings.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadHTML = async (options: ExportOptions, filename?: string) => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/export/html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const html = await response.text();
      
      // Create download link
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `export-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    exportHTML,
    downloadHTML,
    isExporting,
    error,
    clearError,
  };
}