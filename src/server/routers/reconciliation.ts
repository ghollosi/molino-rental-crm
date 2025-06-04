/**
 * Payment Reconciliation tRPC Router
 * Monitoring and management of automated payment matching
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { TRPCError } from '@trpc/server'

export const reconciliationRouter = createTRPCRouter({
  /**
   * Get reconciliation logs with pagination
   */
  getLogs: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access reconciliation logs'
        })
      }

      const where: any = {}
      
      if (input.dateFrom || input.dateTo) {
        where.processedAt = {}
        if (input.dateFrom) where.processedAt.gte = new Date(input.dateFrom)
        if (input.dateTo) where.processedAt.lte = new Date(input.dateTo)
      }

      const [logs, total] = await Promise.all([
        ctx.db.reconciliationLog.findMany({
          where,
          orderBy: { processedAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.reconciliationLog.count({ where }),
      ])

      return {
        logs: logs.map(log => ({
          id: log.id,
          processedAt: log.processedAt,
          contractsChecked: log.contractsChecked,
          transactionsMatched: log.transactionsMatched,
          autoReconciled: log.autoReconciled,
          invoicesUpdated: log.invoicesUpdated,
          notificationsSent: log.notificationsSent,
          errors: log.errors,
          executionTime: log.executionTime,
          triggerType: log.triggerType,
          summary: log.summary,
        })),
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          pages: Math.ceil(total / input.limit),
        },
      }
    }),

  /**
   * Get reconciliation statistics
   */
  getStats: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access reconciliation statistics'
        })
      }

      const where: any = {}
      
      if (input.dateFrom || input.dateTo) {
        where.processedAt = {}
        if (input.dateFrom) where.processedAt.gte = new Date(input.dateFrom)
        if (input.dateTo) where.processedAt.lte = new Date(input.dateTo)
      }

      const logs = await ctx.db.reconciliationLog.findMany({
        where,
        select: {
          contractsChecked: true,
          transactionsMatched: true,
          autoReconciled: true,
          invoicesUpdated: true,
          notificationsSent: true,
          errors: true,
          processedAt: true,
          summary: true,
        },
      })

      const totals = logs.reduce(
        (acc, log) => ({
          contractsChecked: acc.contractsChecked + log.contractsChecked,
          transactionsMatched: acc.transactionsMatched + log.transactionsMatched,
          autoReconciled: acc.autoReconciled + log.autoReconciled,
          invoicesUpdated: acc.invoicesUpdated + log.invoicesUpdated,
          notificationsSent: acc.notificationsSent + log.notificationsSent,
          errors: acc.errors + log.errors,
          totalRuns: acc.totalRuns + 1,
        }),
        {
          contractsChecked: 0,
          transactionsMatched: 0,
          autoReconciled: 0,
          invoicesUpdated: 0,
          notificationsSent: 0,
          errors: 0,
          totalRuns: 0,
        }
      )

      // Calculate success rates
      const successRate = totals.transactionsMatched > 0 
        ? (totals.autoReconciled / totals.transactionsMatched) * 100 
        : 0

      const errorRate = totals.totalRuns > 0 
        ? (logs.filter(log => log.errors > 0).length / totals.totalRuns) * 100 
        : 0

      // Get recent trends (last 7 days)
      const recentLogs = logs.filter(log => 
        log.processedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )

      return {
        totals,
        rates: {
          successRate: Math.round(successRate * 100) / 100,
          errorRate: Math.round(errorRate * 100) / 100,
          averageReconciliationsPerRun: totals.totalRuns > 0 
            ? Math.round((totals.autoReconciled / totals.totalRuns) * 100) / 100 
            : 0,
        },
        trends: {
          last7Days: recentLogs.length,
          recentReconciliations: recentLogs.reduce((sum, log) => sum + log.autoReconciled, 0),
          recentErrors: recentLogs.reduce((sum, log) => sum + log.errors, 0),
        },
        lastRun: logs.length > 0 ? logs[0].processedAt : null,
      }
    }),

  /**
   * Trigger manual reconciliation
   */
  triggerManualReconciliation: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can trigger manual reconciliation'
        })
      }

      try {
        // Call the cron endpoint manually
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/payment-reconciliation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        return {
          success: true,
          message: 'Manual reconciliation triggered successfully',
          result,
        }
      } catch (error) {
        console.error('Failed to trigger manual reconciliation:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger manual reconciliation',
        })
      }
    }),

  /**
   * Get detailed reconciliation log
   */
  getLogDetails: protectedProcedure
    .input(z.object({ logId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access reconciliation log details'
        })
      }

      const log = await ctx.db.reconciliationLog.findUnique({
        where: { id: input.logId },
      })

      if (!log) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reconciliation log not found'
        })
      }

      return {
        id: log.id,
        processedAt: log.processedAt,
        contractsChecked: log.contractsChecked,
        transactionsMatched: log.transactionsMatched,
        autoReconciled: log.autoReconciled,
        invoicesUpdated: log.invoicesUpdated,
        notificationsSent: log.notificationsSent,
        errors: log.errors,
        executionTime: log.executionTime,
        triggerType: log.triggerType,
        summary: log.summary,
        createdAt: log.createdAt,
      }
    }),

  /**
   * Get unreconciled invoices
   */
  getUnreconciledInvoices: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can access unreconciled invoices'
        })
      }

      const where = {
        status: 'PENDING' as const,
        dueDate: {
          lte: new Date(), // Overdue invoices
        },
      }

      const [invoices, total] = await Promise.all([
        ctx.db.invoice.findMany({
          where,
          include: {
            tenant: {
              include: { user: true }
            },
            property: true,
          },
          orderBy: { dueDate: 'asc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.invoice.count({ where }),
      ])

      return {
        invoices: invoices.map(invoice => ({
          id: invoice.id,
          amount: Number(invoice.amount),
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          description: invoice.description,
          daysPastDue: Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
          tenant: {
            name: `${invoice.tenant.user.firstName} ${invoice.tenant.user.lastName}`,
            email: invoice.tenant.user.email,
            phone: invoice.tenant.user.phone,
          },
          property: {
            address: invoice.property.address,
            reference: invoice.property.reference,
          },
          externalInvoiceNumber: invoice.externalInvoiceNumber,
          externalInvoiceUrl: invoice.externalInvoiceUrl,
        })),
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          pages: Math.ceil(total / input.limit),
        },
      }
    }),
})