import { sendEmail, sendPaymentReminder, sendContractExpiryNotification } from '../src/lib/email'

async function testEmailSystem() {
  console.log('📧 Testing email system...\n')
  
  try {
    // Test 1: Basic email sending
    console.log('1. Testing basic email sending...')
    const basicEmailResult = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Hello World!</h1><p>This is a test email from Molino Rental CRM.</p>'
    })
    
    console.log('Basic email result:', basicEmailResult)
    console.log('')

    // Test 2: Payment reminder email
    console.log('2. Testing payment reminder email...')
    const paymentReminderResult = await sendPaymentReminder(
      'szabo.peter@example.com',
      {
        tenantName: 'Szabó Péter',
        propertyAddress: 'Andrássy út 60., Budapest',
        rentAmount: 180000,
        currency: 'HUF',
        dueDate: '2025-05-05',
        daysOverdue: 23,
        landlordName: 'Molino Rental'
      }
    )
    
    console.log('Payment reminder result:', paymentReminderResult)
    console.log('')

    // Test 3: Contract expiry notification
    console.log('3. Testing contract expiry notification...')
    const contractExpiryResult = await sendContractExpiryNotification(
      'toth.anna@example.com',
      {
        contractId: 'contract123',
        tenantName: 'Tóth Anna',
        propertyAddress: 'Bem rakpart 20., Budapest',
        endDate: '2025-05-31',
        daysUntilExpiry: 3,
        rentAmount: 350000,
        currency: 'HUF'
      }
    )
    
    console.log('Contract expiry result:', contractExpiryResult)
    console.log('')

    // Test 4: Multiple recipients
    console.log('4. Testing multiple recipients...')
    const multipleRecipientsResult = await sendEmail({
      to: ['tenant1@example.com', 'tenant2@example.com', 'admin@molino-rental.com'],
      subject: 'Important Notice - Multiple Recipients Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Important Notice</h2>
          <p>This is a test email sent to multiple recipients.</p>
          <p>Best regards,<br>Molino Rental Team</p>
        </div>
      `
    })
    
    console.log('Multiple recipients result:', multipleRecipientsResult)
    console.log('')

    console.log('✅ Email system test completed!')
    console.log('')
    console.log('📝 SUMMARY:')
    console.log('- Basic email:', basicEmailResult.success ? '✅ Success' : '❌ Failed')
    console.log('- Payment reminder:', paymentReminderResult.success ? '✅ Success' : '❌ Failed')
    console.log('- Contract expiry:', contractExpiryResult.success ? '✅ Success' : '❌ Failed')
    console.log('- Multiple recipients:', multipleRecipientsResult.success ? '✅ Success' : '❌ Failed')
    console.log('')
    console.log('💡 Note: In development mode (no real RESEND_API_KEY), emails are only logged to console.')
    console.log('💡 To test real email sending, set a valid RESEND_API_KEY in .env.local')

  } catch (error) {
    console.error('❌ Email system test failed:', error)
  }
}

testEmailSystem()