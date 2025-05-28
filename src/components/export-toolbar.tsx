'use client';

import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportToolbarProps {
  entityType: 'properties' | 'owners' | 'tenants' | 'issues' | 'offers' | 'providers';
  title: string;
}

export function ExportToolbar({ entityType, title }: ExportToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/excel?type=${entityType}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export sikertelen (${response.status})`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel export sikeres!');
    } catch (error) {
      console.error('Excel export hiba:', error);
      toast.error(error instanceof Error ? error.message : 'Hiba történt az exportálás során');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/html?type=${entityType}&list=true`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export sikertelen (${response.status})`);
      }
      
      const html = await response.text();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Engedélyezze a felugró ablakokat a PDF exportáláshoz');
        return;
      }
      
      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
      };
      
      toast.success('PDF export ablak megnyitva');
    } catch (error) {
      console.error('PDF export hiba:', error);
      toast.error(error instanceof Error ? error.message : 'Hiba történt az exportálás során');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePDFExport}
        disabled={isExporting}
        className="px-2 sm:px-3"
      >
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">PDF</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExcelExport}
        disabled={isExporting}
        className="px-2 sm:px-3"
      >
        <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Excel</span>
      </Button>
    </div>
  );
}