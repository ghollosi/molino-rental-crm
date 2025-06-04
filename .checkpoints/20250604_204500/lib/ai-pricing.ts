/**
 * AI-based Dynamic Pricing Service
 * Provides intelligent pricing recommendations based on multiple data sources
 */

import { z } from 'zod'

// Types
export interface MarketData {
  averagePrice: number
  occupancyRate: number
  demandScore: number // 0-100
  competitors: CompetitorPrice[]
  lastUpdated: Date
}

export interface CompetitorPrice {
  propertyId: string
  name: string
  distance: number // km from our property
  price: number
  rating: number
  amenities: string[]
  availability: boolean
}

export interface WeatherData {
  date: Date
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy'
  beachConditions?: 'excellent' | 'good' | 'poor'
}

export interface LocalEvent {
  name: string
  date: Date
  type: 'festival' | 'sports' | 'conference' | 'holiday'
  expectedAttendance: number
  distance: number // km from property
  impactScore: number // 1-10
}

export interface PricingRecommendation {
  basePrice: number
  recommendedPrice: number
  minPrice: number
  maxPrice: number
  confidence: number // 0-100
  factors: PricingFactor[]
  reasoning: string
}

export interface PricingFactor {
  name: string
  impact: number // percentage change
  weight: number // importance 0-1
  description: string
}

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const WEATHER_API_KEY = process.env.WEATHER_API_KEY
const EVENTS_API_KEY = process.env.EVENTS_API_KEY

export class AIPricingService {
  private baseUrl = 'https://api.openai.com/v1'
  
  constructor(
    private config: {
      openAiApiKey?: string
      weatherApiKey?: string
      eventsApiKey?: string
      competitorScrapeUrl?: string
    } = {}
  ) {}

  /**
   * Get AI-powered pricing recommendation
   */
  async getRecommendation(params: {
    propertyId: string
    date: Date
    basePrice: number
    location: { lat: number; lng: number }
    propertyType: string
    amenities: string[]
    maxOccupancy: number
    historicalData?: any[]
  }): Promise<PricingRecommendation> {
    try {
      // Gather all data sources in parallel
      const [marketData, weatherData, events, historicalAnalysis] = await Promise.all([
        this.getMarketData(params.location, params.date),
        this.getWeatherForecast(params.location, params.date),
        this.getLocalEvents(params.location, params.date),
        this.analyzeHistoricalData(params.historicalData || [])
      ])

      // Calculate pricing factors
      const factors: PricingFactor[] = []

      // Market demand factor
      if (marketData.demandScore > 80) {
        factors.push({
          name: 'High Market Demand',
          impact: 25,
          weight: 0.9,
          description: `Market demand is very high (${marketData.demandScore}/100)`
        })
      }

      // Competition factor
      const avgCompetitorPrice = this.calculateAverageCompetitorPrice(marketData.competitors)
      const competitionDiff = ((avgCompetitorPrice - params.basePrice) / params.basePrice) * 100
      factors.push({
        name: 'Competition Pricing',
        impact: Math.min(competitionDiff * 0.5, 30), // Cap at 30%
        weight: 0.8,
        description: `Competitors average: €${avgCompetitorPrice.toFixed(2)}`
      })

      // Weather factor (for beach properties)
      if (params.location && this.isCoastalLocation(params.location)) {
        const weatherImpact = this.calculateWeatherImpact(weatherData)
        if (weatherImpact !== 0) {
          factors.push({
            name: 'Weather Conditions',
            impact: weatherImpact,
            weight: 0.7,
            description: `${weatherData.condition} weather expected`
          })
        }
      }

      // Event factor
      const eventImpact = this.calculateEventImpact(events)
      if (eventImpact > 0) {
        factors.push({
          name: 'Local Events',
          impact: eventImpact,
          weight: 0.8,
          description: `${events.length} local events nearby`
        })
      }

      // Seasonality factor (from historical data)
      if (historicalAnalysis.seasonalityFactor) {
        factors.push({
          name: 'Seasonal Trends',
          impact: historicalAnalysis.seasonalityFactor,
          weight: 0.6,
          description: 'Based on historical booking patterns'
        })
      }

      // Last-minute booking factor
      const daysUntilDate = Math.floor((params.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntilDate <= 3) {
        factors.push({
          name: 'Last-Minute Booking',
          impact: -15,
          weight: 0.5,
          description: 'Discount for last-minute availability'
        })
      }

      // Calculate final price
      const recommendedPrice = this.calculateFinalPrice(params.basePrice, factors)
      
      // Get AI reasoning if OpenAI is configured
      let reasoning = 'Price calculated based on market conditions and historical data.'
      if (this.config.openAiApiKey) {
        reasoning = await this.getAIReasoning({
          basePrice: params.basePrice,
          recommendedPrice,
          factors,
          marketData,
          propertyType: params.propertyType
        })
      }

      return {
        basePrice: params.basePrice,
        recommendedPrice,
        minPrice: params.basePrice * 0.7, // 30% minimum discount
        maxPrice: params.basePrice * 2.5, // 150% maximum premium
        confidence: this.calculateConfidence(factors, marketData),
        factors,
        reasoning
      }
    } catch (error) {
      console.error('AI Pricing Error:', error)
      // Fallback to simple rule-based pricing
      return this.getFallbackPricing(params)
    }
  }

  /**
   * Get market data from various sources
   */
  private async getMarketData(
    location: { lat: number; lng: number },
    date: Date
  ): Promise<MarketData> {
    // In production, this would scrape/API call real competitor data
    // For now, we'll simulate with realistic data
    
    const competitors = await this.scrapeCompetitorPrices(location, date)
    const occupancyRate = await this.getMarketOccupancy(location, date)
    const demandScore = this.calculateDemandScore(occupancyRate, competitors.length)

    return {
      averagePrice: this.calculateAverageCompetitorPrice(competitors),
      occupancyRate,
      demandScore,
      competitors,
      lastUpdated: new Date()
    }
  }

  /**
   * Scrape competitor prices (simulated)
   */
  private async scrapeCompetitorPrices(
    location: { lat: number; lng: number },
    date: Date
  ): Promise<CompetitorPrice[]> {
    // TODO: Implement actual web scraping or API integration
    // For now, return simulated data
    
    return [
      {
        propertyId: 'comp-1',
        name: 'Seaside Villa Deluxe',
        distance: 0.5,
        price: 150,
        rating: 4.8,
        amenities: ['pool', 'wifi', 'parking', 'beach-access'],
        availability: true
      },
      {
        propertyId: 'comp-2',
        name: 'Beach House Paradise',
        distance: 0.8,
        price: 180,
        rating: 4.6,
        amenities: ['pool', 'wifi', 'parking', 'air-conditioning'],
        availability: true
      },
      {
        propertyId: 'comp-3',
        name: 'Coastal Apartment',
        distance: 1.2,
        price: 120,
        rating: 4.5,
        amenities: ['wifi', 'parking'],
        availability: false
      }
    ]
  }

  /**
   * Get weather forecast
   */
  private async getWeatherForecast(
    location: { lat: number; lng: number },
    date: Date
  ): Promise<WeatherData> {
    if (!this.config.weatherApiKey) {
      // Fallback simulated data
      return {
        date,
        temperature: 25,
        condition: 'sunny',
        beachConditions: 'excellent'
      }
    }

    // OpenWeatherMap API integration
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lng}&appid=${this.config.weatherApiKey}&units=metric`
    )
    
    const data = await response.json()
    // Parse and return weather data
    // ... implementation
    
    return {
      date,
      temperature: 25,
      condition: 'sunny',
      beachConditions: 'excellent'
    }
  }

  /**
   * Get local events
   */
  private async getLocalEvents(
    location: { lat: number; lng: number },
    date: Date
  ): Promise<LocalEvent[]> {
    // TODO: Integrate with events APIs (Eventbrite, local tourism APIs)
    // For now, return simulated data
    
    const events: LocalEvent[] = []
    
    // Check for major holidays
    if (this.isHoliday(date)) {
      events.push({
        name: 'Public Holiday',
        date,
        type: 'holiday',
        expectedAttendance: 10000,
        distance: 0,
        impactScore: 8
      })
    }
    
    // Simulate local events
    events.push({
      name: 'Alicante Summer Festival',
      date,
      type: 'festival',
      expectedAttendance: 5000,
      distance: 2.5,
      impactScore: 6
    })
    
    return events
  }

  /**
   * Analyze historical booking data
   */
  private async analyzeHistoricalData(historicalData: any[]): Promise<any> {
    if (!historicalData || historicalData.length === 0) {
      return { seasonalityFactor: 0 }
    }

    // Simple seasonality analysis
    // In production, this would use ML models
    const currentMonth = new Date().getMonth()
    const summerMonths = [5, 6, 7, 8] // June-September
    const seasonalityFactor = summerMonths.includes(currentMonth) ? 15 : 0

    return {
      seasonalityFactor,
      averageBookingRate: 0.65,
      averageStayLength: 5
    }
  }

  /**
   * Get AI reasoning using OpenAI
   */
  private async getAIReasoning(params: {
    basePrice: number
    recommendedPrice: number
    factors: PricingFactor[]
    marketData: MarketData
    propertyType: string
  }): Promise<string> {
    if (!this.config.openAiApiKey) {
      return this.generateSimpleReasoning(params)
    }

    try {
      const prompt = `
        As a vacation rental pricing expert, explain why the price for this property should be €${params.recommendedPrice} instead of the base price €${params.basePrice}.
        
        Property type: ${params.propertyType}
        Market average: €${params.marketData.averagePrice}
        Occupancy rate: ${params.marketData.occupancyRate}%
        Demand score: ${params.marketData.demandScore}/100
        
        Key factors:
        ${params.factors.map(f => `- ${f.name}: ${f.impact > 0 ? '+' : ''}${f.impact}% (${f.description})`).join('\n')}
        
        Provide a brief, clear explanation in 2-3 sentences that a property owner would understand.
      `

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openAiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a vacation rental pricing expert. Provide clear, concise explanations for pricing recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      })

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('OpenAI API Error:', error)
      return this.generateSimpleReasoning(params)
    }
  }

  // Helper methods
  private calculateAverageCompetitorPrice(competitors: CompetitorPrice[]): number {
    if (competitors.length === 0) return 0
    const availableCompetitors = competitors.filter(c => c.availability)
    if (availableCompetitors.length === 0) return 0
    
    const sum = availableCompetitors.reduce((acc, c) => acc + c.price, 0)
    return sum / availableCompetitors.length
  }

  private calculateDemandScore(occupancyRate: number, competitorCount: number): number {
    // Simple demand calculation
    const occupancyScore = occupancyRate * 0.7
    const scarcityScore = Math.max(0, (10 - competitorCount) * 3)
    return Math.min(100, occupancyScore + scarcityScore)
  }

  private isCoastalLocation(location: { lat: number; lng: number }): boolean {
    // Simple check for Alicante coastal area
    return location.lat >= 38.0 && location.lat <= 39.0 && 
           location.lng >= -1.0 && location.lng <= 0.0
  }

  private calculateWeatherImpact(weather: WeatherData): number {
    if (weather.condition === 'sunny' && weather.temperature >= 25) return 15
    if (weather.condition === 'sunny' && weather.temperature >= 20) return 10
    if (weather.condition === 'cloudy') return 0
    if (weather.condition === 'rainy') return -10
    if (weather.condition === 'stormy') return -20
    return 0
  }

  private calculateEventImpact(events: LocalEvent[]): number {
    if (events.length === 0) return 0
    const totalImpact = events.reduce((sum, event) => {
      const distanceFactor = Math.max(0, 1 - (event.distance / 10))
      return sum + (event.impactScore * distanceFactor)
    }, 0)
    return Math.min(30, totalImpact * 2)
  }

  private calculateFinalPrice(basePrice: number, factors: PricingFactor[]): number {
    let finalPrice = basePrice
    
    for (const factor of factors) {
      const adjustment = basePrice * (factor.impact / 100) * factor.weight
      finalPrice += adjustment
    }
    
    // Round to nearest 5
    return Math.round(finalPrice / 5) * 5
  }

  private calculateConfidence(factors: PricingFactor[], marketData: MarketData): number {
    // Base confidence on data quality and factor weights
    let confidence = 60 // Base confidence
    
    if (marketData.competitors.length >= 3) confidence += 15
    if (factors.length >= 4) confidence += 15
    if (marketData.lastUpdated.getTime() > Date.now() - 3600000) confidence += 10 // Fresh data
    
    return Math.min(95, confidence)
  }

  private isHoliday(date: Date): boolean {
    // Spanish holidays - simplified
    const month = date.getMonth() + 1
    const day = date.getDate()
    
    const holidays = [
      { month: 1, day: 1 },   // New Year
      { month: 1, day: 6 },   // Epiphany
      { month: 5, day: 1 },   // Labor Day
      { month: 8, day: 15 },  // Assumption
      { month: 10, day: 12 }, // National Day
      { month: 11, day: 1 },  // All Saints
      { month: 12, day: 6 },  // Constitution Day
      { month: 12, day: 25 }  // Christmas
    ]
    
    return holidays.some(h => h.month === month && h.day === day)
  }

  private generateSimpleReasoning(params: any): string {
    const priceDiff = params.recommendedPrice - params.basePrice
    const percentChange = (priceDiff / params.basePrice * 100).toFixed(0)
    
    if (priceDiff > 0) {
      return `Based on current market conditions, competitor pricing averaging €${params.marketData.averagePrice}, and a high demand score of ${params.marketData.demandScore}/100, we recommend increasing your price by ${percentChange}% to maximize revenue while remaining competitive.`
    } else {
      return `Due to lower market demand and competitive pressure, we recommend a ${Math.abs(Number(percentChange))}% price reduction to ensure occupancy and maintain competitiveness in the current market.`
    }
  }

  private getFallbackPricing(params: any): PricingRecommendation {
    // Simple rule-based fallback
    const date = params.date
    const dayOfWeek = date.getDay()
    const month = date.getMonth()
    
    let price = params.basePrice
    
    // Weekend premium
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      price *= 1.3
    }
    
    // Summer premium
    if (month >= 5 && month <= 8) {
      price *= 1.5
    }
    
    return {
      basePrice: params.basePrice,
      recommendedPrice: Math.round(price / 5) * 5,
      minPrice: params.basePrice * 0.7,
      maxPrice: params.basePrice * 2.5,
      confidence: 60,
      factors: [
        {
          name: 'Fallback Pricing',
          impact: ((price - params.basePrice) / params.basePrice) * 100,
          weight: 1,
          description: 'Basic rule-based pricing due to data unavailability'
        }
      ],
      reasoning: 'Price calculated using basic seasonal and weekend rules.'
    }
  }

  /**
   * Get market occupancy rate
   */
  private async getMarketOccupancy(
    location: { lat: number; lng: number },
    date: Date
  ): Promise<number> {
    // TODO: Implement actual market data API
    // For now, return simulated seasonal data
    const month = date.getMonth()
    const summerMonths = [5, 6, 7, 8]
    
    if (summerMonths.includes(month)) {
      return 85 + Math.random() * 10 // 85-95%
    }
    
    return 55 + Math.random() * 20 // 55-75%
  }
}