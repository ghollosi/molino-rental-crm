import { checkAndSendPaymentReminders, checkAndSendContractExpiryNotifications } from '../src/lib/scheduled-tasks'

async function testCronLogic() {
  console.log('⏰ Testing cron logic without API...\n')
  
  try {
    console.log('🔄 Starting scheduled notification tasks...')
    console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`)

    // Run payment reminders
    console.log('1️⃣ Checking payment reminders...')
    const paymentResults = await checkAndSendPaymentReminders()
    console.log('Payment results:', paymentResults)
    console.log('')

    // Run contract expiry notifications  
    console.log('2️⃣ Checking contract expiry notifications...')
    const contractResults = await checkAndSendContractExpiryNotifications()
    console.log('Contract results:', contractResults)
    console.log('')

    // Summary
    const totalSent = (paymentResults?.remindersSent || 0) + (contractResults?.notificationsSent || 0)
    
    console.log('✅ CRON JOB SUMMARY:')
    console.log(`- Payment reminders sent: ${paymentResults?.remindersSent || 0}`)
    console.log(`- Contract notifications sent: ${contractResults?.notificationsSent || 0}`)
    console.log(`- Total emails sent: ${totalSent}`)
    console.log(`- Success: ${paymentResults?.success && contractResults?.success}`)
    console.log('')
    
    if (totalSent > 0) {
      console.log('📧 In production, these emails would be sent via Resend API')
    } else {
      console.log('📝 No notifications needed at this time')
    }

  } catch (error) {
    console.error('❌ Cron logic test failed:', error)
  }
}

testCronLogic()