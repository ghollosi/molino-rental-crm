import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Pénzügyi előrejelzési típusok
export interface ForecastInput {
  propertyId?: string
  months: number // Hány hónapra előre
  includeSeasonality: boolean
  includeGrowthTrend: boolean
}

export interface RevenueBreakdown {
  rental: number
  utilities: number
  maintenance: number
  other: number
  total: number
}

export interface MonthlyForecast {
  month: string
  revenue: RevenueBreakdown
  expenses: {
    maintenance: number
    utilities: number
    management: number
    repairs: number
    other: number
    total: number
  }
  netIncome: number
  occupancyRate: number
  confidence: number
}

export interface ForecastResult {
  forecasts: MonthlyForecast[]
  summary: {
    totalRevenue: number
    totalExpenses: number
    totalNetIncome: number
    averageOccupancy: number
    averageConfidence: number
    trends: {
      revenueGrowth: number
      expenseGrowth: number
      netIncomeGrowth: number
    }
  }
  recommendations: string[]
}

export interface MarketAnalysis {
  averageRent: number
  marketGrowth: number
  competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  seasonalFactors: Record<string, number>
}

// Bevétel előrejelzés
export async function generateRevenueForecasts(input: ForecastInput): Promise<ForecastResult> {
  const { propertyId, months, includeSeasonality, includeGrowthTrend } = input
  
  // Történeti adatok lekérése
  const historicalData = await getHistoricalFinancialData(propertyId, 24) // 2 év
  const marketData = await getMarketAnalysis(propertyId)
  
  const forecasts: MonthlyForecast[] = []
  const startDate = new Date()
  
  for (let i = 0; i < months; i++) {
    const forecastDate = new Date(startDate)
    forecastDate.setMonth(forecastDate.getMonth() + i)
    
    const monthForecast = await calculateMonthlyForecast(
      forecastDate,
      historicalData,
      marketData,
      includeSeasonality,
      includeGrowthTrend
    )
    
    forecasts.push(monthForecast)
  }
  
  const summary = calculateForecastSummary(forecasts)
  const recommendations = generateFinancialRecommendations(forecasts, marketData)
  
  return {
    forecasts,
    summary,
    recommendations
  }
}

// Történeti pénzügyi adatok
async function getHistoricalFinancialData(propertyId?: string, months = 24) {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)
  
  const whereClause: any = {
    createdAt: { gte: startDate }
  }
  
  if (propertyId) {
    whereClause.propertyId = propertyId
  }
  
  // Szerződések és bérleti díjak
  const contracts = await prisma.contract.findMany({
    where: whereClause,
    include: {
      property: true,
      tenant: true
    }
  })
  
  // Karbantartási költségek
  const issues = await prisma.issue.findMany({
    where: {
      ...whereClause,
      status: 'CLOSED'
    },
    include: {
      offers: true
    }
  })
  
  // Havi bontás
  const monthlyData = organizeDataByMonth(contracts, issues)
  
  return monthlyData
}

// Piaci elemzés
async function getMarketAnalysis(propertyId?: string): Promise<MarketAnalysis> {
  let targetCity = 'Budapest' // Default
  
  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { city: true }
    })
    targetCity = property?.city || 'Budapest'
  }
  
  // Hasonló ingatlanok átlagos bérleti díja
  const similarProperties = await prisma.property.findMany({
    where: { city: targetCity },
    include: {
      contracts: {
        where: {
          status: 'ACTIVE'
        },
        select: {
          monthlyRent: true
        }
      }
    }
  })
  
  const rents = similarProperties.flatMap(p => 
    p.contracts.map(c => parseFloat(c.monthlyRent.toString()))
  )
  
  const averageRent = rents.length > 0 
    ? rents.reduce((sum, rent) => sum + rent, 0) / rents.length
    : 150000 // Default HUF
  
  // Szezonális tényezők (magyar piac alapján)
  const seasonalFactors = {
    '01': 0.9,  // Január - alacsonyabb kereslet
    '02': 0.9,  // Február
    '03': 1.1,  // Március - tavaszi felélénkülés
    '04': 1.1,  // Április
    '05': 1.0,  // Május
    '06': 1.0,  // Június
    '07': 0.95, // Július - nyári csökkenés
    '08': 0.95, // Augusztus
    '09': 1.2,  // Szeptember - egyetemi szezon kezdete
    '10': 1.1,  // Október
    '11': 1.0,  // November
    '12': 0.9   // December - év vége
  }
  
  return {
    averageRent,
    marketGrowth: 0.05, // 5% éves növekedés
    competitionLevel: 'MEDIUM',
    seasonalFactors
  }
}

// Havi előrejelzés számítása
async function calculateMonthlyForecast(
  date: Date,
  historicalData: any,
  marketData: MarketAnalysis,
  includeSeasonality: boolean,
  includeGrowthTrend: boolean
): Promise<MonthlyForecast> {
  const monthKey = date.toISOString().substring(0, 7) // YYYY-MM
  const monthNumber = String(date.getMonth() + 1).padStart(2, '0')
  
  // Alapbevétel számítás
  let baseRevenue = marketData.averageRent
  
  // Növekedési trend alkalmazása
  if (includeGrowthTrend) {
    const monthsFromNow = (date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    baseRevenue *= Math.pow(1 + marketData.marketGrowth / 12, monthsFromNow)
  }
  
  // Szezonális kiigazítás
  if (includeSeasonality) {
    baseRevenue *= marketData.seasonalFactors[monthNumber] || 1
  }
  
  // Bevételek lebontása
  const revenue: RevenueBreakdown = {
    rental: baseRevenue * 0.85, // Bérleti díj
    utilities: baseRevenue * 0.10, // Közüzemek
    maintenance: baseRevenue * 0.03, // Karbantartás
    other: baseRevenue * 0.02, // Egyéb
    total: baseRevenue
  }
  
  // Költségek becslése
  const expenses = {
    maintenance: revenue.total * 0.15, // 15% karbantartás
    utilities: revenue.utilities * 0.8, // Közüzemek
    management: revenue.total * 0.08, // Kezelési díj
    repairs: revenue.total * 0.05, // Javítások
    other: revenue.total * 0.02, // Egyéb
    total: 0
  }
  expenses.total = Object.values(expenses).reduce((sum, val) => sum + val, 0) - expenses.total
  
  // Kihasználtság becslése
  const occupancyRate = calculateOccupancyRate(date, historicalData, marketData)
  
  // Alkalmazott kihasználtság
  revenue.rental *= occupancyRate
  revenue.utilities *= occupancyRate
  revenue.total = Object.values(revenue).reduce((sum, val) => sum + val, 0) - revenue.total
  
  const netIncome = revenue.total - expenses.total
  
  // Bizalmi szint
  const confidence = calculateConfidence(date, historicalData, includeSeasonality)
  
  return {
    month: monthKey,
    revenue,
    expenses,
    netIncome,
    occupancyRate,
    confidence
  }
}

// Kihasználtság becslése
function calculateOccupancyRate(date: Date, historicalData: any, marketData: MarketAnalysis): number {
  // Alapkihasználtság
  let baseOccupancy = 0.85 // 85% alapértelmezett
  
  // Szezonális befolyás
  const monthNumber = String(date.getMonth() + 1).padStart(2, '0')
  const seasonalFactor = marketData.seasonalFactors[monthNumber] || 1
  
  // Kihasználtság = alap * szezonális * (1 + random variancia)
  const occupancy = Math.min(1.0, baseOccupancy * seasonalFactor * (0.95 + Math.random() * 0.1))
  
  return occupancy
}

// Bizalmi szint számítása
function calculateConfidence(date: Date, historicalData: any, includeSeasonality: boolean): number {
  let confidence = 70 // Alap bizalmi szint
  
  // Közeli hónapok magasabb bizalmi szinttel
  const monthsAhead = (date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
  
  if (monthsAhead <= 3) confidence += 20 // +20% 3 hónapon belül
  else if (monthsAhead <= 6) confidence += 10 // +10% 6 hónapon belül
  else if (monthsAhead > 12) confidence -= 15 // -15% 12 hónapon túl
  
  // Szezonális kiigazítás növeli a bizalmat
  if (includeSeasonality) confidence += 10
  
  // Történeti adatok mennyisége
  if (historicalData && historicalData.length > 12) confidence += 10
  
  return Math.min(95, Math.max(30, confidence))
}

// Havi adatok szervezése
function organizeDataByMonth(contracts: any[], issues: any[]) {
  const monthlyData: Record<string, any> = {}
  
  // Szerződések feldolgozása
  contracts.forEach(contract => {
    const month = contract.createdAt.toISOString().substring(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, expenses: 0, contracts: 0, issues: 0 }
    }
    monthlyData[month].revenue += parseFloat(contract.monthlyRent.toString())
    monthlyData[month].contracts++
  })
  
  // Hibabejelentések költségei
  issues.forEach(issue => {
    const month = issue.createdAt.toISOString().substring(0, 7)
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, expenses: 0, contracts: 0, issues: 0 }
    }
    
    const totalCost = issue.offers.reduce((sum: number, offer: any) => 
      sum + parseFloat(offer.totalPrice.toString()), 0)
    
    monthlyData[month].expenses += totalCost
    monthlyData[month].issues++
  })
  
  return monthlyData
}

// Összesítő számítás
function calculateForecastSummary(forecasts: MonthlyForecast[]) {
  const totalRevenue = forecasts.reduce((sum, f) => sum + f.revenue.total, 0)
  const totalExpenses = forecasts.reduce((sum, f) => sum + f.expenses.total, 0)
  const totalNetIncome = totalRevenue - totalExpenses
  
  const averageOccupancy = forecasts.reduce((sum, f) => sum + f.occupancyRate, 0) / forecasts.length
  const averageConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
  
  // Trendek számítása
  const firstQuarter = forecasts.slice(0, 3)
  const lastQuarter = forecasts.slice(-3)
  
  const avgFirstRevenue = firstQuarter.reduce((sum, f) => sum + f.revenue.total, 0) / firstQuarter.length
  const avgLastRevenue = lastQuarter.reduce((sum, f) => sum + f.revenue.total, 0) / lastQuarter.length
  const revenueGrowth = ((avgLastRevenue - avgFirstRevenue) / avgFirstRevenue) * 100
  
  const avgFirstExpenses = firstQuarter.reduce((sum, f) => sum + f.expenses.total, 0) / firstQuarter.length
  const avgLastExpenses = lastQuarter.reduce((sum, f) => sum + f.expenses.total, 0) / lastQuarter.length
  const expenseGrowth = ((avgLastExpenses - avgFirstExpenses) / avgFirstExpenses) * 100
  
  const avgFirstNet = firstQuarter.reduce((sum, f) => sum + f.netIncome, 0) / firstQuarter.length
  const avgLastNet = lastQuarter.reduce((sum, f) => sum + f.netIncome, 0) / lastQuarter.length
  const netIncomeGrowth = ((avgLastNet - avgFirstNet) / avgFirstNet) * 100
  
  return {
    totalRevenue,
    totalExpenses,
    totalNetIncome,
    averageOccupancy,
    averageConfidence,
    trends: {
      revenueGrowth,
      expenseGrowth,
      netIncomeGrowth
    }
  }
}

// Pénzügyi javaslatok generálása
function generateFinancialRecommendations(forecasts: MonthlyForecast[], marketData: MarketAnalysis): string[] {
  const recommendations: string[] = []
  
  // Bevételi trendek elemzése
  const avgMonthlyRevenue = forecasts.reduce((sum, f) => sum + f.revenue.total, 0) / forecasts.length
  const avgMonthlyExpenses = forecasts.reduce((sum, f) => sum + f.expenses.total, 0) / forecasts.length
  const profitMargin = ((avgMonthlyRevenue - avgMonthlyExpenses) / avgMonthlyRevenue) * 100
  
  if (profitMargin < 20) {
    recommendations.push('⚠️ Alacsony nyereségráta (20% alatt) - költségcsökkentési lehetőségek felülvizsgálata javasolt')
  }
  
  if (profitMargin > 40) {
    recommendations.push('💰 Magas nyereségráta - bérleti díj optimalizálás vagy további beruházások megfontolása')
  }
  
  // Szezonális javaslatok
  const highSeasonMonths = forecasts.filter(f => f.occupancyRate > 0.9)
  if (highSeasonMonths.length > 3) {
    recommendations.push('📈 Magas szezonális kereslet - dinamikus árazás bevezetése javasolt')
  }
  
  const lowSeasonMonths = forecasts.filter(f => f.occupancyRate < 0.7)
  if (lowSeasonMonths.length > 2) {
    recommendations.push('📉 Alacsony kihasználtságú időszakok - marketing aktivitás vagy kedvezmények megfontolása')
  }
  
  // Karbantartási költségek
  const avgMaintenanceCost = forecasts.reduce((sum, f) => sum + f.expenses.maintenance, 0) / forecasts.length
  const maintenanceRatio = (avgMaintenanceCost / avgMonthlyRevenue) * 100
  
  if (maintenanceRatio > 20) {
    recommendations.push('🔧 Magas karbantartási költségek - megelőző karbantartási program bevezetése javasolt')
  }
  
  // Piaci pozíció
  if (marketData.competitionLevel === 'HIGH') {
    recommendations.push('🏆 Erős verseny - szolgáltatásminőség és ügyfélélmény fejlesztése kulcsfontosságú')
  }
  
  // Kihasználtság optimalizálás
  const avgOccupancy = forecasts.reduce((sum, f) => sum + f.occupancyRate, 0) / forecasts.length
  if (avgOccupancy < 0.8) {
    recommendations.push('🎯 Alacsony kihasználtság - marketing stratégia és árpozicionálás felülvizsgálata')
  }
  
  return recommendations
}

// Ingatlan ROI számítás
export async function calculatePropertyROI(propertyId: string, timeframeMonths = 12): Promise<{
  roi: number
  paybackPeriod: number
  cashFlow: number[]
  investment: number
  totalReturn: number
}> {
  // Ingatlan érték és befektetett összeg
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { 
      price: true,
      renovationCost: true 
    }
  })
  
  const investment = property ? 
    parseFloat(property.price.toString()) + (parseFloat(property.renovationCost?.toString() || '0')) :
    50000000 // 50M HUF default
  
  // Bevétel előrejelzés
  const forecast = await generateRevenueForecasts({
    propertyId,
    months: timeframeMonths,
    includeSeasonality: true,
    includeGrowthTrend: true
  })
  
  const cashFlow = forecast.forecasts.map(f => f.netIncome)
  const totalReturn = cashFlow.reduce((sum, cf) => sum + cf, 0)
  
  const roi = ((totalReturn - investment) / investment) * 100
  const paybackPeriod = investment / (totalReturn / timeframeMonths) // hónapokban
  
  return {
    roi,
    paybackPeriod,
    cashFlow,
    investment,
    totalReturn
  }
}

// Portfólió szintű elemzés
export async function analyzePortfolioPerformance(): Promise<{
  totalValue: number
  totalRevenue: number
  totalExpenses: number
  averageROI: number
  topPerformers: any[]
  underperformers: any[]
}> {
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      street: true,
      city: true,
      price: true
    }
  })
  
  const portfolioAnalysis = await Promise.all(
    properties.map(async (property) => {
      const roi = await calculatePropertyROI(property.id, 12)
      return {
        ...property,
        roi: roi.roi,
        totalReturn: roi.totalReturn
      }
    })
  )
  
  const totalValue = portfolioAnalysis.reduce((sum, p) => sum + parseFloat(p.price.toString()), 0)
  const totalRevenue = portfolioAnalysis.reduce((sum, p) => sum + p.totalReturn, 0)
  const averageROI = portfolioAnalysis.reduce((sum, p) => sum + p.roi, 0) / portfolioAnalysis.length
  
  const topPerformers = portfolioAnalysis
    .filter(p => p.roi > averageROI)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5)
  
  const underperformers = portfolioAnalysis
    .filter(p => p.roi < averageROI * 0.7)
    .sort((a, b) => a.roi - b.roi)
    .slice(0, 5)
  
  return {
    totalValue,
    totalRevenue,
    totalExpenses: 0, // Számítandó
    averageROI,
    topPerformers,
    underperformers
  }
}