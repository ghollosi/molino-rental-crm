import { PrismaClient, IssuePriority } from '@prisma/client'

const prisma = new PrismaClient()

export interface SLAMetrics {
  responseTime: {
    average: number
    median: number
    percentile95: number
    trend: 'up' | 'down' | 'stable'
  }
  resolutionTime: {
    average: number
    median: number
    percentile95: number
    trend: 'up' | 'down' | 'stable'
  }
  breachRates: {
    response: number
    resolution: number
    overall: number
  }
  performanceByPriority: {
    [key in IssuePriority]: {
      responseRate: number
      resolutionRate: number
      averageResponseTime: number
      averageResolutionTime: number
    }
  }
  providerPerformance: {
    providerId: string
    businessName: string
    responseRate: number
    resolutionRate: number
    rating: number
    issueCount: number
  }[]
}

// SLA határidők prioritás szerint
export const SLA_TARGETS = {
  URGENT: { response: 2, resolution: 24 },
  HIGH: { response: 8, resolution: 72 },
  MEDIUM: { response: 24, resolution: 168 },
  LOW: { response: 72, resolution: 336 }
}

// Átfogó SLA metrikák számítása
export async function calculateSLAMetrics(
  dateFrom: Date,
  dateTo: Date,
  propertyId?: string,
  providerId?: string
): Promise<SLAMetrics> {
  // SLA rekordok lekérése szűrőkkel
  const whereClause: any = {
    createdAt: {
      gte: dateFrom,
      lte: dateTo
    }
  }

  if (propertyId) {
    whereClause.issue = { propertyId }
  }

  if (providerId) {
    whereClause.providerId = providerId
  }

  const slaRecords = await prisma.sLATracking.findMany({
    where: whereClause,
    include: {
      issue: {
        select: {
          priority: true,
          createdAt: true,
          completedDate: true
        }
      },
      provider: {
        select: {
          id: true,
          businessName: true,
          rating: true
        }
      }
    }
  })

  // Válaszidő statisztikák
  const responseTimes = slaRecords
    .filter(r => r.actualResponseTime)
    .map(r => r.actualResponseTime!)
    .sort((a, b) => a - b)

  const responseTime = {
    average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
    median: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : 0,
    percentile95: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
    trend: calculateTrend(responseTimes) as 'up' | 'down' | 'stable'
  }

  // Megoldási idő statisztikák
  const resolutionTimes = slaRecords
    .filter(r => r.actualResolutionTime)
    .map(r => r.actualResolutionTime!)
    .sort((a, b) => a - b)

  const resolutionTime = {
    average: resolutionTimes.length > 0 ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length : 0,
    median: resolutionTimes.length > 0 ? resolutionTimes[Math.floor(resolutionTimes.length / 2)] : 0,
    percentile95: resolutionTimes.length > 0 ? resolutionTimes[Math.floor(resolutionTimes.length * 0.95)] : 0,
    trend: calculateTrend(resolutionTimes) as 'up' | 'down' | 'stable'
  }

  // Túllépési arányok
  const totalRecords = slaRecords.length
  const responseBreaches = slaRecords.filter(r => r.responseBreached).length
  const resolutionBreaches = slaRecords.filter(r => r.resolutionBreached).length

  const breachRates = {
    response: totalRecords > 0 ? (responseBreaches / totalRecords) * 100 : 0,
    resolution: totalRecords > 0 ? (resolutionBreaches / totalRecords) * 100 : 0,
    overall: totalRecords > 0 ? ((responseBreaches + resolutionBreaches) / (totalRecords * 2)) * 100 : 0
  }

  // Prioritás szerinti teljesítmény
  const performanceByPriority = {} as any
  
  for (const priority of ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]) {
    const priorityRecords = slaRecords.filter(r => r.issue.priority === priority)
    const targets = SLA_TARGETS[priority]
    
    const responseOnTime = priorityRecords.filter(r => 
      r.actualResponseTime && r.actualResponseTime <= targets.response
    ).length
    
    const resolutionOnTime = priorityRecords.filter(r => 
      r.actualResolutionTime && r.actualResolutionTime <= targets.resolution
    ).length

    const avgResponseTime = priorityRecords
      .filter(r => r.actualResponseTime)
      .reduce((sum, r) => sum + r.actualResponseTime!, 0) / 
      priorityRecords.filter(r => r.actualResponseTime).length || 0

    const avgResolutionTime = priorityRecords
      .filter(r => r.actualResolutionTime)
      .reduce((sum, r) => sum + r.actualResolutionTime!, 0) / 
      priorityRecords.filter(r => r.actualResolutionTime).length || 0

    performanceByPriority[priority] = {
      responseRate: priorityRecords.length > 0 ? (responseOnTime / priorityRecords.length) * 100 : 0,
      resolutionRate: priorityRecords.length > 0 ? (resolutionOnTime / priorityRecords.length) * 100 : 0,
      averageResponseTime: avgResponseTime,
      averageResolutionTime: avgResolutionTime
    }
  }

  // Szolgáltató teljesítmény
  const providerGroups = new Map()
  
  slaRecords.forEach(record => {
    if (!record.provider) return
    
    const providerId = record.provider.id
    if (!providerGroups.has(providerId)) {
      providerGroups.set(providerId, {
        providerId,
        businessName: record.provider.businessName,
        rating: record.provider.rating || 0,
        records: []
      })
    }
    providerGroups.get(providerId).records.push(record)
  })

  const providerPerformance = Array.from(providerGroups.values()).map(group => {
    const records = group.records
    const responseOnTime = records.filter((r: any) => 
      r.actualResponseTime && r.actualResponseTime <= SLA_TARGETS[r.issue.priority].response
    ).length
    
    const resolutionOnTime = records.filter((r: any) => 
      r.actualResolutionTime && r.actualResolutionTime <= SLA_TARGETS[r.issue.priority].resolution
    ).length

    return {
      providerId: group.providerId,
      businessName: group.businessName,
      responseRate: records.length > 0 ? (responseOnTime / records.length) * 100 : 0,
      resolutionRate: records.length > 0 ? (resolutionOnTime / records.length) * 100 : 0,
      rating: group.rating,
      issueCount: records.length
    }
  }).sort((a, b) => b.responseRate - a.responseRate)

  return {
    responseTime,
    resolutionTime,
    breachRates,
    performanceByPriority,
    providerPerformance
  }
}

// Trend számítás (egyszerűsített verzió)
function calculateTrend(values: number[]): string {
  if (values.length < 2) return 'stable'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (change > 5) return 'up'
  if (change < -5) return 'down'
  return 'stable'
}

// SLA riasztások generálása
export async function generateSLAAlerts(propertyId?: string): Promise<{
  critical: any[]
  warning: any[]
  info: any[]
}> {
  const now = new Date()
  const alerts = {
    critical: [] as any[],
    warning: [] as any[],
    info: [] as any[]
  }

  // Aktuálisan aktív hibák SLA állapota
  const activeIssues = await prisma.issue.findMany({
    where: {
      status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      ...(propertyId && { propertyId })
    },
    include: {
      slaTracking: true,
      property: {
        select: {
          street: true,
          city: true
        }
      },
      assignedTo: {
        select: {
          businessName: true
        }
      }
    }
  })

  for (const issue of activeIssues) {
    const sla = issue.slaTracking
    if (!sla) continue

    const hoursElapsed = Math.floor((now.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60))
    const targets = SLA_TARGETS[issue.priority]

    // Válaszidő túllépés
    if (!sla.actualResponseTime && hoursElapsed > targets.response) {
      const alert = {
        issueId: issue.id,
        title: issue.title,
        property: `${issue.property.street}, ${issue.property.city}`,
        provider: issue.assignedTo?.businessName || 'Nincs hozzárendelve',
        priority: issue.priority,
        type: 'response_breach',
        message: `Válaszidő túllépés: ${hoursElapsed}h / ${targets.response}h`,
        hoursOverdue: hoursElapsed - targets.response
      }

      if (hoursElapsed > targets.response * 2) {
        alerts.critical.push(alert)
      } else {
        alerts.warning.push(alert)
      }
    }

    // Megoldási idő veszélyben
    if (issue.status !== 'COMPLETED' && hoursElapsed > targets.resolution * 0.8) {
      const alert = {
        issueId: issue.id,
        title: issue.title,
        property: `${issue.property.street}, ${issue.property.city}`,
        provider: issue.assignedTo?.businessName || 'Nincs hozzárendelve',
        priority: issue.priority,
        type: 'resolution_warning',
        message: `Megoldási határidő közeledik: ${hoursElapsed}h / ${targets.resolution}h`,
        hoursRemaining: targets.resolution - hoursElapsed
      }

      if (hoursElapsed > targets.resolution) {
        alerts.critical.push(alert)
      } else {
        alerts.warning.push(alert)
      }
    }

    // Pozitív információk
    if (sla.actualResponseTime && sla.actualResponseTime <= targets.response * 0.5) {
      alerts.info.push({
        issueId: issue.id,
        title: issue.title,
        provider: issue.assignedTo?.businessName || 'Ismeretlen',
        type: 'fast_response',
        message: `Gyors válaszidő: ${sla.actualResponseTime}h`
      })
    }
  }

  return alerts
}

// Szolgáltató teljesítmény rangsor
export async function getProviderLeaderboard(
  dateFrom: Date,
  dateTo: Date
): Promise<{
  topPerformers: any[]
  improvementNeeded: any[]
  averageMetrics: any
}> {
  const metrics = await calculateSLAMetrics(dateFrom, dateTo)
  
  const topPerformers = metrics.providerPerformance
    .filter(p => p.issueCount >= 5) // Minimum 5 hiba statisztikai relevancia miatt
    .slice(0, 10)

  const improvementNeeded = metrics.providerPerformance
    .filter(p => p.responseRate < 80 || p.resolutionRate < 70)
    .slice(0, 5)

  const averageMetrics = {
    responseRate: metrics.providerPerformance.reduce((sum, p) => sum + p.responseRate, 0) / metrics.providerPerformance.length || 0,
    resolutionRate: metrics.providerPerformance.reduce((sum, p) => sum + p.resolutionRate, 0) / metrics.providerPerformance.length || 0,
    rating: metrics.providerPerformance.reduce((sum, p) => sum + p.rating, 0) / metrics.providerPerformance.length || 0
  }

  return {
    topPerformers,
    improvementNeeded,
    averageMetrics
  }
}

// SLA előrejelzés
export async function predictSLAPerformance(
  propertyId: string,
  daysAhead: number = 30
): Promise<{
  expectedIssues: number
  riskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
}> {
  // Elmúlt 90 nap adatai alapján előrejelzés
  const pastData = await prisma.issue.findMany({
    where: {
      propertyId,
      createdAt: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    },
    include: {
      slaTracking: true
    }
  })

  const avgIssuesPerDay = pastData.length / 90
  const expectedIssues = Math.round(avgIssuesPerDay * daysAhead)
  
  const breachRate = pastData.filter(issue => 
    issue.slaTracking?.responseBreached || issue.slaTracking?.resolutionBreached
  ).length / pastData.length

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  const recommendations: string[] = []

  if (breachRate > 0.3) {
    riskLevel = 'high'
    recommendations.push('Sürgősen szükség van további szolgáltatókra')
    recommendations.push('SLA határidők felülvizsgálata javasolt')
  } else if (breachRate > 0.15) {
    riskLevel = 'medium'
    recommendations.push('Szolgáltatói kapacitás bővítése mérlegelendő')
    recommendations.push('Preventív karbantartás fokozása')
  } else {
    recommendations.push('Jelenlegi teljesítmény fenntartása')
    recommendations.push('Szolgáltatói kapcsolatok erősítése')
  }

  return {
    expectedIssues,
    riskLevel,
    recommendations
  }
}