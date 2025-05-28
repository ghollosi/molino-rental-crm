import { checkAndSendPaymentReminders, checkAndSendContractExpiryNotifications } from '../src/lib/scheduled-tasks'

async function testScheduledTasks() {
  console.log('⏰ Testing scheduled tasks...\n')
  
  try {
    // Test 1: Payment reminders
    console.log('1. Testing payment reminder checks...')
    const paymentResult = await checkAndSendPaymentReminders()
    console.log('Payment reminders result:', paymentResult)
    console.log('')

    // Test 2: Contract expiry notifications
    console.log('2. Testing contract expiry checks...')
    const contractResult = await checkAndSendContractExpiryNotifications()
    console.log('Contract expiry result:', contractResult)
    console.log('')

    console.log('✅ Scheduled tasks test completed!')
    console.log('')
    console.log('📝 SUMMARY:')
    console.log('- Payment reminders:', paymentResult ? '✅ Success' : '❌ Failed')
    console.log('- Contract expiry:', contractResult ? '✅ Success' : '❌ Failed')
    console.log('')
    console.log('💡 Note: In development mode, emails are only logged to console.')

  } catch (error) {
    console.error('❌ Scheduled tasks test failed:', error)
  }
}

testScheduledTasks()