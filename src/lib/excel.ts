/**
 * @file Excel Export Service
 * @description Excel export functionality for data tables
 * @created 2025-05-28
 */

import ExcelJS from 'exceljs';

// Company information
const COMPANY_INFO = {
  name: 'Molino RENTAL CRM',
  address: 'Váci út 1., 1133 Budapest',
  phone: '+36 1 234 5678',
  email: 'info@molino-rental.hu'
};

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: any;
}

interface ExcelExportOptions {
  title: string;
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
  includeTimestamp?: boolean;
}

/**
 * Generate Excel workbook from data
 */
export async function generateExcel(options: ExcelExportOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName);

  // Set workbook properties
  workbook.creator = COMPANY_INFO.name;
  workbook.created = new Date();
  workbook.modified = new Date();

  // Add title row
  worksheet.mergeCells('A1', `${String.fromCharCode(64 + options.columns.length)}1`);
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = options.title;
  titleRow.getCell(1).font = { name: 'Arial', size: 16, bold: true };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 30;

  // Add company info
  worksheet.mergeCells('A2', `${String.fromCharCode(64 + options.columns.length)}2`);
  const infoRow = worksheet.getRow(2);
  infoRow.getCell(1).value = `${COMPANY_INFO.name} | ${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`;
  infoRow.getCell(1).font = { name: 'Arial', size: 10, color: { argb: 'FF666666' } };
  infoRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  infoRow.height = 20;

  // Add timestamp if requested
  if (options.includeTimestamp) {
    worksheet.mergeCells('A3', `${String.fromCharCode(64 + options.columns.length)}3`);
    const timestampRow = worksheet.getRow(3);
    timestampRow.getCell(1).value = `Generálva: ${new Date().toLocaleString('hu-HU')}`;
    timestampRow.getCell(1).font = { name: 'Arial', size: 9, color: { argb: 'FF999999' } };
    timestampRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    timestampRow.height = 18;
  }

  // Add header row
  const headerRowNumber = options.includeTimestamp ? 5 : 4;
  const headerRow = worksheet.getRow(headerRowNumber);
  
  options.columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
  headerRow.height = 25;

  // Set column properties
  worksheet.columns = options.columns.map(col => ({
    key: col.key,
    width: col.width || 15,
    style: col.style || { font: { name: 'Arial', size: 10 } }
  }));

  // Add data rows
  options.data.forEach((rowData, rowIndex) => {
    const row = worksheet.addRow(rowData);
    
    // Alternate row colors
    if (rowIndex % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      });
    }

    // Add borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  // Auto-fit columns (approximate)
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export functions for different entities
 */
export async function exportPropertiesToExcel(properties: any[]): Promise<Buffer> {
  const data = properties.map(property => ({
    street: property.street,
    city: property.city,
    type: property.type,
    status: property.status,
    size: property.size ? `${property.size} m²` : '-',
    rooms: property.rooms || '-',
    rentAmount: property.rentAmount ? `${Number(property.rentAmount).toLocaleString()} ${property.currency}` : '-',
    owner: property.owner?.user?.name || '-',
    tenant: property.currentTenant?.user?.name || '-'
  }));

  return generateExcel({
    title: 'Ingatlanok listája',
    filename: `ingatlanok-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Ingatlanok',
    columns: [
      { header: 'Utca', key: 'street', width: 30 },
      { header: 'Város', key: 'city', width: 20 },
      { header: 'Típus', key: 'type', width: 15 },
      { header: 'Státusz', key: 'status', width: 15 },
      { header: 'Méret', key: 'size', width: 12 },
      { header: 'Szobák', key: 'rooms', width: 10 },
      { header: 'Bérleti díj', key: 'rentAmount', width: 20 },
      { header: 'Tulajdonos', key: 'owner', width: 25 },
      { header: 'Bérlő', key: 'tenant', width: 25 }
    ],
    data,
    includeTimestamp: true
  });
}

export async function exportOwnersToExcel(owners: any[]): Promise<Buffer> {
  const data = owners.map(owner => ({
    name: owner.user.name,
    email: owner.user.email,
    phone: owner.user.phone || '-',
    taxNumber: owner.taxNumber || '-',
    propertyCount: owner._count?.properties || 0,
    registrationDate: new Date(owner.createdAt).toLocaleDateString('hu-HU')
  }));

  return generateExcel({
    title: 'Tulajdonosok listája',
    filename: `tulajdonosok-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Tulajdonosok',
    columns: [
      { header: 'Név', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefon', key: 'phone', width: 20 },
      { header: 'Adószám', key: 'taxNumber', width: 20 },
      { header: 'Ingatlanok száma', key: 'propertyCount', width: 18 },
      { header: 'Regisztráció', key: 'registrationDate', width: 15 }
    ],
    data,
    includeTimestamp: true
  });
}

export async function exportTenantsToExcel(tenants: any[]): Promise<Buffer> {
  const data = tenants.map(tenant => ({
    name: tenant.user.name,
    email: tenant.user.email,
    phone: tenant.user.phone || '-',
    emergencyContact: tenant.emergencyName ? `${tenant.emergencyName} (${tenant.emergencyPhone})` : '-',
    active: tenant.isActive ? 'Aktív' : 'Inaktív',
    propertyCount: tenant._count?.properties || 0,
    registrationDate: new Date(tenant.createdAt).toLocaleDateString('hu-HU')
  }));

  return generateExcel({
    title: 'Bérlők listája',
    filename: `berlok-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Bérlők',
    columns: [
      { header: 'Név', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefon', key: 'phone', width: 20 },
      { header: 'Vészhelyzeti kontakt', key: 'emergencyContact', width: 35 },
      { header: 'Státusz', key: 'active', width: 12 },
      { header: 'Ingatlanok', key: 'propertyCount', width: 12 },
      { header: 'Regisztráció', key: 'registrationDate', width: 15 }
    ],
    data,
    includeTimestamp: true
  });
}

export async function exportIssuesToExcel(issues: any[]): Promise<Buffer> {
  const data = issues.map(issue => ({
    ticketNumber: issue.ticketNumber,
    title: issue.title,
    category: issue.category,
    priority: issue.priority,
    status: issue.status,
    property: `${issue.property.street}, ${issue.property.city}`,
    reportedBy: issue.reportedBy.name,
    assignedTo: issue.assignedTo?.user?.name || '-',
    createdAt: new Date(issue.createdAt).toLocaleDateString('hu-HU'),
    scheduledDate: issue.scheduledDate ? new Date(issue.scheduledDate).toLocaleDateString('hu-HU') : '-'
  }));

  return generateExcel({
    title: 'Hibabejelentések listája',
    filename: `hibabejelentesek-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Hibabejelentések',
    columns: [
      { header: 'Jegy száma', key: 'ticketNumber', width: 18 },
      { header: 'Cím', key: 'title', width: 35 },
      { header: 'Kategória', key: 'category', width: 15 },
      { header: 'Prioritás', key: 'priority', width: 12 },
      { header: 'Státusz', key: 'status', width: 15 },
      { header: 'Ingatlan', key: 'property', width: 30 },
      { header: 'Bejelentő', key: 'reportedBy', width: 20 },
      { header: 'Hozzárendelve', key: 'assignedTo', width: 20 },
      { header: 'Létrehozva', key: 'createdAt', width: 15 },
      { header: 'Ütemezve', key: 'scheduledDate', width: 15 }
    ],
    data,
    includeTimestamp: true
  });
}

export async function exportOffersToExcel(offers: any[]): Promise<Buffer> {
  const data = offers.map(offer => ({
    offerNumber: offer.offerNumber,
    property: `${offer.property.street}, ${offer.property.city}`,
    issue: offer.issue?.title || '-',
    totalAmount: `${Number(offer.totalAmount).toLocaleString()} ${offer.currency}`,
    status: offer.status,
    createdBy: offer.createdBy.name,
    createdAt: new Date(offer.createdAt).toLocaleDateString('hu-HU'),
    validUntil: new Date(offer.validUntil).toLocaleDateString('hu-HU')
  }));

  return generateExcel({
    title: 'Ajánlatok listája',
    filename: `ajanlatok-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Ajánlatok',
    columns: [
      { header: 'Ajánlat száma', key: 'offerNumber', width: 20 },
      { header: 'Ingatlan', key: 'property', width: 35 },
      { header: 'Hibabejelentés', key: 'issue', width: 30 },
      { header: 'Összeg', key: 'totalAmount', width: 20 },
      { header: 'Státusz', key: 'status', width: 15 },
      { header: 'Készítette', key: 'createdBy', width: 20 },
      { header: 'Létrehozva', key: 'createdAt', width: 15 },
      { header: 'Érvényes', key: 'validUntil', width: 15 }
    ],
    data,
    includeTimestamp: true
  });
}

export async function exportProvidersToExcel(providers: any[]): Promise<Buffer> {
  const data = providers.map(provider => ({
    name: provider.user.name,
    businessName: provider.businessName,
    email: provider.user.email,
    phone: provider.user.phone || '-',
    specialties: provider.specialty?.join(', ') || '-',
    hourlyRate: provider.hourlyRate ? `${Number(provider.hourlyRate).toLocaleString()} ${provider.currency}` : '-',
    rating: provider.rating || '-',
    assignedIssues: provider._count?.assignedIssues || 0
  }));

  return generateExcel({
    title: 'Szolgáltatók listája',
    filename: `szolgaltatok-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Szolgáltatók',
    columns: [
      { header: 'Név', key: 'name', width: 25 },
      { header: 'Cégnév', key: 'businessName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefon', key: 'phone', width: 20 },
      { header: 'Szakterületek', key: 'specialties', width: 35 },
      { header: 'Óradíj', key: 'hourlyRate', width: 20 },
      { header: 'Értékelés', key: 'rating', width: 12 },
      { header: 'Feladatok', key: 'assignedIssues', width: 12 }
    ],
    data,
    includeTimestamp: true
  });
}