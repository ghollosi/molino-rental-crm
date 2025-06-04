/**
 * Zoho Books tRPC Router
 * Handles Spanish invoicing and VAT compliance
 */

import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/trpc'
import { getZohoBooksClient, RentalInvoiceHelper } from '@/lib/zoho-books'
import { TRPCError } from '@trpc/server'

const createInvoiceSchema = z.object({
  tenantId: z.string(),
  propertyId: z.string(),
  amount: z.number().positive(),
  dueDate: z.string(),
  description: z.string().optional(),
  invoiceType: z.enum(['rental', 'maintenance', 'deposit', 'other']),
})

const searchInvoicesSchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'void']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  customerId: z.string().optional(),
})

const markPaidSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  reference: z.string().optional(),
})

export const zohoRouter = createTRPCRouter({
  /**
   * Test Zoho Books connection
   */
  testConnection: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can test Zoho connection'
        })
      }

      try {
        const zoho = getZohoBooksClient()
        await zoho.getAccessToken()
        
        return {
          success: true,
          message: 'Zoho Books connection successful',
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Zoho connection test failed:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to connect to Zoho Books',
        })
      }
    }),

  /**
   * Create Spanish compliant invoice
   */
  createInvoice: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get tenant and property information
        const tenant = await ctx.db.tenant.findUnique({
          where: { id: input.tenantId },
          include: { user: true }
        })

        const property = await ctx.db.property.findUnique({
          where: { id: input.propertyId }
        })

        if (!tenant || !property) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tenant or property not found'
          })
        }

        const helper = new RentalInvoiceHelper()
        
        let zohoInvoice

        if (input.invoiceType === 'rental') {
          // Create monthly rental invoice
          const currentDate = new Date()
          zohoInvoice = await helper.createMonthlyRentalInvoice({
            tenantEmail: tenant.user.email,
            tenantName: `${tenant.user.firstName} ${tenant.user.lastName}`,
            propertyAddress: property.address,
            monthlyRent: input.amount,
            month: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
            year: currentDate.getFullYear(),
            dueDate: input.dueDate,
            propertyReference: property.reference || property.id,
          })
        } else {
          // Create generic invoice for other types
          const zoho = getZohoBooksClient()
          zohoInvoice = await zoho.createSpanishInvoice({
            customerId: tenant.user.email,
            date: new Date().toISOString().split('T')[0],
            dueDate: input.dueDate,
            currency: 'EUR',
            language: 'es',
            referenceNumber: property.reference || property.id,
            notes: input.description || `${input.invoiceType} - ${property.address}`,
            lineItems: [{
              name: input.invoiceType.charAt(0).toUpperCase() + input.invoiceType.slice(1),
              description: input.description || `${input.invoiceType} service for ${property.address}`,
              rate: input.amount,
              quantity: 1,
              taxPercentage: 21, // Standard Spanish VAT
            }],
            taxes: [{
              vatName: 'IVA General',
              vatPercentage: 21,
              vatType: 'output',
            }],
          })
        }

        // Store invoice reference in database
        const invoice = await ctx.db.invoice.create({
          data: {
            tenantId: input.tenantId,
            propertyId: input.propertyId,
            amount: input.amount,
            dueDate: new Date(input.dueDate),
            status: 'PENDING',
            description: input.description || `${input.invoiceType} invoice`,
            invoiceType: input.invoiceType.toUpperCase() as any,
            externalInvoiceId: zohoInvoice.invoice_id,
            externalInvoiceNumber: zohoInvoice.invoice_number,
            externalInvoiceUrl: zohoInvoice.invoice_url,
            externalPdfUrl: zohoInvoice.invoice_pdf_url,
          }
        })

        return {
          id: invoice.id,
          externalId: zohoInvoice.invoice_id,
          invoiceNumber: zohoInvoice.invoice_number,
          status: zohoInvoice.status,
          total: zohoInvoice.total,
          pdfUrl: zohoInvoice.invoice_pdf_url,
          invoiceUrl: zohoInvoice.invoice_url,
        }
      } catch (error) {
        console.error('Failed to create Zoho invoice:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invoice in Zoho Books',
        })
      }
    }),

  /**
   * Get invoices with filters
   */
  getInvoices: protectedProcedure
    .input(searchInvoicesSchema)
    .query(async ({ ctx, input }) => {
      try {
        const zoho = getZohoBooksClient()
        const zohoInvoices = await zoho.getInvoices(input)

        // Get corresponding database records
        const dbInvoices = await ctx.db.invoice.findMany({
          where: {
            externalInvoiceId: {
              in: zohoInvoices.map(inv => inv.invoice_id)
            }
          },
          include: {
            tenant: {
              include: { user: true }
            },
            property: true,
          }
        })

        // Merge Zoho and database data
        return zohoInvoices.map(zohoInv => {
          const dbInv = dbInvoices.find(db => db.externalInvoiceId === zohoInv.invoice_id)
          
          return {
            id: dbInv?.id || zohoInv.invoice_id,
            invoiceNumber: zohoInv.invoice_number,
            status: zohoInv.status,
            total: zohoInv.total,
            balance: zohoInv.balance,
            createdTime: zohoInv.created_time,
            pdfUrl: zohoInv.invoice_pdf_url,
            invoiceUrl: zohoInv.invoice_url,
            tenant: dbInv?.tenant ? {
              name: `${dbInv.tenant.user.firstName} ${dbInv.tenant.user.lastName}`,
              email: dbInv.tenant.user.email,
            } : null,
            property: dbInv?.property ? {
              address: dbInv.property.address,
              reference: dbInv.property.reference,
            } : null,
          }
        })
      } catch (error) {
        console.error('Failed to fetch Zoho invoices:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch invoices from Zoho Books',
        })
      }
    }),

  /**
   * Mark invoice as paid
   */
  markAsPaid: protectedProcedure
    .input(markPaidSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const zoho = getZohoBooksClient()
        
        await zoho.markInvoiceAsPaid(input.invoiceId, {
          amount: input.amount,
          date: input.paymentDate,
          paymentMode: input.paymentMethod,
          reference: input.reference,
        })

        // Update database record
        await ctx.db.invoice.updateMany({
          where: { externalInvoiceId: input.invoiceId },
          data: { 
            status: 'PAID',
            paidAt: new Date(input.paymentDate),
          }
        })

        return { success: true }
      } catch (error) {
        console.error('Failed to mark invoice as paid:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark invoice as paid',
        })
      }
    }),

  /**
   * Export AEAT compliant data
   */
  exportAEATData: protectedProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({ 
          code: 'FORBIDDEN',
          message: 'Only admins can export AEAT data'
        })
      }

      try {
        const zoho = getZohoBooksClient()
        const aeatData = await zoho.exportAEATData(input.dateFrom, input.dateTo)
        
        return {
          data: aeatData,
          totalInvoices: aeatData.length,
          dateRange: `${input.dateFrom} to ${input.dateTo}`,
          exportedAt: new Date().toISOString(),
        }
      } catch (error) {
        console.error('Failed to export AEAT data:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export AEAT data',
        })
      }
    }),

  /**
   * Sync tenant as Zoho customer
   */
  syncTenantAsCustomer: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const tenant = await ctx.db.tenant.findUnique({
          where: { id: input.tenantId },
          include: { user: true }
        })

        if (!tenant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tenant not found'
          })
        }

        const zoho = getZohoBooksClient()
        const customer = await zoho.createCustomer({
          contact_name: `${tenant.user.firstName} ${tenant.user.lastName}`,
          contact_type: 'customer',
          email: tenant.user.email,
          phone: tenant.user.phone || undefined,
          vat_treatment: 'vat_registered',
          tax_id: tenant.taxId || undefined,
        })

        return {
          success: true,
          customerId: customer.contact_id,
          customerName: customer.contact_name,
        }
      } catch (error) {
        console.error('Failed to sync tenant as customer:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync tenant with Zoho Books',
        })
      }
    }),
})