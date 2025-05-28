/**
 * @file PDF Generation Service
 * @description PDF export functionality using HTML templates and Puppeteer
 * @created 2025-05-28
 */

import puppeteer from 'puppeteer';

// Company information
const COMPANY_INFO = {
  name: 'Molino RENTAL CRM',
  address: 'Váci út 1., 1133 Budapest',
  phone: '+36 1 234 5678',
  email: 'info@molino-rental.hu',
  website: 'www.molino-rental.hu'
};

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
 * Generate CSS for PDF styling
 */
function getBaseCSS(): string {
  return `
    <style>
      @page {
        size: A4;
        margin: 20mm;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        font-size: 12px;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #1976d2;
      }
      
      .logo {
        background: linear-gradient(135deg, #1976d2, #1565c0);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 14px;
        text-align: center;
        min-width: 120px;
      }
      
      .company-info {
        text-align: right;
        font-size: 10px;
        color: #666;
        line-height: 1.4;
      }
      
      .title {
        font-size: 24px;
        font-weight: bold;
        color: #1976d2;
        margin: 20px 0 10px 0;
      }
      
      .subtitle {
        font-size: 16px;
        color: #666;
        margin-bottom: 30px;
      }
      
      .section {
        margin: 25px 0;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #1976d2;
        margin-bottom: 15px;
        padding-bottom: 5px;
        border-bottom: 1px solid #1976d2;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .detail-item {
        display: flex;
        border-bottom: 1px solid #eee;
        padding: 5px 0;
      }
      
      .detail-label {
        font-weight: bold;
        width: 120px;
        color: #555;
      }
      
      .detail-value {
        flex: 1;
      }
      
      .table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .table th {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 12px 8px;
        text-align: left;
        font-weight: bold;
        border: 1px solid #dee2e6;
        font-size: 11px;
      }
      
      .table td {
        padding: 10px 8px;
        border: 1px solid #dee2e6;
        font-size: 10px;
      }
      
      .table tbody tr:nth-child(even) {
        background: #f8f9fa;
      }
      
      .summary {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #dee2e6;
      }
      
      .summary-row:last-child {
        border-bottom: none;
        font-weight: bold;
        font-size: 14px;
        background: #1976d2;
        color: white;
        padding: 12px;
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
        font-size: 10px;
        color: #666;
        line-height: 1.5;
        margin-top: 30px;
      }
      
      .terms ul {
        list-style: none;
        padding: 0;
      }
      
      .terms li {
        margin: 5px 0;
        padding-left: 15px;
        position: relative;
      }
      
      .terms li:before {
        content: "•";
        color: #1976d2;
        font-weight: bold;
        position: absolute;
        left: 0;
      }
      
      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30px;
        background: white;
        border-top: 1px solid #eee;
        padding: 10px 20mm;
        font-size: 10px;
        color: #666;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .text-right {
        text-align: right;
      }
      
      .text-center {
        text-align: center;
      }
      
      .font-bold {
        font-weight: bold;
      }
      
      .currency {
        font-family: 'Courier New', monospace;
        font-weight: bold;
      }
    </style>
  `;
}

/**
 * Generate HTML template for offer PDF
 */
function generateOfferHTML(data: OfferData): string {
  const validUntilStr = data.validUntil.toLocaleDateString('hu-HU');
  const createdAtStr = data.createdAt.toLocaleDateString('hu-HU');
  
  const itemsHTML = data.items.map(item => `
    <tr>
      <td>${item.description}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right currency">${item.unitPrice.toLocaleString()} ${data.currency}</td>
      <td class="text-right currency font-bold">${item.total.toLocaleString()} ${data.currency}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ajánlat - ${data.offerNumber}</title>
      ${getBaseCSS()}
    </head>
    <body>
      <div class="header">
        <div class="logo">
          MOLINO<br>RENTAL
        </div>
        <div class="company-info">
          <div class="font-bold">${COMPANY_INFO.name}</div>
          <div>${COMPANY_INFO.address}</div>
          <div>${COMPANY_INFO.phone}</div>
          <div>${COMPANY_INFO.email}</div>
        </div>
      </div>

      <div class="title">Ajánlat</div>
      <div class="subtitle">${data.offerNumber}</div>

      <div class="section">
        <div class="section-title">Ajánlat részletei</div>
        <div class="details-grid">
          <div>
            <div class="detail-item">
              <span class="detail-label">Ajánlat száma:</span>
              <span class="detail-value font-bold">${data.offerNumber}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Dátum:</span>
              <span class="detail-value">${createdAtStr}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Érvényes:</span>
              <span class="detail-value">${validUntilStr}-ig</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Készítette:</span>
              <span class="detail-value">${data.createdBy.name}</span>
            </div>
          </div>
          <div>
            <div class="detail-item">
              <span class="detail-label">Ingatlan:</span>
              <span class="detail-value">${data.property.street}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Város:</span>
              <span class="detail-value">${data.property.city}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tulajdonos:</span>
              <span class="detail-value">${data.property.owner.user.name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${data.property.owner.user.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Ajánlat tételei</div>
        <table class="table">
          <thead>
            <tr>
              <th>Megnevezés</th>
              <th style="width: 80px;" class="text-center">Mennyiség</th>
              <th style="width: 100px;" class="text-right">Egységár</th>
              <th style="width: 100px;" class="text-right">Összeg</th>
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
            <span class="currency">${data.materialCost.toLocaleString()} ${data.currency}</span>
          </div>
          <div class="summary-row">
            <span>Munkadíj:</span>
            <span class="currency">${data.laborCost.toLocaleString()} ${data.currency}</span>
          </div>
          <div class="summary-row">
            <span>Végösszeg:</span>
            <span class="currency">${data.totalAmount.toLocaleString()} ${data.currency}</span>
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
          <ul>
            <li>Az ajánlat a megadott dátumig érvényes.</li>
            <li>Az árak az ÁFA-t tartalmazzák.</li>
            <li>A munka megkezdése előtt írásos megrendelés szükséges.</li>
            <li>A fizetés a munka befejezését követően esedékes.</li>
            <li>Vis maior esetén késedelemért felelősséget nem vállalunk.</li>
          </ul>
        </div>
      </div>

      <div class="footer">
        <span>Generálva: ${new Date().toLocaleDateString('hu-HU')}</span>
        <span>${COMPANY_INFO.name}</span>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML template for report PDF
 */
function generateReportHTML(data: ReportData): string {
  const dataRowsHTML = data.data.map(item => {
    let value = item.value.toString();
    if (item.type === 'currency') {
      value = `${Number(item.value).toLocaleString()} EUR`;
    } else if (item.type === 'number') {
      value = Number(item.value).toLocaleString();
    }
    
    return `
      <tr>
        <td>${item.label}</td>
        <td class="text-right font-bold">${value}</td>
      </tr>
    `;
  }).join('');

  const chartsHTML = data.charts ? data.charts.map(chart => `
    <div class="section">
      <div class="section-title">${chart.title}</div>
      <table class="table">
        <thead>
          <tr>
            <th>Kategória</th>
            <th class="text-right">Érték</th>
          </tr>
        </thead>
        <tbody>
          ${chart.data.map(item => `
            <tr>
              <td>${item.label}</td>
              <td class="text-right font-bold">${item.value.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('') : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.title}</title>
      ${getBaseCSS()}
    </head>
    <body>
      <div class="header">
        <div class="logo">
          MOLINO<br>RENTAL
        </div>
        <div class="company-info">
          <div class="font-bold">${COMPANY_INFO.name}</div>
          <div>${COMPANY_INFO.address}</div>
          <div>${COMPANY_INFO.phone}</div>
          <div>${COMPANY_INFO.email}</div>
        </div>
      </div>

      <div class="title">${data.title}</div>
      <div class="subtitle">${data.period}</div>

      <div class="section">
        <div class="section-title">Összesítő adatok</div>
        <table class="table">
          <thead>
            <tr>
              <th>Mutató</th>
              <th class="text-right" style="width: 150px;">Érték</th>
            </tr>
          </thead>
          <tbody>
            ${dataRowsHTML}
          </tbody>
        </table>
      </div>

      ${chartsHTML}

      <div class="footer">
        <span>Generálva: ${new Date().toLocaleDateString('hu-HU')}</span>
        <span>${COMPANY_INFO.name}</span>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate PDF from HTML using Puppeteer
 */
async function generatePDFFromHTML(html: string): Promise<Buffer> {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Export functions
 */
export async function generateOfferPDF(data: OfferData): Promise<Buffer> {
  const html = generateOfferHTML(data);
  return await generatePDFFromHTML(html);
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  const html = generateReportHTML(data);
  return await generatePDFFromHTML(html);
}