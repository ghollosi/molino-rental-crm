/**
 * Automated Payment Reconciliation Cron Job
 * Matches CaixaBank transactions with Zoho invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCaixaBankClient, RentalPaymentProcessor } from '@/lib/caixabank'
import { getZohoBooksClient } from '@/lib/zoho-books'
import { getWhatsAppClient } from '@/lib/whatsapp'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting automated payment reconciliation...')

    // Get active contracts for payment matching
    const activeContracts = await prisma.contract.findMany({
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

    if (activeContracts.length === 0) {
      return NextResponse.json({
        message: 'No active contracts found',
        processed: 0,
      })
    }

    // Create payment matchers from contracts
    const today = new Date()
    const tenantMatchers = activeContracts.map(contract => {
      // Calculate next due date
      const dueDate = new Date(today.getFullYear(), today.getMonth(), contract.paymentDay)
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }
      
      return {
        tenantId: contract.tenant.id,
        expectedAmount: Number(contract.rentAmount),
        dueDate: dueDate.toISOString().split('T')[0],
        tolerance: 1.00, // 1 EUR tolerance
        autoReconcile: true,
        propertyReference: contract.property.reference || contract.propertyId,
      }
    })

    console.log(`💰 Processing ${tenantMatchers.length} rental payment matchers...`)

    // Process payments using CaixaBank integration
    const processor = new RentalPaymentProcessor()
    const result = await processor.processDailyPayments(tenantMatchers)

    // Initialize integrations
    const zoho = getZohoBooksClient()
    const whatsapp = getWhatsAppClient()

    let reconciliationResults = {
      totalMatches: result.matches.length,
      autoReconciled: 0,
      invoicesUpdated: 0,
      notificationsSent: 0,
      errors: [],
    }

    // Process each payment match
    for (const match of result.matches) {
      try {
        if (match.autoReconciled && match.confidence > 0.9) {
          // Find corresponding unpaid invoice
          const invoice = await prisma.invoice.findFirst({
            where: {
              tenantId: match.matcher.tenantId,
              status: 'PENDING',
              amount: {
                gte: match.matcher.expectedAmount - match.matcher.tolerance,
                lte: match.matcher.expectedAmount + match.matcher.tolerance,
              },
              dueDate: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Up to 7 days ago
                lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Up to 7 days in future
              },
            },
            include: {
              tenant: {
                include: { user: true }
              }
            }
          })

          if (invoice) {
            // Update invoice status in database
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: 'PAID',
                paidAt: new Date(match.transaction.valueDate),
                paymentMethod: 'bank_transfer',
                paymentReference: match.transaction.transactionId,
              },
            })

            reconciliationResults.invoicesUpdated++

            // Mark invoice as paid in Zoho Books
            if (invoice.externalInvoiceId) {
              try {
                await zoho.markInvoiceAsPaid(invoice.externalInvoiceId, {
                  amount: match.transaction.amount,
                  date: match.transaction.valueDate,
                  paymentMode: 'bank_transfer',
                  reference: match.transaction.transactionId,
                })
              } catch (zohoError) {
                console.warn('Failed to update Zoho invoice:', zohoError)
              }
            }

            // Send WhatsApp payment confirmation
            if (invoice.tenant.user.phone) {
              try {
                await whatsapp.sendPaymentConfirmed({
                  phoneNumber: invoice.tenant.user.phone,
                  tenantName: `${invoice.tenant.user.firstName} ${invoice.tenant.user.lastName}`,
                  amount: match.transaction.amount,
                  currency: 'EUR',
                  paymentDate: new Date(match.transaction.valueDate).toLocaleDateString('es-ES'),
                  invoiceNumber: invoice.externalInvoiceNumber || invoice.id,
                })

                reconciliationResults.notificationsSent++
              } catch (whatsappError) {
                console.warn('Failed to send WhatsApp notification:', whatsappError)
              }
            }

            reconciliationResults.autoReconciled++

            console.log(`✅ Auto-reconciled payment: ${match.transaction.transactionId} for tenant ${match.matcher.tenantId}`)
          }
        } else {
          // Log matches that need manual review
          console.log(`⚠️  Payment needs review: ${match.transaction.transactionId} (confidence: ${match.confidence})`)
        }
      } catch (error) {
        console.error(`❌ Error processing match for tenant ${match.matcher.tenantId}:`, error)
        reconciliationResults.errors.push({
          tenantId: match.matcher.tenantId,
          transactionId: match.transaction.transactionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Create reconciliation log entry
    await prisma.reconciliationLog.create({
      data: {
        processedAt: new Date(),
        contractsChecked: activeContracts.length,
        transactionsMatched: result.matches.length,
        autoReconciled: reconciliationResults.autoReconciled,
        invoicesUpdated: reconciliationResults.invoicesUpdated,
        notificationsSent: reconciliationResults.notificationsSent,
        errors: reconciliationResults.errors.length,
        summary: JSON.stringify(reconciliationResults),
      }
    }).catch(() => {
      // Ignore if table doesn't exist yet
    })

    const response = {
      success: true,
      processedAt: new Date().toISOString(),
      summary: {
        contractsChecked: activeContracts.length,
        ...reconciliationResults,
        totalAmount: result.matches.reduce((sum, m) => sum + m.transaction.amount, 0),
      },
      message: `Processed ${reconciliationResults.autoReconciled} payments, updated ${reconciliationResults.invoicesUpdated} invoices`,
    }

    console.log('✅ Payment reconciliation completed:', response.summary)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Payment reconciliation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processedAt: new Date().toISOString(),
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  // Health check and status endpoint
  return NextResponse.json({
    service: 'Payment Reconciliation Cron',
    description: 'Automated matching of CaixaBank transactions with Zoho invoices',
    lastRun: 'Check logs for last execution',
    schedule: 'Daily at configured intervals',
    endpoints: {
      trigger: 'POST /api/cron/payment-reconciliation',
      status: 'GET /api/cron/payment-reconciliation',
    },
    requirements: {
      authorization: 'Bearer token with CRON_SECRET',
      integrations: ['CaixaBank PSD2', 'Zoho Books', 'WhatsApp Business'],
    },
    version: '1.0.0',
  })
}