/**
 * @file Scheduled tasks for automated notifications
 * @description Automated email notifications for payments and contract expiry
 * @created 2025-05-28
 */

import { prisma } from '@/lib/prisma'
import { sendPaymentReminder, sendContractExpiryNotification } from '@/lib/email'
import { addDays, differenceInDays, startOfDay, endOfDay } from 'date-fns'

/**
 * Check and send payment reminders
 */
export async function checkAndSendPaymentReminders() {
  console.log('🔍 Checking for payment reminders...')
  
  try {
    const today = new Date()
    const currentDay = today.getDate()
    
    // Find all active contracts
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        tenant: { isNot: null }
      },
      include: {
        property: {
          include: {
            owner: {
              include: {
                user: true
              }
            }
          }
        },
        tenant: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log(`Found ${activeContracts.length} active contracts`)
    
    let remindersSent = 0
    
    for (const contract of activeContracts) {
      // Check if payment day has passed this month
      const paymentDay = contract.paymentDay || 1
      const dueDate = new Date(today.getFullYear(), today.getMonth(), paymentDay)
      
      // If payment day is in the future this month, check last month
      if (dueDate > today) {
        dueDate.setMonth(dueDate.getMonth() - 1)
      }
      
      const daysOverdue = differenceInDays(today, dueDate)
      
      // Send reminders for: 
      // - 3 days before due
      // - On due date
      // - 3 days overdue
      // - 7 days overdue
      // - 14 days overdue
      const shouldSendReminder = 
        daysOverdue === -3 || // 3 days before
        daysOverdue === 0 ||  // Due date
        daysOverdue === 3 ||  // 3 days overdue
        daysOverdue === 7 ||  // 7 days overdue
        daysOverdue === 14    // 14 days overdue
      
      if (shouldSendReminder && contract.tenant?.user?.email) {
        console.log(`Sending payment reminder to ${contract.tenant.user.name} for ${contract.property.street}`)
        
        await sendPaymentReminder(
          contract.tenant.user.email,
          {
            tenantName: contract.tenant.user.name || 'Bérlő',
            propertyAddress: `${contract.property.street}, ${contract.property.city}`,
            rentAmount: Number(contract.rentAmount),
            currency: contract.property.currency || 'HUF',
            dueDate: dueDate.toLocaleDateString('hu-HU'),
            daysOverdue: Math.max(0, daysOverdue),
            landlordName: contract.property.owner?.user?.name || 'Bérbeadó'
          }
        )
        
        remindersSent++
        
        // Also notify the owner if payment is overdue
        if (daysOverdue > 0 && contract.property.owner?.user?.email) {
          await sendPaymentReminder(
            contract.property.owner.user.email,
            {
              tenantName: contract.tenant.user.name || 'Bérlő',
              propertyAddress: `${contract.property.street}, ${contract.property.city}`,
              rentAmount: Number(contract.rentAmount),
              currency: contract.property.currency || 'HUF',
              dueDate: dueDate.toLocaleDateString('hu-HU'),
              daysOverdue: daysOverdue,
              landlordName: contract.property.owner.user.name || 'Bérbeadó'
            }
          )
        }
      }
    }
    
    console.log(`✅ Sent ${remindersSent} payment reminders`)
    return { success: true, remindersSent }
    
  } catch (error) {
    console.error('Error sending payment reminders:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check and send contract expiry notifications
 */
export async function checkAndSendContractExpiryNotifications() {
  console.log('🔍 Checking for expiring contracts...')
  
  try {
    const today = startOfDay(new Date())
    
    // Find contracts expiring in the next 60 days
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: addDays(today, 60)
        },
        tenant: { isNot: null }
      },
      include: {
        property: {
          include: {
            owner: {
              include: {
                user: true
              }
            }
          }
        },
        tenant: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log(`Found ${expiringContracts.length} expiring contracts`)
    
    let notificationsSent = 0
    
    for (const contract of expiringContracts) {
      const daysUntilExpiry = differenceInDays(contract.endDate, today)
      
      // Send notifications at: 60, 30, 14, 7, 3, 1 days before expiry
      const shouldSendNotification = [60, 30, 14, 7, 3, 1].includes(daysUntilExpiry)
      
      if (shouldSendNotification && contract.tenant?.user?.email) {
        console.log(`Sending expiry notification to ${contract.tenant.user.name} for ${contract.property.street} (${daysUntilExpiry} days)`)
        
        // Notify tenant
        await sendContractExpiryNotification(
          contract.tenant.user.email,
          {
            contractId: contract.id,
            tenantName: contract.tenant.user.name || 'Bérlő',
            propertyAddress: `${contract.property.street}, ${contract.property.city}`,
            endDate: contract.endDate.toLocaleDateString('hu-HU'),
            daysUntilExpiry,
            rentAmount: Number(contract.rentAmount),
            currency: contract.property.currency || 'HUF'
          }
        )
        
        // Also notify owner
        if (contract.property.owner?.user?.email) {
          await sendContractExpiryNotification(
            contract.property.owner.user.email,
            {
              contractId: contract.id,
              tenantName: contract.tenant.user.name || 'Bérlő',
              propertyAddress: `${contract.property.street}, ${contract.property.city}`,
              endDate: contract.endDate.toLocaleDateString('hu-HU'),
              daysUntilExpiry,
              rentAmount: Number(contract.rentAmount),
              currency: contract.property.currency || 'HUF'
            }
          )
        }
        
        notificationsSent++
      }
    }
    
    console.log(`✅ Sent ${notificationsSent} contract expiry notifications`)
    return { success: true, notificationsSent }
    
  } catch (error) {
    console.error('Error sending contract expiry notifications:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Run all scheduled tasks
 */
export async function runScheduledTasks() {
  console.log('🚀 Running scheduled tasks...')
  
  const results = await Promise.all([
    checkAndSendPaymentReminders(),
    checkAndSendContractExpiryNotifications()
  ])
  
  console.log('✅ Scheduled tasks completed')
  return results
}