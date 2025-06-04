/**
 * Zoho Books API Integration for Spanish Market
 * Handles invoicing, VAT compliance, and AEAT export preparation
 */

import { env } from '@/env'
import { getZohoConfig } from '@/lib/integration-config'

export interface ZohoConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  organizationId: string
  region: 'eu' | 'com' // EU for Spain
}

export interface SpanishVATConfiguration {
  vatName: 'IVA General' | 'IVA Reducido' | 'IVA Superreducido'
  vatPercentage: 21 | 10 | 4 // Spanish VAT rates
  vatType: 'output' | 'input'
}

export interface ZohoInvoiceLineItem {
  itemId?: string
  name: string
  description?: string
  rate: number
  quantity: number
  unit?: string
  taxId?: string
  taxPercentage?: number
  taxType?: string
}

export interface SpanishInvoice {
  customerId: string
  invoiceNumber?: string
  date: string
  dueDate: string
  lineItems: ZohoInvoiceLineItem[]
  taxes: SpanishVATConfiguration[]
  currency: 'EUR'
  language: 'es'
  notes?: string
  terms?: string
  referenceNumber?: string // For rental property reference
}

export interface ZohoAuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface ZohoCustomer {
  contact_id?: string
  contact_name: string
  company_name?: string
  contact_type: 'customer' | 'vendor'
  email?: string
  phone?: string
  billing_address?: {
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  vat_treatment?: 'vat_registered' | 'vat_not_registered'
  tax_id?: string // Spanish NIF/CIF
}

export interface ZohoInvoiceResponse {
  invoice_id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'void'
  total: number
  balance: number
  created_time: string
  invoice_url: string
  invoice_pdf_url: string
}

class ZohoBooksAPI {
  private baseUrl: string
  private accessToken: string | null = null
  private config: ZohoConfig

  constructor(config: ZohoConfig) {
    this.config = config
    this.baseUrl = config.region === 'eu' 
      ? 'https://books.zoho.eu/api/v3' 
      : 'https://books.zoho.com/api/v3'
  }

  /**
   * Get access token using refresh token
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    const authUrl = this.config.region === 'eu'
      ? 'https://accounts.zoho.eu/oauth/v2/token'
      : 'https://accounts.zoho.com/oauth/v2/token'

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error(`Zoho auth failed: ${response.statusText}`)
    }

    const data: ZohoAuthResponse = await response.json()
    this.accessToken = data.access_token
    return this.accessToken
  }

  /**
   * Make authenticated API request to Zoho Books
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken()
    
    const url = `${this.baseUrl}${endpoint}?organization_id=${this.config.organizationId}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Zoho API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Create or update customer in Zoho Books
   */
  async createCustomer(customer: ZohoCustomer): Promise<ZohoCustomer> {
    const response = await this.apiRequest<{ contact: ZohoCustomer }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(customer),
    })

    return response.contact
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<ZohoCustomer | null> {
    try {
      const response = await this.apiRequest<{ contacts: ZohoCustomer[] }>(
        `/contacts?email=${encodeURIComponent(email)}`
      )
      
      return response.contacts.length > 0 ? response.contacts[0] : null
    } catch (error) {
      console.error('Error fetching customer:', error)
      return null
    }
  }

  /**
   * Create Spanish VAT compliant invoice
   */
  async createSpanishInvoice(invoiceData: SpanishInvoice): Promise<ZohoInvoiceResponse> {
    // Ensure customer exists
    let customer = await this.getCustomerByEmail(invoiceData.customerId)
    
    if (!customer) {
      // Create customer if doesn't exist
      customer = await this.createCustomer({
        contact_name: invoiceData.customerId,
        contact_type: 'customer',
        email: invoiceData.customerId,
        vat_treatment: 'vat_registered', // Assume VAT registered for Spanish customers
      })
    }

    // Prepare invoice payload with Spanish VAT
    const invoicePayload = {
      customer_id: customer.contact_id,
      date: invoiceData.date,
      due_date: invoiceData.dueDate,
      currency_code: invoiceData.currency,
      language_code: invoiceData.language,
      invoice_number: invoiceData.invoiceNumber,
      reference_number: invoiceData.referenceNumber,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      line_items: invoiceData.lineItems.map(item => ({
        name: item.name,
        description: item.description,
        rate: item.rate,
        quantity: item.quantity,
        unit: item.unit || 'nos',
        tax_id: item.taxId,
        tax_percentage: item.taxPercentage || this.getSpanishVATRate(item.rate),
      })),
      // Spanish VAT configuration
      taxes: invoiceData.taxes.map(tax => ({
        tax_name: tax.vatName,
        tax_percentage: tax.vatPercentage,
        tax_type: tax.vatType,
      })),
    }

    const response = await this.apiRequest<{ invoice: ZohoInvoiceResponse }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoicePayload),
    })

    return response.invoice
  }

  /**
   * Get Spanish VAT rate based on item type and Spanish tax rules
   */
  private getSpanishVATRate(itemType: 'rental' | 'maintenance' | 'utilities' | 'other', amount: number): number {
    switch (itemType) {
      case 'rental':
        // Vivienda habitual: IVA Exento (0%)
        // Vivienda turística: IVA General (21%)
        return 21 // Tourist rental properties
      
      case 'maintenance':
        // Servicios de reparación: IVA General
        return 21
      
      case 'utilities':
        // Suministros básicos: IVA Reducido
        return 10
      
      default:
        // Other services: IVA General
        return 21
    }
  }

  /**
   * Calculate Spanish VAT breakdown
   */
  calculateSpanishVAT(netAmount: number, vatRate: number): {
    netAmount: number
    vatAmount: number
    grossAmount: number
    vatRate: number
  } {
    const vatAmount = netAmount * (vatRate / 100)
    const grossAmount = netAmount + vatAmount
    
    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100,
      vatRate,
    }
  }

  /**
   * Create Spanish tax configuration for invoice
   */
  private createSpanishTaxConfig(items: Array<{
    type: 'rental' | 'maintenance' | 'utilities' | 'other'
    amount: number
  }>): {
    lineItems: any[]
    taxes: SpanishVATConfiguration[]
    vatSummary: {
      totalNet: number
      totalVAT: number
      totalGross: number
    }
  } {
    const lineItems = []
    const taxSummary = new Map<number, { net: number, vat: number }>()
    let totalNet = 0
    let totalVAT = 0

    for (const item of items) {
      const vatRate = this.getSpanishVATRate(item.type, item.amount)
      const vatBreakdown = this.calculateSpanishVAT(item.amount, vatRate)
      
      lineItems.push({
        name: this.getSpanishItemName(item.type),
        description: this.getSpanishItemDescription(item.type),
        rate: vatBreakdown.netAmount,
        quantity: 1,
        unit: 'unidad',
        tax_percentage: vatRate,
        tax_type: 'output',
      })

      // Accumulate tax summary
      if (!taxSummary.has(vatRate)) {
        taxSummary.set(vatRate, { net: 0, vat: 0 })
      }
      const summary = taxSummary.get(vatRate)!
      summary.net += vatBreakdown.netAmount
      summary.vat += vatBreakdown.vatAmount

      totalNet += vatBreakdown.netAmount
      totalVAT += vatBreakdown.vatAmount
    }

    // Create tax configurations
    const taxes: SpanishVATConfiguration[] = Array.from(taxSummary.entries()).map(([rate, amounts]) => ({
      vatName: this.getSpanishVATName(rate),
      vatPercentage: rate,
      vatType: 'output',
    }))

    return {
      lineItems,
      taxes,
      vatSummary: {
        totalNet: Math.round(totalNet * 100) / 100,
        totalVAT: Math.round(totalVAT * 100) / 100,
        totalGross: Math.round((totalNet + totalVAT) * 100) / 100,
      }
    }
  }

  /**
   * Get Spanish VAT name based on rate
   */
  private getSpanishVATName(rate: number): 'IVA General' | 'IVA Reducido' | 'IVA Superreducido' {
    switch (rate) {
      case 21:
        return 'IVA General'
      case 10:
        return 'IVA Reducido'
      case 4:
        return 'IVA Superreducido'
      default:
        return 'IVA General'
    }
  }

  /**
   * Get Spanish item name based on type
   */
  private getSpanishItemName(type: 'rental' | 'maintenance' | 'utilities' | 'other'): string {
    switch (type) {
      case 'rental':
        return 'Alquiler de vivienda turística'
      case 'maintenance':
        return 'Servicios de mantenimiento'
      case 'utilities':
        return 'Suministros y servicios básicos'
      default:
        return 'Otros servicios'
    }
  }

  /**
   * Get Spanish item description based on type
   */
  private getSpanishItemDescription(type: 'rental' | 'maintenance' | 'utilities' | 'other'): string {
    switch (type) {
      case 'rental':
        return 'Alquiler temporal de vivienda turística según normativa española'
      case 'maintenance':
        return 'Servicios de mantenimiento, reparación y conservación de inmuebles'
      case 'utilities':
        return 'Suministros de agua, electricidad, gas y otros servicios básicos'
      default:
        return 'Otros servicios relacionados con la gestión inmobiliaria'
    }
  }

  /**
   * Get all invoices with filters
   */
  async getInvoices(filters: {
    status?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
  } = {}): Promise<ZohoInvoiceResponse[]> {
    let endpoint = '/invoices'
    const params = new URLSearchParams()

    if (filters.status) params.append('status', filters.status)
    if (filters.customerId) params.append('customer_id', filters.customerId)
    if (filters.dateFrom) params.append('date_start', filters.dateFrom)
    if (filters.dateTo) params.append('date_end', filters.dateTo)

    if (params.toString()) {
      endpoint += `&${params.toString()}`
    }

    const response = await this.apiRequest<{ invoices: ZohoInvoiceResponse[] }>(endpoint)
    return response.invoices
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId: string, paymentData: {
    amount: number
    date: string
    paymentMode: string
    reference?: string
  }): Promise<void> {
    await this.apiRequest(`/invoices/${invoiceId}/status/paid`, {
      method: 'POST',
      body: JSON.stringify({
        amount: paymentData.amount,
        date: paymentData.date,
        payment_mode: paymentData.paymentMode,
        reference_number: paymentData.reference,
      }),
    })
  }

  /**
   * Export AEAT compliant data
   */
  async exportAEATData(dateFrom: string, dateTo: string): Promise<any[]> {
    const invoices = await this.getInvoices({
      dateFrom,
      dateTo,
      status: 'paid',
    })

    // Format for AEAT SII (Suministro Inmediato de Información)
    return invoices.map(invoice => ({
      TipoFactura: 'F1', // Standard invoice
      ClaveRegimenEspecialOTrascendencia: '01', // General regime
      DescripcionOperacion: 'Alquiler de vivienda',
      ImporteTotal: invoice.total,
      TipoDesglose: {
        DesgloseFactura: {
          Sujeta: {
            NoExenta: {
              TipoNoExenta: 'S1',
              DesgloseIVA: {
                DetalleIVA: [{
                  TipoImpositivo: 21.00,
                  BaseImponible: invoice.total / 1.21,
                  CuotaRepercutida: invoice.total - (invoice.total / 1.21),
                }]
              }
            }
          }
        }
      },
      Contraparte: {
        NombreRazon: 'Tenant Name', // Would come from customer data
        NIF: 'XX123456X', // Spanish tax ID
      },
      FechaOperacion: invoice.created_time.split('T')[0],
      NumSerieFacturaEmisor: invoice.invoice_number,
    }))
  }
}

// Singleton instance
let zohoBooksInstance: ZohoBooksAPI | null = null

export async function getZohoBooksClient(): Promise<ZohoBooksAPI> {
  if (!zohoBooksInstance) {
    const config = await getZohoConfig()
    const zohoConfig: ZohoConfig = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken || '',
      organizationId: config.organizationId || '',
      region: config.region === 'eu' ? 'eu' : 'com',
    }

    zohoBooksInstance = new ZohoBooksAPI(zohoConfig)
  }

  return zohoBooksInstance
}

// Helper functions for rental-specific operations
export class RentalInvoiceHelper {
  private zoho: ZohoBooksAPI

  constructor() {
    this.zoho = getZohoBooksClient()
  }

  /**
   * Create monthly rental invoice with proper Spanish VAT calculation
   */
  async createMonthlyRentalInvoice(params: {
    tenantEmail: string
    tenantName: string
    propertyAddress: string
    monthlyRent: number
    month: string
    year: number
    dueDate: string
    propertyReference?: string
    isShortTermRental?: boolean // Tourist/short-term vs long-term rental
    includeUtilities?: boolean
    utilitiesAmount?: number
  }): Promise<ZohoInvoiceResponse & { vatBreakdown: any }> {
    // Prepare invoice items
    const invoiceItems = []
    
    // Main rental item
    invoiceItems.push({
      type: params.isShortTermRental ? 'rental' : 'rental',
      amount: params.monthlyRent,
    })

    // Add utilities if included
    if (params.includeUtilities && params.utilitiesAmount) {
      invoiceItems.push({
        type: 'utilities' as const,
        amount: params.utilitiesAmount,
      })
    }

    // Calculate Spanish VAT configuration
    const taxConfig = this.zoho.createSpanishTaxConfig(invoiceItems)

    const invoiceData: SpanishInvoice = {
      customerId: params.tenantEmail,
      date: new Date().toISOString().split('T')[0],
      dueDate: params.dueDate,
      currency: 'EUR',
      language: 'es',
      referenceNumber: params.propertyReference,
      notes: `Alquiler ${params.isShortTermRental ? 'turístico' : 'residencial'} - ${params.propertyAddress}`,
      terms: 'Pago según condiciones del contrato de alquiler',
      lineItems: taxConfig.lineItems.map((item, index) => ({
        ...item,
        name: index === 0 
          ? `Alquiler ${params.month}/${params.year}` 
          : `Servicios incluidos ${params.month}/${params.year}`,
        description: index === 0
          ? `${params.isShortTermRental ? 'Alquiler turístico' : 'Alquiler residencial'} - ${params.propertyAddress}`
          : `Suministros y servicios básicos incluidos en el alquiler`,
      })),
      taxes: taxConfig.taxes,
    }

    const invoice = await this.zoho.createSpanishInvoice(invoiceData)

    return {
      ...invoice,
      vatBreakdown: taxConfig.vatSummary,
    }
  }

  /**
   * Create maintenance service invoice
   */
  async createMaintenanceInvoice(params: {
    providerEmail: string
    providerName: string
    serviceDescription: string
    amount: number
    propertyReference: string
    date: string
  }): Promise<ZohoInvoiceResponse> {
    const invoiceData: SpanishInvoice = {
      customerId: params.providerEmail,
      date: params.date,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      currency: 'EUR',
      language: 'es',
      referenceNumber: params.propertyReference,
      notes: `Servicio de mantenimiento - ${params.serviceDescription}`,
      lineItems: [{
        name: 'Servicio de mantenimiento',
        description: params.serviceDescription,
        rate: params.amount,
        quantity: 1,
        taxPercentage: 21,
      }],
      taxes: [{
        vatName: 'IVA General',
        vatPercentage: 21,
        vatType: 'input', // Input VAT for expenses
      }],
    }

    return this.zoho.createSpanishInvoice(invoiceData)
  }
}