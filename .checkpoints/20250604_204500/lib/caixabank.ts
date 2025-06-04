/**
 * CaixaBank PSD2 Open Banking API Integration
 * Automatic payment monitoring and reconciliation
 */

import { env } from '@/env'
import { getCaixaBankConfig } from '@/lib/integration-config'

export interface CaixaBankConfig {
  clientId: string
  clientSecret: string
  sandboxMode: boolean
  iban: string
  consentId?: string
}

export interface SpanishBankTransaction {
  transactionId: string
  amount: number
  currency: 'EUR'
  valueDate: string
  bookingDate: string
  reference: string
  creditorName?: string
  creditorIban?: string
  debtorName?: string
  debtorIban?: string
  remittanceInfo?: string
  transactionCode: string
  proprietaryBankTransactionCode?: string
  balanceAfterTransaction?: number
}

export interface RentalPaymentMatcher {
  tenantId: string
  expectedAmount: number
  dueDate: string
  tolerance: number // Amount tolerance for matching (e.g., 0.01 for 1 cent)
  autoReconcile: boolean
  propertyReference?: string
}

export interface BankAccount {
  iban: string
  currency: string
  accountType: string
  cashAccountType: string
  name?: string
  product?: string
  balances: AccountBalance[]
}

export interface AccountBalance {
  balanceAmount: {
    amount: string
    currency: string
  }
  balanceType: string
  creditDebitIndicator: 'CRDT' | 'DBIT'
  dateTime: string
}

export interface ConsentResponse {
  consentId: string
  consentStatus: 'received' | 'valid' | 'rejected' | 'expired' | 'revoked'
  validUntil: string
  frequencyPerDay: number
  lastActionDate: string
  links: {
    scaRedirect?: string
    scaOAuth?: string
    confirmation?: string
    startAuthorisation?: string
  }
}

export interface AccessTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

class CaixaBankAPI {
  private baseUrl: string
  private accessToken: string | null = null
  private config: CaixaBankConfig

  constructor(config: CaixaBankConfig) {
    this.config = config
    this.baseUrl = config.sandboxMode 
      ? 'https://api.sandbox.caixabank.com/psd2/v1'
      : 'https://api.caixabank.com/psd2/v1'
  }

  /**
   * Get OAuth 2.0 access token for API access
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    const tokenUrl = this.config.sandboxMode
      ? 'https://api.sandbox.caixabank.com/oauth2/token'
      : 'https://api.caixabank.com/oauth2/token'

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'psd2:account-information',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CaixaBank auth failed: ${response.status} - ${errorText}`)
    }

    const data: AccessTokenResponse = await response.json()
    this.accessToken = data.access_token
    return this.accessToken
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresConsent = true
  ): Promise<T> {
    const token = await this.getAccessToken()
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-ID': `molino-${Date.now()}`, // Unique request ID
      'PSU-IP-Address': '127.0.0.1', // Required for PSD2
      ...options.headers as Record<string, string>,
    }

    if (requiresConsent && this.config.consentId) {
      headers['Consent-ID'] = this.config.consentId
    }

    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CaixaBank API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Create account information consent
   */
  async createConsent(validUntil?: string): Promise<ConsentResponse> {
    const consentData = {
      access: {
        accounts: [this.config.iban],
        balances: [this.config.iban],
        transactions: [this.config.iban],
      },
      recurringIndicator: true,
      validUntil: validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      frequencyPerDay: 4,
      combinedServiceIndicator: false,
    }

    const response = await this.apiRequest<ConsentResponse>('/consents', {
      method: 'POST',
      body: JSON.stringify(consentData),
    }, false)

    // Store consent ID for future requests
    this.config.consentId = response.consentId
    
    return response
  }

  /**
   * Get consent status
   */
  async getConsentStatus(consentId?: string): Promise<ConsentResponse> {
    const id = consentId || this.config.consentId
    if (!id) {
      throw new Error('No consent ID available')
    }

    return this.apiRequest<ConsentResponse>(`/consents/${id}`, {}, false)
  }

  /**
   * Get account information
   */
  async getAccounts(): Promise<{ accounts: BankAccount[] }> {
    return this.apiRequest<{ accounts: BankAccount[] }>('/accounts')
  }

  /**
   * Get account details
   */
  async getAccountDetails(accountId?: string): Promise<BankAccount> {
    const id = accountId || this.config.iban
    return this.apiRequest<BankAccount>(`/accounts/${id}`)
  }

  /**
   * Get account balances
   */
  async getAccountBalances(accountId?: string): Promise<{ balances: AccountBalance[] }> {
    const id = accountId || this.config.iban
    return this.apiRequest<{ balances: AccountBalance[] }>(`/accounts/${id}/balances`)
  }

  /**
   * Get transactions for account
   */
  async getTransactions(
    accountId?: string,
    dateFrom?: string,
    dateTo?: string,
    bookingStatus: 'booked' | 'pending' | 'both' = 'booked'
  ): Promise<{ transactions: { booked: SpanishBankTransaction[], pending?: SpanishBankTransaction[] } }> {
    const id = accountId || this.config.iban
    
    let endpoint = `/accounts/${id}/transactions?bookingStatus=${bookingStatus}`
    
    if (dateFrom) {
      endpoint += `&dateFrom=${dateFrom}`
    }
    if (dateTo) {
      endpoint += `&dateTo=${dateTo}`
    }

    return this.apiRequest<{ transactions: { booked: SpanishBankTransaction[], pending?: SpanishBankTransaction[] } }>(endpoint)
  }

  /**
   * Match incoming payments to rental expectations
   */
  async matchRentalPayments(
    matchers: RentalPaymentMatcher[],
    dateFrom?: string,
    dateTo?: string
  ): Promise<Array<{
    transaction: SpanishBankTransaction
    matcher: RentalPaymentMatcher
    confidence: number
    autoReconciled: boolean
  }>> {
    const transactions = await this.getTransactions(this.config.iban, dateFrom, dateTo)
    const incomingPayments = transactions.transactions.booked.filter(t => t.amount > 0)
    
    const matches = []

    for (const transaction of incomingPayments) {
      for (const matcher of matchers) {
        const confidence = this.calculatePaymentMatchConfidence(transaction, matcher)
        
        if (confidence > 0.7) { // 70% confidence threshold
          matches.push({
            transaction,
            matcher,
            confidence,
            autoReconciled: matcher.autoReconcile && confidence > 0.9, // Auto-reconcile only for high confidence
          })
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate confidence score for payment matching
   */
  private calculatePaymentMatchConfidence(
    transaction: SpanishBankTransaction,
    matcher: RentalPaymentMatcher
  ): number {
    let confidence = 0

    // Amount matching (40% weight)
    const amountDiff = Math.abs(transaction.amount - matcher.expectedAmount)
    if (amountDiff <= matcher.tolerance) {
      confidence += 0.4
    } else if (amountDiff <= matcher.expectedAmount * 0.05) { // 5% tolerance
      confidence += 0.3
    } else if (amountDiff <= matcher.expectedAmount * 0.1) { // 10% tolerance
      confidence += 0.2
    }

    // Date proximity (20% weight)
    const transactionDate = new Date(transaction.valueDate)
    const dueDate = new Date(matcher.dueDate)
    const daysDiff = Math.abs((transactionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= 1) {
      confidence += 0.2
    } else if (daysDiff <= 3) {
      confidence += 0.15
    } else if (daysDiff <= 7) {
      confidence += 0.1
    }

    // Reference matching (40% weight)
    const referenceText = (transaction.remittanceInfo || transaction.reference || '').toLowerCase()
    
    // Look for property reference
    if (matcher.propertyReference && referenceText.includes(matcher.propertyReference.toLowerCase())) {
      confidence += 0.2
    }

    // Look for tenant ID or common rental keywords
    if (referenceText.includes(matcher.tenantId.toLowerCase()) ||
        referenceText.includes('alquiler') ||
        referenceText.includes('rent') ||
        referenceText.includes('rental')) {
      confidence += 0.2
    }

    return Math.min(confidence, 1.0) // Cap at 100%
  }

  /**
   * Get detailed transaction information
   */
  async getTransactionDetails(
    transactionId: string,
    accountId?: string
  ): Promise<SpanishBankTransaction> {
    const id = accountId || this.config.iban
    return this.apiRequest<SpanishBankTransaction>(`/accounts/${id}/transactions/${transactionId}`)
  }

  /**
   * Export transactions for accounting integration
   */
  async exportTransactionsForAccounting(
    dateFrom: string,
    dateTo: string,
    accountId?: string
  ): Promise<Array<{
    date: string
    amount: number
    currency: string
    description: string
    reference: string
    counterparty: string
    category: 'rental_income' | 'maintenance_expense' | 'utility_expense' | 'other'
  }>> {
    const transactions = await this.getTransactions(accountId, dateFrom, dateTo)
    
    return transactions.transactions.booked.map(transaction => ({
      date: transaction.valueDate,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.remittanceInfo || transaction.reference || 'Bank transaction',
      reference: transaction.reference,
      counterparty: transaction.amount > 0 ? 
        (transaction.debtorName || 'Unknown debtor') : 
        (transaction.creditorName || 'Unknown creditor'),
      category: this.categorizeTransaction(transaction),
    }))
  }

  /**
   * Automatically categorize transactions
   */
  private categorizeTransaction(transaction: SpanishBankTransaction): 'rental_income' | 'maintenance_expense' | 'utility_expense' | 'other' {
    const text = (transaction.remittanceInfo || transaction.reference || '').toLowerCase()
    
    if (transaction.amount > 0) {
      // Incoming payments
      if (text.includes('alquiler') || text.includes('rent') || text.includes('rental')) {
        return 'rental_income'
      }
    } else {
      // Outgoing payments
      if (text.includes('mant') || text.includes('repair') || text.includes('fontaner') || text.includes('electric')) {
        return 'maintenance_expense'
      }
      if (text.includes('agua') || text.includes('luz') || text.includes('gas') || text.includes('electric') || text.includes('water')) {
        return 'utility_expense'
      }
    }
    
    return 'other'
  }
}

// Singleton instance
let caixaBankInstance: CaixaBankAPI | null = null

export async function getCaixaBankClient(): Promise<CaixaBankAPI> {
  if (!caixaBankInstance) {
    const config = await getCaixaBankConfig()
    const caixaBankConfig: CaixaBankConfig = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      sandboxMode: config.environment === 'sandbox',
      iban: config.iban,
      consentId: undefined, // This will be set during consent flow
    }

    caixaBankInstance = new CaixaBankAPI(caixaBankConfig)
  }

  return caixaBankInstance
}

// Helper class for rental payment processing
export class RentalPaymentProcessor {
  private caixaBank: CaixaBankAPI

  constructor() {
    this.caixaBank = getCaixaBankClient()
  }

  /**
   * Process daily rental payments
   */
  async processDailyPayments(tenantMatchers: RentalPaymentMatcher[]): Promise<{
    matches: Array<{
      transaction: SpanishBankTransaction
      matcher: RentalPaymentMatcher
      confidence: number
      autoReconciled: boolean
    }>
    summary: {
      totalMatches: number
      autoReconciled: number
      needsReview: number
      totalAmount: number
    }
  }> {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const matches = await this.caixaBank.matchRentalPayments(tenantMatchers, yesterday, today)
    
    const summary = {
      totalMatches: matches.length,
      autoReconciled: matches.filter(m => m.autoReconciled).length,
      needsReview: matches.filter(m => !m.autoReconciled).length,
      totalAmount: matches.reduce((sum, m) => sum + m.transaction.amount, 0),
    }

    return { matches, summary }
  }

  /**
   * Sync payments with Zoho Books invoices
   */
  async syncWithZohoBooks(matches: Array<{
    transaction: SpanishBankTransaction
    matcher: RentalPaymentMatcher
    confidence: number
    autoReconciled: boolean
  }>): Promise<void> {
    // This will be implemented after Zoho integration is complete
    for (const match of matches.filter(m => m.autoReconciled)) {
      // Mark corresponding Zoho invoice as paid
      console.log(`Auto-reconciling payment: ${match.transaction.transactionId} for tenant ${match.matcher.tenantId}`)
    }
  }
}