/**
 * @file Reports Generation API
 * @description Jelentések generálása és letöltése
 * @created 2025-05-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { generateOfferHTML } from '@/lib/pdf-simple'
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, format = 'pdf', filters = {} } = body

    console.log(`📊 Generating report: ${reportType} in ${format} format`)

    let reportData: any
    let fileName: string
    let content: Buffer | string

    switch (reportType) {
      case 'monthly-revenue':
        reportData = await generateMonthlyRevenueReport(filters)
        fileName = `havi-bevetel-${new Date().toISOString().slice(0, 7)}`
        break
        
      case 'issues-summary':
        reportData = await generateIssuesSummaryReport(filters)
        fileName = `hibabejelentesek-${new Date().toISOString().slice(0, 10)}`
        break
        
      case 'property-performance':
        reportData = await generatePropertyPerformanceReport(filters)
        fileName = `ingatlan-teljesitmeny-${new Date().toISOString().slice(0, 10)}`
        break
        
      case 'tenant-satisfaction':
        reportData = await generateTenantSatisfactionReport(filters)
        fileName = `berloi-elegedettseg-${new Date().toISOString().slice(0, 10)}`
        break
        
      default:
        return NextResponse.json(
          { error: 'Ismeretlen jelentés típus' },
          { status: 400 }
        )
    }

    if (format === 'excel') {
      content = await generateExcelReport(reportData, reportType)
      fileName += '.xlsx'
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    } else {
      // PDF format
      content = generateReportHTML(reportData, reportType)
      fileName += '.html'
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

  } catch (error) {
    console.error('❌ Report generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Jelentés generálás hiba',
        details: error instanceof Error ? error.message : 'Ismeretlen hiba'
      },
      { status: 500 }
    )
  }
}

// Havi bevételi jelentés
async function generateMonthlyRevenueReport(filters: any) {
  const now = new Date()
  const currentMonth = filters.month || now.getMonth() + 1
  const currentYear = filters.year || now.getFullYear()
  
  const startDate = new Date(currentYear, currentMonth - 1, 1)
  const endDate = new Date(currentYear, currentMonth, 0)

  // Bérleti díjak lekérése
  const rentals = await db.property.findMany({
    include: {
      currentTenant: {
        include: { user: true }
      },
      owner: {
        include: { user: true }
      }
    },
    where: {
      status: 'RENTED'
    }
  })

  const totalRevenue = rentals.reduce((sum, property) => 
    sum + Number((property as any).monthlyRent || 0), 0
  )

  const propertyCount = rentals.length
  const averageRent = propertyCount > 0 ? totalRevenue / propertyCount : 0

  return {
    title: `Havi bevételi jelentés - ${currentYear}. ${currentMonth.toString().padStart(2, '0')}`,
    period: { year: currentYear, month: currentMonth, startDate, endDate },
    summary: {
      totalRevenue,
      propertyCount,
      averageRent,
      occupancyRate: 85 // TODO: Kiszámolni valós adatokból
    },
    properties: rentals.map(property => ({
      id: property.id,
      address: `${property.street}, ${property.city}`,
      tenant: property.currentTenant?.user.name || 'N/A',
      owner: property.owner.user.name,
      monthlyRent: Number((property as any).monthlyRent || 0),
      status: property.status
    }))
  }
}

// Hibabejelentések összesítő
async function generateIssuesSummaryReport(filters: any) {
  const issues = await db.issue.findMany({
    include: {
      property: true,
      reportedBy: true,
      assignedTo: {
        include: { user: true }
      }
    },
    where: filters.propertyId ? { propertyId: filters.propertyId } : undefined,
    orderBy: { createdAt: 'desc' }
  })

  const statusCounts = {
    OPEN: issues.filter(i => i.status === 'OPEN').length,
    ASSIGNED: issues.filter(i => i.status === 'ASSIGNED').length,
    IN_PROGRESS: issues.filter(i => i.status === 'IN_PROGRESS').length,
    COMPLETED: issues.filter(i => i.status === 'COMPLETED').length,
    CLOSED: issues.filter(i => i.status === 'CLOSED').length
  }

  const priorityCounts = {
    LOW: issues.filter(i => i.priority === 'LOW').length,
    MEDIUM: issues.filter(i => i.priority === 'MEDIUM').length,
    HIGH: issues.filter(i => i.priority === 'HIGH').length,
    URGENT: issues.filter(i => i.priority === 'URGENT').length
  }

  return {
    title: 'Hibabejelentések összesítő jelentés',
    generatedAt: new Date(),
    summary: {
      totalIssues: issues.length,
      openIssues: statusCounts.OPEN + statusCounts.ASSIGNED + statusCounts.IN_PROGRESS,
      resolvedIssues: statusCounts.COMPLETED + statusCounts.CLOSED,
      averageResolutionTime: 2.5 // TODO: Kiszámolni valós adatokból
    },
    statusBreakdown: statusCounts,
    priorityBreakdown: priorityCounts,
    recentIssues: issues.slice(0, 20).map(issue => ({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      priority: issue.priority,
      property: `${issue.property.street}, ${issue.property.city}`,
      reportedBy: issue.reportedBy.name,
      assignedTo: issue.assignedTo?.user.name || 'Nincs hozzárendelve',
      createdAt: issue.createdAt
    }))
  }
}

// Ingatlan teljesítmény jelentés
async function generatePropertyPerformanceReport(filters: any) {
  const properties = await db.property.findMany({
    include: {
      owner: { include: { user: true } },
      currentTenant: { include: { user: true } },
      issues: true
    }
  })

  return {
    title: 'Ingatlan teljesítmény jelentés',
    generatedAt: new Date(),
    summary: {
      totalProperties: properties.length,
      rentedProperties: properties.filter(p => p.status === 'RENTED').length,
      availableProperties: properties.filter(p => p.status === 'AVAILABLE').length,
      averageRent: properties.reduce((sum, p) => sum + Number((p as any).monthlyRent || 0), 0) / properties.length
    },
    properties: properties.map(property => ({
      id: property.id,
      address: `${property.street}, ${property.city}`,
      type: property.type,
      status: property.status,
      monthlyRent: Number((property as any).monthlyRent || 0),
      owner: property.owner.user.name,
      tenant: property.currentTenant?.user.name || 'N/A',
      issueCount: property.issues.length,
      openIssueCount: property.issues.filter(i => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)).length
    }))
  }
}

// Bérlői elégedettség jelentés
async function generateTenantSatisfactionReport(filters: any) {
  const tenants = await db.tenant.findMany({
    include: {
      user: true,
      properties: {
        include: {
          issues: true
        }
      }
    }
  })

  return {
    title: 'Bérlői elégedettség jelentés',
    generatedAt: new Date(),
    summary: {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.properties.length > 0).length,
      averageSatisfaction: 4.2, // TODO: Valós elégedettségi felmérés alapján
      responseRate: 75
    },
    tenants: tenants.map(tenant => ({
      id: tenant.id,
      name: (tenant as any).user?.name || 'N/A',
      email: (tenant as any).user?.email || '',
      phone: (tenant as any).user?.phone || '',
      propertyCount: (tenant as any).properties?.length || 0,
      issueCount: (tenant as any).properties?.reduce((sum: number, p: any) => sum + (p.issues?.length || 0), 0) || 0,
      satisfactionScore: Math.floor(Math.random() * 2) + 4 // TODO: Valós adatok
    }))
  }
}

// Excel jelentés generálás
async function generateExcelReport(data: any, reportType: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Jelentés')

  // Fejléc stílus
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '366092' } },
    alignment: { horizontal: 'center' as const }
  }

  worksheet.addRow([data.title])
  worksheet.getRow(1).font = { bold: true, size: 16 }
  worksheet.addRow([`Generálva: ${new Date().toLocaleString('hu-HU')}`])
  worksheet.addRow([]) // Üres sor

  if (reportType === 'monthly-revenue') {
    // Összesítő
    worksheet.addRow(['ÖSSZESÍTŐ'])
    worksheet.getRow(4).font = { bold: true }
    worksheet.addRow(['Teljes bevétel:', `${data.summary.totalRevenue.toLocaleString('hu-HU')} Ft`])
    worksheet.addRow(['Ingatlanok száma:', data.summary.propertyCount])
    worksheet.addRow(['Átlagos bérleti díj:', `${Math.round(data.summary.averageRent).toLocaleString('hu-HU')} Ft`])
    worksheet.addRow([]) // Üres sor

    // Részletes lista
    worksheet.addRow(['RÉSZLETES LISTA'])
    worksheet.getRow(9).font = { bold: true }
    
    const headers = ['Cím', 'Bérlő', 'Tulajdonos', 'Havi bérleti díj', 'Státusz']
    worksheet.addRow(headers)
    worksheet.getRow(10).eachCell(cell => Object.assign(cell, headerStyle))

    data.properties.forEach((property: any) => {
      worksheet.addRow([
        property.address,
        property.tenant,
        property.owner,
        `${property.monthlyRent.toLocaleString('hu-HU')} Ft`,
        property.status
      ])
    })
  } else if (reportType === 'issues-summary') {
    // Hibabejelentések összesítő
    worksheet.addRow(['ÖSSZESÍTŐ'])
    worksheet.getRow(4).font = { bold: true }
    worksheet.addRow(['Összes hibabejelentés:', data.summary.totalIssues])
    worksheet.addRow(['Nyitott hibák:', data.summary.openIssues])
    worksheet.addRow(['Megoldott hibák:', data.summary.resolvedIssues])
    worksheet.addRow([]) // Üres sor

    // Legutóbbi hibák
    worksheet.addRow(['LEGUTÓBBI HIBABEJELENTÉSEK'])
    worksheet.getRow(9).font = { bold: true }
    
    const headers = ['Cím', 'Státusz', 'Prioritás', 'Ingatlan', 'Bejelentő', 'Hozzárendelve', 'Létrehozva']
    worksheet.addRow(headers)
    worksheet.getRow(10).eachCell(cell => Object.assign(cell, headerStyle))

    data.recentIssues.forEach((issue: any) => {
      worksheet.addRow([
        issue.title,
        issue.status,
        issue.priority,
        issue.property,
        issue.reportedBy,
        issue.assignedTo,
        issue.createdAt.toLocaleDateString('hu-HU')
      ])
    })
  }

  // Oszlopszélességek beállítása
  worksheet.columns.forEach(column => {
    column.width = 20
  })

  return await workbook.xlsx.writeBuffer() as Buffer
}

// HTML jelentés generálás
function generateReportHTML(data: any, reportType: string): string {
  return `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #366092; padding-bottom: 20px; }
        .title { font-size: 24px; color: #366092; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary h3 { color: #366092; margin-top: 0; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-item { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #366092; }
        .stat-value { font-size: 24px; font-weight: bold; color: #366092; }
        .stat-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #366092; color: white; font-weight: bold; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        @media print { 
            body { margin: 0; } 
            .header { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${data.title}</div>
        <div class="subtitle">Generálva: ${new Date().toLocaleString('hu-HU')}</div>
    </div>

    <div class="summary">
        <h3>Összesítő</h3>
        <div class="stat-grid">
            ${generateSummaryStats(data, reportType)}
        </div>
    </div>

    ${generateDetailedContent(data, reportType)}

    <div class="footer">
        Molino RENTAL CRM - Automatikusan generált jelentés
    </div>
</body>
</html>`
}

function generateSummaryStats(data: any, reportType: string): string {
  if (reportType === 'monthly-revenue') {
    return `
      <div class="stat-item">
        <div class="stat-value">${data.summary.totalRevenue.toLocaleString('hu-HU')} Ft</div>
        <div class="stat-label">Teljes bevétel</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.summary.propertyCount}</div>
        <div class="stat-label">Aktív ingatlan</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${Math.round(data.summary.averageRent).toLocaleString('hu-HU')} Ft</div>
        <div class="stat-label">Átlagos bérleti díj</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.summary.occupancyRate}%</div>
        <div class="stat-label">Kihasználtság</div>
      </div>
    `
  } else if (reportType === 'issues-summary') {
    return `
      <div class="stat-item">
        <div class="stat-value">${data.summary.totalIssues}</div>
        <div class="stat-label">Összes hibabejelentés</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.summary.openIssues}</div>
        <div class="stat-label">Nyitott hibák</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.summary.resolvedIssues}</div>
        <div class="stat-label">Megoldott hibák</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.summary.averageResolutionTime} nap</div>
        <div class="stat-label">Átlagos megoldási idő</div>
      </div>
    `
  }
  return ''
}

function generateDetailedContent(data: any, reportType: string): string {
  if (reportType === 'monthly-revenue' && data.properties) {
    return `
      <h3>Részletes ingatlan lista</h3>
      <table>
        <thead>
          <tr>
            <th>Cím</th>
            <th>Bérlő</th>
            <th>Tulajdonos</th>
            <th>Havi bérleti díj</th>
            <th>Státusz</th>
          </tr>
        </thead>
        <tbody>
          ${data.properties.map((property: any) => `
            <tr>
              <td>${property.address}</td>
              <td>${property.tenant}</td>
              <td>${property.owner}</td>
              <td>${property.monthlyRent.toLocaleString('hu-HU')} Ft</td>
              <td>${property.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  } else if (reportType === 'issues-summary' && data.recentIssues) {
    return `
      <h3>Legutóbbi hibabejelentések</h3>
      <table>
        <thead>
          <tr>
            <th>Cím</th>
            <th>Státusz</th>
            <th>Prioritás</th>
            <th>Ingatlan</th>
            <th>Bejelentő</th>
            <th>Létrehozva</th>
          </tr>
        </thead>
        <tbody>
          ${data.recentIssues.map((issue: any) => `
            <tr>
              <td>${issue.title}</td>
              <td>${issue.status}</td>
              <td>${issue.priority}</td>
              <td>${issue.property}</td>
              <td>${issue.reportedBy}</td>
              <td>${issue.createdAt.toLocaleDateString('hu-HU')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }
  return ''
}