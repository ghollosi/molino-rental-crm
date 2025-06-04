/**
 * CaixaBank PSD2 tRPC Router
 * Handles Spanish banking integration and payment monitoring
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { getCaixaBankClient, RentalPaymentProcessor, type RentalPaymentMatcher } from '@/lib/caixabank'
import { TRPCError } from '@trpc/server'

const createConsentSchema = z.object({
  validUntil: z.string().optional(),
})

const getTransactionsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  bookingStatus: z.enum(['booked', 'pending', 'both']).default('booked'),
})

const matchPaymentsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  tenantMatchers: z.array(z.object({
    tenantId: z.string(),
    expectedAmount: z.number().positive(),
    dueDate: z.string(),
    tolerance: z.number().default(0.01),
    autoReconcile: z.boolean().default(false),
    propertyReference: z.string().optional(),
  })),
})

export const caixabankRouter = createTRPCRouter({
  /**
   * Test CaixaBank PSD2 connection
   */
  testConnection: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can test CaixaBank connection'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        await caixaBank.getAccessToken()
        
        return {
          success: true,
          message: 'CaixaBank PSD2 connection successful',
          environment: process.env.CAIXABANK_SANDBOX ? 'sandbox' : 'production',
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error('CaixaBank connection test failed:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to CaixaBank PSD2 API',
        })
      }
    }),

  /**
   * Create account information consent
   */
  createConsent: protectedProcedure
    .input(createConsentSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can create banking consents'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        const consent = await caixaBank.createConsent(input.validUntil)
        
        return {
          consentId: consent.consentId,
          status: consent.consentStatus,
          validUntil: consent.validUntil,
          redirectUrl: consent.links.scaRedirect,
          message: 'Consent created successfully. Customer needs to authorize access.',
        }
      } catch (error) {
        console.error('Failed to create CaixaBank consent:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create banking consent',
        })
      }
    }),

  /**
   * Get consent status
   */
  getConsentStatus: protectedProcedure
    .input(z.object({ consentId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can check consent status'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        const consent = await caixaBank.getConsentStatus(input.consentId)
        
        return {
          consentId: consent.consentId,
          status: consent.consentStatus,
          validUntil: consent.validUntil,
          lastActionDate: consent.lastActionDate,
          isValid: consent.consentStatus === 'valid',
        }
      } catch (error) {
        console.error('Failed to get consent status:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get consent status',
        })
      }
    }),

  /**
   * Get account information
   */
  getAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access account information'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        const accounts = await caixaBank.getAccounts()
        
        return accounts.accounts.map(account => ({
          iban: account.iban,
          currency: account.currency,
          accountType: account.accountType,
          name: account.name,
          balances: account.balances.map(balance => ({
            amount: parseFloat(balance.balanceAmount.amount),
            currency: balance.balanceAmount.currency,
            type: balance.balanceType,
            indicator: balance.creditDebitIndicator,
            dateTime: balance.dateTime,
          })),
        }))
      } catch (error) {
        console.error('Failed to get accounts:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get account information',
        })
      }
    }),

  /**
   * Get account balances
   */
  getBalances: protectedProcedure
    .input(z.object({ accountId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access balance information'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        const balances = await caixaBank.getAccountBalances(input.accountId)
        
        return balances.balances.map(balance => ({
          amount: parseFloat(balance.balanceAmount.amount),
          currency: balance.balanceAmount.currency,
          type: balance.balanceType,
          indicator: balance.creditDebitIndicator,
          dateTime: balance.dateTime,
        }))
      } catch (error) {
        console.error('Failed to get balances:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get account balances',
        })
      }
    }),

  /**
   * Get transactions
   */
  getTransactions: protectedProcedure
    .input(getTransactionsSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access transaction data'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        const transactions = await caixaBank.getTransactions(
          undefined, // Use default IBAN
          input.dateFrom,
          input.dateTo,
          input.bookingStatus
        )
        
        return {
          booked: transactions.transactions.booked.map(transaction => ({
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
            valueDate: transaction.valueDate,
            bookingDate: transaction.bookingDate,
            reference: transaction.reference,
            creditorName: transaction.creditorName,
            debtorName: transaction.debtorName,
            remittanceInfo: transaction.remittanceInfo,
            balanceAfterTransaction: transaction.balanceAfterTransaction,
          })),
          pending: transactions.transactions.pending?.map(transaction => ({
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
            valueDate: transaction.valueDate,
            bookingDate: transaction.bookingDate,
            reference: transaction.reference,
            creditorName: transaction.creditorName,
            debtorName: transaction.debtorName,
            remittanceInfo: transaction.remittanceInfo,
          })) || [],
        }
      } catch (error) {
        console.error('Failed to get transactions:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get transaction data',
        })
      }
    }),

  /**
   * Match rental payments automatically
   */
  matchRentalPayments: protectedProcedure
    .input(matchPaymentsSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can match rental payments'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        const matches = await caixaBank.matchRentalPayments(
          input.tenantMatchers,
          input.dateFrom,
          input.dateTo
        )
        
        return {
          matches: matches.map(match => ({
            transaction: {
              transactionId: match.transaction.transactionId,
              amount: match.transaction.amount,
              currency: match.transaction.currency,
              valueDate: match.transaction.valueDate,
              reference: match.transaction.reference,
              debtorName: match.transaction.debtorName,
              remittanceInfo: match.transaction.remittanceInfo,
            },
            matcher: {
              tenantId: match.matcher.tenantId,
              expectedAmount: match.matcher.expectedAmount,
              dueDate: match.matcher.dueDate,
              propertyReference: match.matcher.propertyReference,
            },
            confidence: match.confidence,
            autoReconciled: match.autoReconciled,
          })),
          summary: {
            totalMatches: matches.length,
            autoReconciled: matches.filter(m => m.autoReconciled).length,
            needsReview: matches.filter(m => !m.autoReconciled).length,
            totalAmount: matches.reduce((sum, m) => sum + m.transaction.amount, 0),
          },
        }
      } catch (error) {
        console.error('Failed to match rental payments:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to match rental payments',
        })
      }
    }),

  /**
   * Process daily payments (automated reconciliation)
   */
  processDailyPayments: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can process daily payments'
        })
      }

      try {
        // Get all active rental contracts with due dates
        const activeContracts = await ctx.db.contract.findMany({
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          include: {
            tenant: {
              include: { user: true }
            },
            property: true,
          },
        })

        // Create payment matchers from contracts
        const tenantMatchers: RentalPaymentMatcher[] = activeContracts.map(contract => {
          const dueDate = new Date()
          dueDate.setDate(contract.paymentDay)
          
          return {
            tenantId: contract.tenant.id,
            expectedAmount: Number(contract.rentAmount),
            dueDate: dueDate.toISOString().split('T')[0],
            tolerance: 0.01, // 1 cent tolerance
            autoReconcile: true,
            propertyReference: contract.property.reference || contract.propertyId,
          }
        })

        const processor = new RentalPaymentProcessor()
        const result = await processor.processDailyPayments(tenantMatchers)

        // Update database with matched payments
        for (const match of result.matches.filter(m => m.autoReconciled)) {
          // Find corresponding invoice and mark as paid
          const invoice = await ctx.db.invoice.findFirst({
            where: {
              tenantId: match.matcher.tenantId,
              amount: match.matcher.expectedAmount,
              status: 'PENDING',
              dueDate: {
                gte: new Date(match.matcher.dueDate),
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Within 7 days
              },
            },
          })

          if (invoice) {
            await ctx.db.invoice.update({
              where: { id: invoice.id },
              data: {
                status: 'PAID',
                paidAt: new Date(match.transaction.valueDate),
                paymentMethod: 'bank_transfer',
                paymentReference: match.transaction.transactionId,
              },
            })
          }
        }

        return {
          processedDate: new Date().toISOString().split('T')[0],
          contractsProcessed: activeContracts.length,
          ...result.summary,
        }
      } catch (error) {
        console.error('Failed to process daily payments:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process daily payments',
        })
      }
    }),

  /**
   * Export transactions for accounting
   */
  exportTransactionsForAccounting: protectedProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can export transaction data'
        })
      }

      try {
        const caixaBank = getCaixaBankClient()
        const accountingData = await caixaBank.exportTransactionsForAccounting(
          input.dateFrom,
          input.dateTo
        )
        
        return {
          transactions: accountingData,
          summary: {
            totalTransactions: accountingData.length,
            totalIncome: accountingData
              .filter(t => t.amount > 0)
              .reduce((sum, t) => sum + t.amount, 0),
            totalExpenses: accountingData
              .filter(t => t.amount < 0)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0),
            dateRange: `${input.dateFrom} to ${input.dateTo}`,
            exportedAt: new Date().toISOString(),
          },
        }
      } catch (error) {
        console.error('Failed to export transactions:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export transaction data for accounting',
        })
      }
    }),
})