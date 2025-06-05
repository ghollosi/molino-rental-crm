import { PrismaClient, IssueCategory, IssuePriority } from '@prisma/client'

const prisma = new PrismaClient()

interface MatchingCriteria {
  propertyId: string
  category: IssueCategory
  priority: IssuePriority
  urgency?: boolean
}

interface ProviderScore {
  providerId: string
  score: number
  reasons: string[]
}

// Távolság számítás két koordináta között (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Föld sugara km-ben
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Automatikus szolgáltató párosítás algoritmus
export async function findBestProviders(criteria: MatchingCriteria): Promise<ProviderScore[]> {
  const { propertyId, category, priority } = criteria
  
  // Ingatlan adatok lekérése (koordinátákkal)
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      providers: {
        include: {
          provider: true
        }
      }
    }
  })

  if (!property) {
    throw new Error('Property not found')
  }

  // Összes aktív szolgáltató lekérése, akik dolgoznak ebben a kategóriában
  const providers = await prisma.provider.findMany({
    where: {
      user: { isActive: true },
      specialty: {
        has: category
      }
    },
    include: {
      propertyAssignments: {
        where: {
          propertyId: propertyId,
          isActive: true
        }
      },
      ratings: {
        where: {
          propertyId: propertyId
        }
      },
      assignedIssues: {
        where: {
          status: { not: 'CLOSED' }
        }
      }
    }
  })

  const scoredProviders: ProviderScore[] = []

  for (const provider of providers) {
    let score = 0
    const reasons: string[] = []

    // 1. Meglévő kapcsolat súlyozása (40 pont)
    const existingAssignment = provider.propertyAssignments.find(pa => pa.propertyId === propertyId)
    if (existingAssignment) {
      if (existingAssignment.isPrimary) {
        score += 40
        reasons.push('Elsődleges szolgáltató ezen az ingatlannon')
      } else {
        score += 30
        reasons.push('Korábbi tapasztalat ezen az ingatlannon')
      }
      
      // Teljesítmény alapú bónusz
      if (existingAssignment.rating && existingAssignment.rating > 4) {
        score += 10
        reasons.push('Kiváló értékelés (>4.0)')
      }
      if (existingAssignment.completionRate && existingAssignment.completionRate > 90) {
        score += 5
        reasons.push('Magas befejezési arány (>90%)')
      }
    }

    // 2. Általános értékelés súlyozása (20 pont)
    if (provider.rating) {
      const ratingScore = (provider.rating / 5) * 20
      score += ratingScore
      reasons.push(`Általános értékelés: ${provider.rating.toFixed(1)}/5`)
    }

    // 3. Távolság súlyozása (15 pont)
    if (property.latitude && property.longitude && provider.street) {
      // Itt egyszerűsítés: ha van címe, akkor számolunk távolságot
      // Valós implementációban geocoding API-t használnánk
      const estimatedDistance = Math.random() * 30 // Placeholder
      if (estimatedDistance <= 10) {
        score += 15
        reasons.push('Közel van (≤10km)')
      } else if (estimatedDistance <= 20) {
        score += 10
        reasons.push('Közepesen távol (≤20km)')
      } else if (estimatedDistance <= provider.maxRadius!) {
        score += 5
        reasons.push('Kiszállási távolságon belül')
      }
    }

    // 4. Rendelkezésre állás (10 pont)
    const currentWorkload = provider.assignedIssues.length
    if (currentWorkload === 0) {
      score += 10
      reasons.push('Nincs folyamatban lévő munkája')
    } else if (currentWorkload <= 3) {
      score += 7
      reasons.push('Alacsony munkahelytöbbet')
    } else if (currentWorkload <= 5) {
      score += 3
      reasons.push('Közepes munkateher')
    }

    // 5. Válaszidő (10 pont)
    if (provider.responseTime) {
      if (provider.responseTime <= 4) {
        score += 10
        reasons.push('Gyors válaszidő (≤4h)')
      } else if (provider.responseTime <= 12) {
        score += 7
        reasons.push('Elfogadható válaszidő (≤12h)')
      } else if (provider.responseTime <= 24) {
        score += 3
        reasons.push('Lassú válaszidő (≤24h)')
      }
    }

    // 6. Prioritás alapú bónusz (5 pont)
    if (priority === 'URGENT' && provider.responseTime && provider.responseTime <= 2) {
      score += 5
      reasons.push('Sürgős esetekre specializálódott')
    }

    // 7. Preferált szolgáltató bónusz (5 pont)
    if (provider.isPreferred) {
      score += 5
      reasons.push('Preferált szolgáltató')
    }

    scoredProviders.push({
      providerId: provider.id,
      score,
      reasons
    })
  }

  // Pontszám szerint rendezés (csökkenő sorrendben)
  return scoredProviders.sort((a, b) => b.score - a.score)
}

// Automatikus hozzárendelés
export async function autoAssignProvider(issueId: string): Promise<string | null> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      property: true
    }
  })

  if (!issue) {
    throw new Error('Issue not found')
  }

  const bestProviders = await findBestProviders({
    propertyId: issue.propertyId,
    category: issue.category,
    priority: issue.priority
  })

  if (bestProviders.length === 0) {
    return null // Nincs megfelelő szolgáltató
  }

  const bestProvider = bestProviders[0]
  
  // Ha a pontszám legalább 50, akkor automatikusan hozzárendeljük
  if (bestProvider.score >= 50) {
    await prisma.issue.update({
      where: { id: issueId },
      data: {
        assignedToId: bestProvider.providerId,
        status: 'ASSIGNED'
      }
    })

    // SLA tracking létrehozása
    await createSLATracking(issueId, bestProvider.providerId, issue.priority)

    return bestProvider.providerId
  }

  return null // Nem elég magas a pontszám az automatikus hozzárendeléshez
}

// SLA tracking létrehozása
async function createSLATracking(issueId: string, providerId: string, priority: IssuePriority) {
  // SLA határidők prioritás szerint
  const slaTargets = {
    URGENT: { response: 2, resolution: 24 },
    HIGH: { response: 8, resolution: 72 },
    MEDIUM: { response: 24, resolution: 168 }, // 1 hét
    LOW: { response: 72, resolution: 336 }     // 2 hét
  }

  const targets = slaTargets[priority]

  await prisma.sLATracking.create({
    data: {
      issueId,
      providerId,
      targetResponseTime: targets.response,
      targetResolutionTime: targets.resolution
    }
  })
}

// Szolgáltató teljesítmény frissítése
export async function updateProviderPerformance(providerId: string, propertyId: string) {
  // Az adott szolgáltató teljesítményének újraszámolása az adott ingatlanon
  const assignments = await prisma.propertyProvider.findFirst({
    where: {
      providerId,
      propertyId
    }
  })

  if (!assignments) return

  // Összes befejezett hibabejelentés lekérése
  const completedIssues = await prisma.issue.findMany({
    where: {
      propertyId,
      assignedToId: providerId,
      status: 'COMPLETED'
    },
    include: {
      slaTracking: true
    }
  })

  const totalIssues = await prisma.issue.count({
    where: {
      propertyId,
      assignedToId: providerId
    }
  })

  // Átlagos válaszidő számítása
  const avgResponseTime = completedIssues
    .filter(issue => issue.slaTracking?.actualResponseTime)
    .reduce((sum, issue) => sum + (issue.slaTracking?.actualResponseTime || 0), 0) / 
    completedIssues.filter(issue => issue.slaTracking?.actualResponseTime).length || 0

  // Befejezési arány számítása
  const completionRate = totalIssues > 0 ? (completedIssues.length / totalIssues) * 100 : 0

  // Átlagos értékelés számítása
  const ratings = await prisma.providerRating.findMany({
    where: {
      providerId,
      propertyId
    }
  })

  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
    : 0

  // Adatok frissítése
  await prisma.propertyProvider.update({
    where: {
      id: assignments.id
    },
    data: {
      avgResponseTime: Math.round(avgResponseTime),
      completionRate,
      rating: avgRating
    }
  })
}

// Eszkaláció kezelése
export async function handleEscalation(issueId: string) {
  const slaTracking = await prisma.sLATracking.findUnique({
    where: { issueId },
    include: {
      issue: {
        include: {
          property: true
        }
      }
    }
  })

  if (!slaTracking) return

  const now = new Date()
  const issueCreated = slaTracking.issue.createdAt
  const hoursElapsed = Math.floor((now.getTime() - issueCreated.getTime()) / (1000 * 60 * 60))

  // Válaszidő túllépés ellenőrzése
  if (!slaTracking.actualResponseTime && hoursElapsed > slaTracking.targetResponseTime) {
    await prisma.sLATracking.update({
      where: { id: slaTracking.id },
      data: {
        responseBreached: true,
        escalationLevel: slaTracking.escalationLevel + 1,
        escalatedAt: now
      }
    })

    // Itt küldhetnénk email értesítést a managementnek
    console.log(`SLA breach: Issue ${issueId} response time exceeded`)
  }

  // Megoldási idő túllépés ellenőrzése
  if (slaTracking.issue.status !== 'COMPLETED' && 
      hoursElapsed > slaTracking.targetResolutionTime) {
    await prisma.sLATracking.update({
      where: { id: slaTracking.id },
      data: {
        resolutionBreached: true,
        escalationLevel: slaTracking.escalationLevel + 1,
        escalatedAt: now
      }
    })

    console.log(`SLA breach: Issue ${issueId} resolution time exceeded`)
  }
}