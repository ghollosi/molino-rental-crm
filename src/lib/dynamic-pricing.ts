import { PrismaClient, IssueCategory, IssuePriority } from '@prisma/client'

const prisma = new PrismaClient()

// Árazási tényezők és súlyok
export interface PricingFactors {
  baseCost: number           // Alapár a kategória szerint
  urgencyMultiplier: number  // Sürgősségi szorzó
  complexityMultiplier: number // Bonyolultság szorzó
  seasonalMultiplier: number // Szezonális szorzó
  demandMultiplier: number   // Kereslet-kínálat szorzó
  distanceMultiplier: number // Távolság szorzó
  providerRatingBonus: number // Szolgáltató minőség bónusz
  loyaltyDiscount: number    // Hűségkedvezmény
  bulkDiscount: number       // Mennyiségi kedvezmény
  timeOfDayMultiplier: number // Napszak szorzó
}

export interface PricingInput {
  category: IssueCategory
  priority: IssuePriority
  propertyId: string
  providerId?: string
  estimatedHours?: number
  materials?: Array<{
    name: string
    cost: number
    quantity: number
  }>
  description?: string
  scheduledDate?: Date
  isEmergency?: boolean
}

export interface PricingResult {
  breakdown: {
    baseCost: number
    laborCost: number
    materialsCost: number
    adjustments: {
      urgency: number
      complexity: number
      seasonal: number
      demand: number
      distance: number
      providerBonus: number
      loyalty: number
      bulk: number
      timeOfDay: number
    }
    subtotal: number
    tax: number
    total: number
  }
  confidence: number // 0-100% mennyire megbízható az ár
  validUntil: Date
  recommendations: string[]
  alternatives?: {
    economy: number
    standard: number
    premium: number
  }
}

// Alapárak kategóriánként (EUR/óra)
const BASE_RATES: Record<IssueCategory, number> = {
  PLUMBING: 65,      // Vízvezeték szerelő
  ELECTRICAL: 75,    // Villanyszerelő  
  HVAC: 70,          // Fűtés/légkondicionáló
  STRUCTURAL: 80,    // Építési munkák
  OTHER: 60          // Általános karbantartás
}

// Sürgősségi szorzók
const URGENCY_MULTIPLIERS: Record<IssuePriority, number> = {
  LOW: 1.0,      // Normál ár
  MEDIUM: 1.1,   // +10%
  HIGH: 1.3,     // +30%
  URGENT: 1.6    // +60% (gyors reagálás költsége)
}

// Intelligens árazási motor
export async function calculateDynamicPrice(input: PricingInput): Promise<PricingResult> {
  const factors = await calculatePricingFactors(input)
  const breakdown = calculatePriceBreakdown(input, factors)
  const confidence = calculateConfidence(input, factors)
  const recommendations = generateRecommendations(input, factors, breakdown)
  
  return {
    breakdown,
    confidence,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 hét
    recommendations,
    alternatives: calculateAlternatives(breakdown.total)
  }
}

// Árazási tényezők számítása
async function calculatePricingFactors(input: PricingInput): Promise<PricingFactors> {
  const { category, priority, propertyId, providerId, scheduledDate, isEmergency } = input

  // Alapár kategória szerint
  const baseCost = BASE_RATES[category]
  
  // Sürgősségi szorzó
  const urgencyMultiplier = isEmergency ? 2.0 : URGENCY_MULTIPLIERS[priority]

  // Bonyolultság szorzó (szöveg elemzés alapján)
  const complexityMultiplier = await calculateComplexityMultiplier(input.description || '')

  // Szezonális szorzó
  const seasonalMultiplier = calculateSeasonalMultiplier(scheduledDate || new Date(), category)

  // Kereslet-kínálat szorzó
  const demandMultiplier = await calculateDemandMultiplier(category, scheduledDate || new Date())

  // Távolság szorzó (ha van szolgáltató)
  const distanceMultiplier = providerId 
    ? await calculateDistanceMultiplier(propertyId, providerId)
    : 1.0

  // Szolgáltató minőség bónusz
  const providerRatingBonus = providerId
    ? await calculateProviderBonus(providerId)
    : 0

  // Hűségkedvezmény
  const loyaltyDiscount = await calculateLoyaltyDiscount(propertyId)

  // Mennyiségi kedvezmény (ha több hiba egyszerre)
  const bulkDiscount = await calculateBulkDiscount(propertyId)

  // Napszak szorzó
  const timeOfDayMultiplier = calculateTimeOfDayMultiplier(scheduledDate || new Date())

  return {
    baseCost,
    urgencyMultiplier,
    complexityMultiplier,
    seasonalMultiplier,
    demandMultiplier,
    distanceMultiplier,
    providerRatingBonus,
    loyaltyDiscount,
    bulkDiscount,
    timeOfDayMultiplier
  }
}

// Ár lebontás számítása
function calculatePriceBreakdown(input: PricingInput, factors: PricingFactors) {
  const estimatedHours = input.estimatedHours || estimateWorkHours(input.category, input.description || '')
  
  // Alapköltségek
  const baseCost = factors.baseCost
  const laborCost = baseCost * estimatedHours
  const materialsCost = input.materials?.reduce((sum, material) => 
    sum + (material.cost * material.quantity), 0) || 0

  // Módosítások alkalmazása
  const adjustments = {
    urgency: laborCost * (factors.urgencyMultiplier - 1),
    complexity: laborCost * (factors.complexityMultiplier - 1),
    seasonal: laborCost * (factors.seasonalMultiplier - 1),
    demand: laborCost * (factors.demandMultiplier - 1),
    distance: laborCost * (factors.distanceMultiplier - 1),
    providerBonus: laborCost * factors.providerRatingBonus,
    loyalty: -(laborCost * factors.loyaltyDiscount),
    bulk: -(laborCost * factors.bulkDiscount),
    timeOfDay: laborCost * (factors.timeOfDayMultiplier - 1)
  }

  const subtotal = laborCost + materialsCost + Object.values(adjustments).reduce((a, b) => a + b, 0)
  const tax = subtotal * 0.27 // 27% ÁFA Magyarországon
  const total = subtotal + tax

  return {
    baseCost,
    laborCost,
    materialsCost,
    adjustments,
    subtotal,
    tax,
    total: Math.round(total * 100) / 100 // 2 tizedesjegy
  }
}

// Bonyolultság szorzó számítása AI/kulcsszó alapon
async function calculateComplexityMultiplier(description: string): Promise<number> {
  const complexKeywords = [
    'urgent', 'emergency', 'broken', 'leak', 'flood', 'fire', 'dangerous',
    'multiple', 'complex', 'difficult', 'renovation', 'replacement',
    'sürgős', 'vészhelyzet', 'törött', 'szivárgás', 'árvíz', 'tűz', 'veszélyes',
    'több', 'bonyolult', 'nehéz', 'felújítás', 'csere'
  ]

  const simpleKeywords = [
    'simple', 'easy', 'quick', 'minor', 'small', 'routine', 'maintenance',
    'egyszerű', 'könnyű', 'gyors', 'kisebb', 'kicsi', 'rutin', 'karbantartás'
  ]

  const descLower = description.toLowerCase()
  
  const complexCount = complexKeywords.filter(keyword => descLower.includes(keyword)).length
  const simpleCount = simpleKeywords.filter(keyword => descLower.includes(keyword)).length
  
  if (complexCount > simpleCount) {
    return 1.2 + (complexCount * 0.1) // +20% + 10% per complex keyword
  } else if (simpleCount > complexCount) {
    return Math.max(0.8, 1.0 - (simpleCount * 0.05)) // -20% minimum 80%
  }
  
  return 1.0 // Normál bonyolultság
}

// Szezonális szorzó
function calculateSeasonalMultiplier(date: Date, category: IssueCategory): number {
  const month = date.getMonth() + 1 // 1-12
  
  // Téli hónapok - fűtés/vízvezeték drágább
  if ([12, 1, 2].includes(month)) {
    if (category === 'HVAC') return 1.3 // +30% télen fűtésre
    if (category === 'PLUMBING') return 1.2 // +20% télen vízvezetékre (fagyás)
  }
  
  // Nyári hónapok - légkondicionáló drágább
  if ([6, 7, 8].includes(month)) {
    if (category === 'HVAC') return 1.25 // +25% nyáron légkondira
  }
  
  // Tavaszi/őszi felújítási szezon
  if ([3, 4, 5, 9, 10].includes(month)) {
    if (category === 'STRUCTURAL') return 1.15 // +15% felújítási szezonban
  }
  
  return 1.0
}

// Kereslet-kínálat szorzó
async function calculateDemandMultiplier(category: IssueCategory, date: Date): Promise<number> {
  // Elmúlt 30 nap hasonló kategóriájú hibabejelentések száma
  const thirtyDaysAgo = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const recentIssues = await prisma.issue.count({
    where: {
      category,
      createdAt: {
        gte: thirtyDaysAgo,
        lte: date
      }
    }
  })

  // Elérhető szolgáltatók száma ebben a kategóriában
  const availableProviders = await prisma.provider.count({
    where: {
      specialty: {
        has: category
      },
      user: {
        isActive: true
      }
    }
  })

  // Kereslet/kínálat arány
  const demandSupplyRatio = availableProviders > 0 ? recentIssues / availableProviders : 5

  if (demandSupplyRatio > 3) return 1.4 // Magas kereslet: +40%
  if (demandSupplyRatio > 2) return 1.2 // Közepes kereslet: +20%
  if (demandSupplyRatio < 1) return 0.9 // Alacsony kereslet: -10%
  
  return 1.0
}

// Távolság szorzó
async function calculateDistanceMultiplier(propertyId: string, providerId: string): Promise<number> {
  // Egyszerűsített verzió - valós implementációban geocoding API
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { city: true }
  })

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { city: true, travelFee: true }
  })

  if (!property || !provider) return 1.0

  // Ha más városban van
  if (property.city !== provider.city) {
    return 1.15 // +15% távolsági pótlék
  }

  return 1.0
}

// Szolgáltató minőség bónusz
async function calculateProviderBonus(providerId: string): Promise<number> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { rating: true }
  })

  if (!provider?.rating) return 0

  // Magas értékelésű szolgáltatók prémium árat kérhetnek
  if (provider.rating >= 4.5) return 0.2  // +20% bónusz
  if (provider.rating >= 4.0) return 0.1  // +10% bónusz
  if (provider.rating >= 3.5) return 0.05 // +5% bónusz
  if (provider.rating < 3.0) return -0.1  // -10% csökkentés gyenge értékelésért
  
  return 0
}

// Hűségkedvezmény
async function calculateLoyaltyDiscount(propertyId: string): Promise<number> {
  // Elmúlt év hibabejelentéseinek száma
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  
  const issueCount = await prisma.issue.count({
    where: {
      propertyId,
      createdAt: {
        gte: oneYearAgo
      }
    }
  })

  // Progresszív hűségkedvezmény
  if (issueCount >= 20) return 0.15 // 15% kedvezmény 20+ hiba után
  if (issueCount >= 10) return 0.10 // 10% kedvezmény 10+ hiba után
  if (issueCount >= 5) return 0.05  // 5% kedvezmény 5+ hiba után
  
  return 0
}

// Mennyiségi kedvezmény
async function calculateBulkDiscount(propertyId: string): Promise<number> {
  // Aktuálisan nyitott hibák száma ugyanazon az ingatlannon
  const openIssues = await prisma.issue.count({
    where: {
      propertyId,
      status: { in: ['OPEN', 'ASSIGNED'] }
    }
  })

  // Több hiba egyszerre = kedvezmény
  if (openIssues >= 5) return 0.20 // 20% kedvezmény 5+ hibánál
  if (openIssues >= 3) return 0.15 // 15% kedvezmény 3+ hibánál
  if (openIssues >= 2) return 0.10 // 10% kedvezmény 2+ hibánál
  
  return 0
}

// Napszak szorzó
function calculateTimeOfDayMultiplier(date: Date): number {
  const hour = date.getHours()
  
  // Éjszakai munka drágább
  if (hour >= 22 || hour <= 6) return 1.5 // +50% éjszaka
  // Hétvégi munka drágább
  if (date.getDay() === 0 || date.getDay() === 6) return 1.3 // +30% hétvégén
  // Munkaidő után drágább
  if (hour >= 18 || hour <= 8) return 1.2 // +20% munkaidő után
  
  return 1.0
}

// Munkaidő becslés
function estimateWorkHours(category: IssueCategory, description: string): number {
  const baseHours: Record<IssueCategory, number> = {
    PLUMBING: 3,     // 3 óra átlag vízvezeték
    ELECTRICAL: 2.5, // 2.5 óra átlag villany
    HVAC: 4,         // 4 óra átlag fűtés/légkondi
    STRUCTURAL: 6,   // 6 óra átlag építési munka
    OTHER: 2         // 2 óra átlag egyéb
  }

  let hours = baseHours[category]
  
  // Kulcsszavak alapján módosítás
  const descLower = description.toLowerCase()
  
  if (descLower.includes('replacement') || descLower.includes('csere')) hours *= 1.5
  if (descLower.includes('installation') || descLower.includes('telepítés')) hours *= 1.3
  if (descLower.includes('repair') || descLower.includes('javítás')) hours *= 1.0
  if (descLower.includes('maintenance') || descLower.includes('karbantartás')) hours *= 0.8
  
  return Math.max(1, Math.round(hours * 10) / 10) // Min 1 óra, 1 tizedesjegy
}

// Bizalmi szint számítása
function calculateConfidence(input: PricingInput, factors: PricingFactors): number {
  let confidence = 70 // Alap bizalmi szint
  
  // Ha van konkrét szolgáltató = +20%
  if (input.providerId) confidence += 20
  
  // Ha van óraszám megadva = +10%
  if (input.estimatedHours) confidence += 10
  
  // Ha van anyaglista = +15%
  if (input.materials && input.materials.length > 0) confidence += 15
  
  // Ha van részletes leírás = +10%
  if (input.description && input.description.length > 50) confidence += 10
  
  // Bonyolult munkák = -10%
  if (factors.complexityMultiplier > 1.3) confidence -= 10
  
  // Sürgős munkák = -5%
  if (factors.urgencyMultiplier > 1.4) confidence -= 5
  
  return Math.min(100, Math.max(30, confidence))
}

// Javaslatok generálása
function generateRecommendations(
  input: PricingInput, 
  factors: PricingFactors, 
  breakdown: any
): string[] {
  const recommendations: string[] = []
  
  // Sürgősségi javaslatok
  if (factors.urgencyMultiplier > 1.4) {
    recommendations.push('🚨 Sürgős munkák drágábbak - fontolja meg a prioritás csökkentését ha lehetséges')
  }
  
  // Szezonális javaslatok
  if (factors.seasonalMultiplier > 1.2) {
    recommendations.push('📅 Szezonális felár van érvényben - másik időpontra ütemezés olcsóbb lehet')
  }
  
  // Kereslet-kínálat javaslatok
  if (factors.demandMultiplier > 1.3) {
    recommendations.push('📈 Magas kereslet miatt drágább - néhány hét múlva olcsóbb lehet')
  }
  
  // Hűségkedvezmény info
  if (factors.loyaltyDiscount > 0) {
    recommendations.push('🎉 Hűségkedvezmény alkalmazva a korábbi megbízások alapján!')
  }
  
  // Mennyiségi kedvezmény
  if (factors.bulkDiscount > 0) {
    recommendations.push('💰 Mennyiségi kedvezmény alkalmazva több egyidejű hiba miatt')
  }
  
  // Időpont javaslat
  if (factors.timeOfDayMultiplier > 1.2) {
    recommendations.push('⏰ Munkaidőben való ütemezés jelentős megtakarítást jelentene')
  }
  
  // Szolgáltató javaslat
  if (!input.providerId) {
    recommendations.push('🔍 Konkrét szolgáltató kiválasztása pontosabb árajánlatot eredményez')
  }
  
  return recommendations
}

// Alternatív árak
function calculateAlternatives(basePrice: number) {
  return {
    economy: Math.round(basePrice * 0.8 * 100) / 100,   // -20% gazdaságos
    standard: basePrice,                                  // Standard ár
    premium: Math.round(basePrice * 1.3 * 100) / 100    // +30% prémium
  }
}

// Batch árazás több hibabejelentéshez
export async function calculateBatchPricing(inputs: PricingInput[]): Promise<{
  individual: PricingResult[]
  bulk: {
    totalDiscount: number
    finalTotal: number
    savings: number
  }
}> {
  const individual = await Promise.all(
    inputs.map(input => calculateDynamicPrice(input))
  )
  
  const totalBeforeDiscount = individual.reduce((sum, result) => sum + result.breakdown.total, 0)
  
  // Mennyiségi kedvezmény nagyobb csomagokra
  let bulkDiscountRate = 0
  if (inputs.length >= 10) bulkDiscountRate = 0.25      // 25% kedvezmény 10+ hibánál
  else if (inputs.length >= 5) bulkDiscountRate = 0.20  // 20% kedvezmény 5+ hibánál
  else if (inputs.length >= 3) bulkDiscountRate = 0.15  // 15% kedvezmény 3+ hibánál
  else if (inputs.length >= 2) bulkDiscountRate = 0.10  // 10% kedvezmény 2+ hibánál
  
  const totalDiscount = totalBeforeDiscount * bulkDiscountRate
  const finalTotal = totalBeforeDiscount - totalDiscount
  const savings = totalDiscount
  
  return {
    individual,
    bulk: {
      totalDiscount,
      finalTotal: Math.round(finalTotal * 100) / 100,
      savings: Math.round(savings * 100) / 100
    }
  }
}

// Árajánlat történet tárolása
export async function savePricingQuote(
  propertyId: string,
  providerId: string | null,
  input: PricingInput,
  result: PricingResult
) {
  // Ez később egy Quote modellben tárolható lenne
  console.log('Pricing quote saved:', {
    propertyId,
    providerId,
    total: result.breakdown.total,
    confidence: result.confidence,
    validUntil: result.validUntil
  })
}