import { db } from '../src/lib/db'

async function testOutstandingPayments() {
  console.log('💰 Testing outstanding payments endpoint logic...\n')
  
  try {
    const now = new Date()
    const currentDay = now.getDate()
    
    console.log(`Current date: ${now.toLocaleDateString('hu-HU')}`)
    console.log(`Current day of month: ${currentDay}\n`)
    
    // Get contracts (same logic as endpoint)
    const contracts = await db.contract.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'DRAFT' }
        ],
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        property: {
          select: {
            street: true,
            city: true
          }
        }
      }
    })

    console.log(`Found ${contracts.length} valid contracts:`)
    
    contracts.forEach(contract => {
      console.log(`- ${contract.tenant?.user?.name}: Payment day ${contract.paymentDay}, Status: ${contract.status}`)
    })
    
    console.log('')

    // Calculate outstanding payments
    const outstandingPayments = contracts
      .filter(contract => {
        const isOverdue = contract.paymentDay < currentDay
        console.log(`${contract.tenant?.user?.name}: payment day ${contract.paymentDay} < current day ${currentDay} = ${isOverdue}`)
        return isOverdue
      })
      .map(contract => {
        const dueDate = new Date(now.getFullYear(), now.getMonth(), contract.paymentDay)
        const daysOverdue = Math.max(0, currentDay - contract.paymentDay)
        
        return {
          id: contract.id,
          tenantName: contract.tenant?.user?.name || 'Ismeretlen bérlő',
          tenantEmail: contract.tenant?.user?.email || '',
          tenantPhone: contract.tenant?.user?.phone || null,
          propertyAddress: `${contract.property.street}, ${contract.property.city}`,
          amount: Number(contract.rentAmount || 0),
          dueDate: dueDate,
          daysOverdue: daysOverdue,
          contractId: contract.id
        }
      })

    console.log(`\nOutstanding payments found: ${outstandingPayments.length}`)
    
    outstandingPayments.forEach(payment => {
      console.log(`- ${payment.tenantName}: ${payment.amount.toLocaleString('hu-HU')} Ft, ${payment.daysOverdue} days overdue`)
      console.log(`  Property: ${payment.propertyAddress}`)
      console.log(`  Contact: ${payment.tenantEmail}`)
      console.log('')
    })

    const totalOutstanding = outstandingPayments.reduce((sum, p) => sum + p.amount, 0)
    console.log(`Total outstanding: ${totalOutstanding.toLocaleString('hu-HU')} Ft`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

testOutstandingPayments()