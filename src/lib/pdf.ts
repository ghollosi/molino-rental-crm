/**
 * @file PDF Generation Service
 * @description PDF export functionality for reports and offers using HTML templates
 * @created 2025-05-28
 * @see DEVELOPMENT_DOCS.md - PDF Export
 */

import puppeteer from 'puppeteer';

// Company information for PDF header
const COMPANY_INFO = {
  name: 'Molino RENTAL CRM',
  address: 'Váci út 1., 1133 Budapest',
  phone: '+36 1 234 5678',
  email: 'info@molino-rental.hu',
  website: 'www.molino-rental.hu'
};

export interface PDFOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}

export interface OfferData {
  id: string;
  offerNumber: string;
  property: {
    street: string;
    city: string;
    owner: { user: { name: string; email: string } };
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  laborCost: number;
  materialCost: number;
  totalAmount: number;
  currency: string;
  validUntil: Date;
  notes?: string | null;
  createdAt: Date;
  createdBy: { name: string };
}

export interface ReportData {
  title: string;
  period: string;
  data: Array<{
    label: string;
    value: string | number;
    type?: 'text' | 'number' | 'currency';
  }>;
  charts?: Array<{
    title: string;
    data: Array<{ label: string; value: number }>;
  }>;
}

/**
 * Base PDF class with common functionality
 */
class BasePDF {
  protected doc: jsPDF;
  protected margin: number;
  protected currentY: number;
  protected pageWidth: number;
  protected pageHeight: number;

  constructor(options: PDFOptions) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    this.margin = options.margin || 20;
    this.currentY = this.margin;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    this.addHeader(options.title, options.subtitle);
  }

  protected addHeader(title: string, subtitle?: string) {
    // Company logo area (placeholder)
    this.doc.setFillColor(25, 118, 210);
    this.doc.rect(this.margin, this.margin, 40, 20, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('MOLINO', this.margin + 2, this.margin + 8);
    this.doc.text('RENTAL', this.margin + 2, this.margin + 15);

    // Company info
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    
    const infoX = this.pageWidth - this.margin - 50;
    this.doc.text(COMPANY_INFO.name, infoX, this.margin + 5);
    this.doc.text(COMPANY_INFO.address, infoX, this.margin + 10);
    this.doc.text(COMPANY_INFO.phone, infoX, this.margin + 15);
    this.doc.text(COMPANY_INFO.email, infoX, this.margin + 20);

    this.currentY = this.margin + 30;

    // Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;

    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, this.margin, this.currentY);
      this.currentY += 8;
    }

    this.currentY += 10;
  }

  protected addFooter() {
    const footerY = this.pageHeight - 15;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    
    // Page number
    const pageNum = this.doc.internal.getCurrentPageInfo().pageNumber;
    this.doc.text(`Oldal ${pageNum}`, this.pageWidth - this.margin - 20, footerY);
    
    // Generation date
    const now = new Date().toLocaleDateString('hu-HU');
    this.doc.text(`Generálva: ${now}`, this.margin, footerY);
    
    // Divider line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
  }

  protected checkPageBreak(requiredSpace: number = 20) {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.addFooter();
      this.doc.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  protected addSection(title: string) {
    this.checkPageBreak(20);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(25, 118, 210);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;

    // Underline
    this.doc.setDrawColor(25, 118, 210);
    this.doc.line(this.margin, this.currentY, this.margin + 50, this.currentY);
    this.currentY += 10;

    this.doc.setTextColor(0, 0, 0);
  }

  protected addTable(headers: string[], rows: string[][], columnWidths?: number[]) {
    const startY = this.currentY;
    const rowHeight = 8;
    const headerHeight = 10;
    
    // Calculate column widths if not provided
    if (!columnWidths) {
      const availableWidth = this.pageWidth - (this.margin * 2);
      const colWidth = availableWidth / headers.length;
      columnWidths = new Array(headers.length).fill(colWidth);
    }

    // Check if table fits on current page
    const tableHeight = headerHeight + (rows.length * rowHeight);
    this.checkPageBreak(tableHeight + 10);

    let currentX = this.margin;

    // Draw header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), headerHeight, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    for (let i = 0; i < headers.length; i++) {
      this.doc.text(headers[i], currentX + 2, this.currentY + 6);
      currentX += columnWidths[i];
    }

    this.currentY += headerHeight;

    // Draw rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);

    for (let i = 0; i < rows.length; i++) {
      currentX = this.margin;
      
      // Alternate row background
      if (i % 2 === 1) {
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), rowHeight, 'F');
      }

      for (let j = 0; j < rows[i].length; j++) {
        this.doc.text(rows[i][j], currentX + 2, this.currentY + 5);
        currentX += columnWidths[j];
      }

      this.currentY += rowHeight;
    }

    // Draw table border
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, startY, this.pageWidth - (this.margin * 2), this.currentY - startY);

    // Draw column separators
    currentX = this.margin;
    for (let i = 0; i < columnWidths.length - 1; i++) {
      currentX += columnWidths[i];
      this.doc.line(currentX, startY, currentX, this.currentY);
    }

    this.currentY += 5;
  }

  public save(filename: string) {
    this.addFooter();
    return this.doc.save(filename);
  }

  public output(type: 'blob' | 'arraybuffer' | 'datauristring' = 'blob') {
    this.addFooter();
    return this.doc.output(type);
  }
}

/**
 * Generate PDF for offers
 */
export class OfferPDF extends BasePDF {
  constructor(data: OfferData) {
    super({
      title: `Ajánlat - ${data.offerNumber}`,
      subtitle: `${data.property.street}, ${data.property.city}`,
      orientation: 'portrait'
    });

    this.generateContent(data);
  }

  private generateContent(data: OfferData) {
    // Offer details section
    this.addSection('Ajánlat részletei');
    
    const detailsData = [
      ['Ajánlat száma:', data.offerNumber],
      ['Dátum:', data.createdAt.toLocaleDateString('hu-HU')],
      ['Érvényes:', data.validUntil.toLocaleDateString('hu-HU') + '-ig'],
      ['Készítette:', data.createdBy.name],
      ['Ingatlan:', `${data.property.street}, ${data.property.city}`],
      ['Tulajdonos:', data.property.owner.user.name],
      ['Email:', data.property.owner.user.email]
    ];

    let currentY = this.currentY;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');

    for (const [label, value] of detailsData) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin, currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, this.margin + 40, currentY);
      currentY += 6;
    }

    this.currentY = currentY + 10;

    // Items section
    this.addSection('Ajánlat tételei');
    
    const headers = ['Megnevezés', 'Mennyiség', 'Egységár', 'Összeg'];
    const rows = data.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${item.unitPrice.toLocaleString()} ${data.currency}`,
      `${item.total.toLocaleString()} ${data.currency}`
    ]);

    this.addTable(headers, rows, [80, 25, 30, 30]);

    // Summary section
    this.addSection('Összesítés');
    
    const summaryRows = [
      ['Anyagköltség:', `${data.materialCost.toLocaleString()} ${data.currency}`],
      ['Munkadíj:', `${data.laborCost.toLocaleString()} ${data.currency}`],
      ['Végösszeg:', `${data.totalAmount.toLocaleString()} ${data.currency}`]
    ];

    for (const [label, value] of summaryRows) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.pageWidth - this.margin - 80, this.currentY);
      this.doc.text(value, this.pageWidth - this.margin - 30, this.currentY);
      this.currentY += 8;
    }

    // Notes section
    if (data.notes) {
      this.currentY += 10;
      this.addSection('Megjegyzések');
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(data.notes, this.pageWidth - (this.margin * 2));
      this.doc.text(lines, this.margin, this.currentY);
      this.currentY += lines.length * 5;
    }

    // Terms section
    this.currentY += 15;
    this.addSection('Általános feltételek');
    
    const terms = [
      '• Az ajánlat a megadott dátumig érvényes.',
      '• Az árak az ÁFA-t tartalmazzák.',
      '• A munka megkezdése előtt írásos megrendelés szükséges.',
      '• A fizetés a munka befejezését követően esedékes.',
      '• Vis maior esetén késedelemért felelősséget nem vállalunk.'
    ];

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    for (const term of terms) {
      this.checkPageBreak(8);
      this.doc.text(term, this.margin, this.currentY);
      this.currentY += 6;
    }
  }
}

/**
 * Generate PDF for reports
 */
export class ReportPDF extends BasePDF {
  constructor(data: ReportData) {
    super({
      title: data.title,
      subtitle: data.period,
      orientation: 'portrait'
    });

    this.generateContent(data);
  }

  private generateContent(data: ReportData) {
    // Summary section
    this.addSection('Összesítő adatok');
    
    const rows = data.data.map(item => {
      let value = item.value.toString();
      if (item.type === 'currency') {
        value = `${Number(item.value).toLocaleString()} EUR`;
      } else if (item.type === 'number') {
        value = Number(item.value).toLocaleString();
      }
      return [item.label, value];
    });

    this.addTable(['Mutató', 'Érték'], rows, [100, 50]);

    // Charts section (simplified text representation)
    if (data.charts) {
      for (const chart of data.charts) {
        this.addSection(chart.title);
        
        const chartRows = chart.data.map(item => [
          item.label,
          item.value.toLocaleString()
        ]);
        
        this.addTable(['Kategória', 'Érték'], chartRows, [80, 40]);
      }
    }
  }
}

/**
 * Export functions
 */
export function generateOfferPDF(data: OfferData): Blob {
  const pdf = new OfferPDF(data);
  return pdf.output('blob') as Blob;
}

export function generateReportPDF(data: ReportData): Blob {
  const pdf = new ReportPDF(data);
  return pdf.output('blob') as Blob;
}

export function downloadOfferPDF(data: OfferData) {
  const pdf = new OfferPDF(data);
  pdf.save(`ajanlat-${data.offerNumber}.pdf`);
}

export function downloadReportPDF(data: ReportData, filename?: string) {
  const pdf = new ReportPDF(data);
  pdf.save(filename || `jelentes-${new Date().toISOString().split('T')[0]}.pdf`);
}