/**
 * @file Simple PDF Generation Service
 * @description Simple PDF export using browser-compatible approach
 * @created 2025-05-28
 */

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
  notes?: string;
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
 * Generate HTML content for offer
 */
export function generateOfferHTML(data: OfferData): string {
  const validUntilStr = data.validUntil.toLocaleDateString('hu-HU');
  const createdAtStr = data.createdAt.toLocaleDateString('hu-HU');
  
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.description}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.unitPrice.toLocaleString()} ${data.currency}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${item.total.toLocaleString()} ${data.currency}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ajánlat - ${data.offerNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #1976d2;
        }
        .logo {
          background: #1976d2;
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-weight: bold;
          text-align: center;
          min-width: 120px;
        }
        .company-info {
          text-align: right;
          font-size: 12px;
          color: #666;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1976d2;
          margin: 20px 0;
        }
        .section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 15px;
          border-bottom: 2px solid #1976d2;
          padding-bottom: 5px;
        }
        .details-table {
          width: 100%;
          margin-bottom: 20px;
        }
        .details-table td {
          padding: 8px;
          vertical-align: top;
        }
        .label {
          font-weight: bold;
          width: 150px;
          color: #555;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .table th {
          background: #f5f5f5;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        .table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .summary {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #ddd;
        }
        .summary-row.total {
          font-weight: bold;
          font-size: 16px;
          background: #1976d2;
          color: white;
          padding: 10px;
          margin: 10px -20px -20px -20px;
          border-radius: 0 0 8px 8px;
        }
        .notes {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .terms {
          font-size: 11px;
          color: #666;
          margin-top: 30px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          MOLINO<br>RENTAL
        </div>
        <div class="company-info">
          <div style="font-weight: bold;">Molino RENTAL CRM</div>
          <div>Váci út 1., 1133 Budapest</div>
          <div>+36 1 234 5678</div>
          <div>info@molino-rental.hu</div>
        </div>
      </div>

      <div class="title">Ajánlat - ${data.offerNumber}</div>

      <div class="section">
        <div class="section-title">Ajánlat részletei</div>
        <table class="details-table">
          <tr>
            <td class="label">Ajánlat száma:</td>
            <td><strong>${data.offerNumber}</strong></td>
            <td class="label">Dátum:</td>
            <td>${createdAtStr}</td>
          </tr>
          <tr>
            <td class="label">Érvényes:</td>
            <td>${validUntilStr}-ig</td>
            <td class="label">Készítette:</td>
            <td>${data.createdBy.name}</td>
          </tr>
          <tr>
            <td class="label">Ingatlan:</td>
            <td>${data.property.street}, ${data.property.city}</td>
            <td class="label">Tulajdonos:</td>
            <td>${data.property.owner.user.name}</td>
          </tr>
          <tr>
            <td class="label">Email:</td>
            <td colspan="3">${data.property.owner.user.email}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Ajánlat tételei</div>
        <table class="table">
          <thead>
            <tr>
              <th>Megnevezés</th>
              <th style="width: 80px;">Mennyiség</th>
              <th style="width: 120px;">Egységár</th>
              <th style="width: 120px;">Összeg</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Összesítés</div>
        <div class="summary">
          <div class="summary-row">
            <span>Anyagköltség:</span>
            <span>${data.materialCost.toLocaleString()} ${data.currency}</span>
          </div>
          <div class="summary-row">
            <span>Munkadíj:</span>
            <span>${data.laborCost.toLocaleString()} ${data.currency}</span>
          </div>
          <div class="summary-row total">
            <span>Végösszeg:</span>
            <span>${data.totalAmount.toLocaleString()} ${data.currency}</span>
          </div>
        </div>
      </div>

      ${data.notes ? `
        <div class="section">
          <div class="section-title">Megjegyzések</div>
          <div class="notes">
            ${data.notes.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Általános feltételek</div>
        <div class="terms">
          • Az ajánlat a megadott dátumig érvényes.<br>
          • Az árak az ÁFA-t tartalmazzák.<br>
          • A munka megkezdése előtt írásos megrendelés szükséges.<br>
          • A fizetés a munka befejezését követően esedékes.<br>
          • Vis maior esetén késedelemért felelősséget nem vállalunk.
        </div>
      </div>

      <div class="footer">
        Generálva: ${new Date().toLocaleDateString('hu-HU')} | Molino RENTAL CRM
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML content for report
 */
export function generateReportHTML(data: ReportData): string {
  const dataRowsHTML = data.data.map(item => {
    let value = item.value.toString();
    if (item.type === 'currency') {
      value = `${Number(item.value).toLocaleString()} EUR`;
    } else if (item.type === 'number') {
      value = Number(item.value).toLocaleString();
    }
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.label}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${value}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #1976d2;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #666;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .table th {
          background: #f5f5f5;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        .table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 15px;
          border-bottom: 2px solid #1976d2;
          padding-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${data.title}</div>
        <div class="subtitle">${data.period}</div>
      </div>

      <div class="section">
        <div class="section-title">Összesítő adatok</div>
        <table class="table">
          <thead>
            <tr>
              <th>Mutató</th>
              <th style="width: 200px; text-align: right;">Érték</th>
            </tr>
          </thead>
          <tbody>
            ${dataRowsHTML}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #666;">
        Generálva: ${new Date().toLocaleDateString('hu-HU')} | Molino RENTAL CRM
      </div>
    </body>
    </html>
  `;
}

/**
 * Simple PDF generation functions that return HTML
 * These can be used with window.print() or sent to a PDF service
 */
export async function generateOfferPDF(data: OfferData): Promise<string> {
  return generateOfferHTML(data);
}

export async function generateReportPDF(data: ReportData): Promise<string> {
  return generateReportHTML(data);
}