/**
 * @file PDF List Export Service  
 * @description PDF export functionality for entity lists
 * @created 2025-05-28
 */

// Company information
const COMPANY_INFO = {
  name: 'Molino RENTAL CRM',
  address: 'Váci út 1., 1133 Budapest',
  phone: '+36 1 234 5678',
  email: 'info@molino-rental.hu'
};

interface PDFListOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  filename: string;
}

/**
 * Generate HTML template for list PDF
 */
function generateListHTML(options: PDFListOptions): string {
  const tableRowsHTML = options.rows.map(row => `
    <tr>
      ${row.map(cell => `<td style="padding: 8px; border: 1px solid #ddd;">${cell}</td>`).join('')}
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${options.title}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 15mm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 3px solid #1976d2;
        }
        .logo {
          background: #1976d2;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 12px;
        }
        .company-info {
          text-align: right;
          font-size: 10px;
          color: #666;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
          margin: 15px 0;
        }
        .subtitle {
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .table th {
          background: #f5f5f5;
          padding: 10px 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #ddd;
          font-size: 10px;
        }
        .table td {
          padding: 8px;
          border: 1px solid #ddd;
          font-size: 10px;
        }
        .table tbody tr:nth-child(even) {
          background: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">MOLINO<br>RENTAL</div>
        <div class="company-info">
          <div style="font-weight: bold;">${COMPANY_INFO.name}</div>
          <div>${COMPANY_INFO.address}</div>
          <div>${COMPANY_INFO.phone}</div>
          <div>${COMPANY_INFO.email}</div>
        </div>
      </div>

      <div class="title">${options.title}</div>
      ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}

      <table class="table">
        <thead>
          <tr>
            ${options.headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRowsHTML}
        </tbody>
      </table>

      <div class="footer">
        <div>Generálva: ${new Date().toLocaleDateString('hu-HU')} | ${COMPANY_INFO.name}</div>
        <div>Oldal 1</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export functions for different entity lists
 */
export function generatePropertiesListHTML(properties: any[]): string {
  const headers = ['Utca', 'Város', 'Típus', 'Státusz', 'Méret', 'Szobák', 'Bérleti díj', 'Tulajdonos', 'Bérlő'];
  
  const rows = properties.map(property => [
    property.street,
    property.city,
    property.type,
    property.status,
    property.size ? `${property.size} m²` : '-',
    property.rooms?.toString() || '-',
    property.rentAmount ? `${Number(property.rentAmount).toLocaleString()} ${property.currency}` : '-',
    property.owner?.user?.name || '-',
    property.currentTenant?.user?.name || '-'
  ]);

  return generateListHTML({
    title: 'Ingatlanok listája',
    subtitle: `Összesen: ${properties.length} ingatlan`,
    headers,
    rows,
    filename: `ingatlanok-${new Date().toISOString().split('T')[0]}.pdf`
  });
}

export function generateOwnersListHTML(owners: any[]): string {
  const headers = ['Név', 'Email', 'Telefon', 'Adószám', 'Ingatlanok száma', 'Regisztráció'];
  
  const rows = owners.map(owner => [
    owner.user.name,
    owner.user.email,
    owner.user.phone || '-',
    owner.taxNumber || '-',
    (owner._count?.properties || 0).toString(),
    new Date(owner.createdAt).toLocaleDateString('hu-HU')
  ]);

  return generateListHTML({
    title: 'Tulajdonosok listája',
    subtitle: `Összesen: ${owners.length} tulajdonos`,
    headers,
    rows,
    filename: `tulajdonosok-${new Date().toISOString().split('T')[0]}.pdf`
  });
}

export function generateTenantsListHTML(tenants: any[]): string {
  const headers = ['Név', 'Email', 'Telefon', 'Vészhelyzeti kontakt', 'Státusz', 'Ingatlanok', 'Regisztráció'];
  
  const rows = tenants.map(tenant => [
    tenant.user.name,
    tenant.user.email,
    tenant.user.phone || '-',
    tenant.emergencyName ? `${tenant.emergencyName} (${tenant.emergencyPhone})` : '-',
    tenant.isActive ? 'Aktív' : 'Inaktív',
    (tenant._count?.properties || 0).toString(),
    new Date(tenant.createdAt).toLocaleDateString('hu-HU')
  ]);

  return generateListHTML({
    title: 'Bérlők listája',
    subtitle: `Összesen: ${tenants.length} bérlő`,
    headers,
    rows,
    filename: `berlok-${new Date().toISOString().split('T')[0]}.pdf`
  });
}

export function generateIssuesListHTML(issues: any[]): string {
  const headers = ['Jegy száma', 'Cím', 'Kategória', 'Prioritás', 'Státusz', 'Ingatlan', 'Bejelentő', 'Hozzárendelve', 'Létrehozva'];
  
  const rows = issues.map(issue => [
    issue.ticketNumber,
    issue.title,
    issue.category,
    issue.priority,
    issue.status,
    `${issue.property.street}, ${issue.property.city}`,
    issue.reportedBy.name,
    issue.assignedTo?.user?.name || '-',
    new Date(issue.createdAt).toLocaleDateString('hu-HU')
  ]);

  return generateListHTML({
    title: 'Hibabejelentések listája',
    subtitle: `Összesen: ${issues.length} hibabejelentés`,
    headers,
    rows,
    filename: `hibabejelentesek-${new Date().toISOString().split('T')[0]}.pdf`
  });
}

export function generateOffersListHTML(offers: any[]): string {
  const headers = ['Ajánlat száma', 'Ingatlan', 'Hibabejelentés', 'Összeg', 'Státusz', 'Készítette', 'Létrehozva', 'Érvényes'];
  
  const rows = offers.map(offer => [
    offer.offerNumber,
    `${offer.property.street}, ${offer.property.city}`,
    offer.issue?.title || '-',
    `${Number(offer.totalAmount).toLocaleString()} ${offer.currency}`,
    offer.status,
    offer.createdBy.name,
    new Date(offer.createdAt).toLocaleDateString('hu-HU'),
    new Date(offer.validUntil).toLocaleDateString('hu-HU')
  ]);

  return generateListHTML({
    title: 'Ajánlatok listája',
    subtitle: `Összesen: ${offers.length} ajánlat`,
    headers,
    rows,
    filename: `ajanlatok-${new Date().toISOString().split('T')[0]}.pdf`
  });
}

export function generateProvidersListHTML(providers: any[]): string {
  const headers = ['Név', 'Cégnév', 'Email', 'Telefon', 'Szakterületek', 'Óradíj', 'Értékelés', 'Feladatok'];
  
  const rows = providers.map(provider => [
    provider.user.name,
    provider.businessName,
    provider.user.email,
    provider.user.phone || '-',
    provider.specialty?.join(', ') || '-',
    provider.hourlyRate ? `${Number(provider.hourlyRate).toLocaleString()} ${provider.currency}` : '-',
    provider.rating?.toString() || '-',
    (provider._count?.assignedIssues || 0).toString()
  ]);

  return generateListHTML({
    title: 'Szolgáltatók listája',
    subtitle: `Összesen: ${providers.length} szolgáltató`,
    headers,
    rows,
    filename: `szolgaltatok-${new Date().toISOString().split('T')[0]}.pdf`
  });
}