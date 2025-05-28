import { db } from '../src/lib/db'

async function checkPaymentData() {
  console.log('💰 Checking payment and outstanding data...\n')
  
  try {
    // 1. Active contracts with payment info
    console.log('📋 1. ACTIVE CONTRACTS WITH PAYMENT INFO:')
    const activeContracts = await db.contract.findMany({
      where: {
        status: 'ACTIVE'
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
            city: true,
            rentAmount: true,
            currency: true
          }
        }
      }
    })

    activeContracts.forEach(contract => {
      console.log(`  Contract ${contract.id}:`)
      console.log(`    Tenant: ${contract.tenant?.user?.name || 'Unknown'}`)
      console.log(`    Property: ${contract.property.street}, ${contract.property.city}`)
      console.log(`    Rent: ${contract.rentAmount} ${(contract as any).currency || 'HUF'}`)
      console.log(`    Payment day: ${contract.paymentDay}`)
      console.log(`    Start: ${contract.startDate.toLocaleDateString('hu-HU')}`)
      console.log(`    End: ${contract.endDate.toLocaleDateString('hu-HU')}`)
      console.log('')
    })

    // 2. Calculate overdue payments
    console.log('⚠️ 2. OVERDUE PAYMENT ANALYSIS:')
    const today = new Date()
    const currentDay = today.getDate()
    
    const overdueContracts = activeContracts.filter(contract => {
      return contract.paymentDay < currentDay
    })

    if (overdueContracts.length === 0) {
      console.log('  ✅ No overdue payments found!')
    } else {
      overdueContracts.forEach(contract => {
        const daysOverdue = currentDay - contract.paymentDay
        console.log(`  📅 ${contract.tenant?.user?.name}: ${daysOverdue} days overdue`)
        console.log(`    Amount: ${contract.rentAmount} ${(contract as any).currency || 'HUF'}`)
        console.log(`    Contact: ${contract.tenant?.user?.email}`)
        console.log('')
      })
    }

    // 3. Upcoming payments (next 7 days)
    console.log('📅 3. UPCOMING PAYMENTS (NEXT 7 DAYS):')
    const upcomingContracts = activeContracts.filter(contract => {
      const paymentDay = contract.paymentDay
      const nextWeek = currentDay + 7
      return paymentDay >= currentDay && paymentDay <= nextWeek
    })

    if (upcomingContracts.length === 0) {
      console.log('  📋 No payments due in the next 7 days')
    } else {
      upcomingContracts.forEach(contract => {
        const daysUntilDue = contract.paymentDay - currentDay
        console.log(`  💸 ${contract.tenant?.user?.name}: Due in ${daysUntilDue} days`)
        console.log(`    Amount: ${contract.rentAmount} ${(contract as any).currency || 'HUF'}`)
        console.log('')
      })
    }

    // 4. Total outstanding amount estimation
    console.log('💵 4. TOTAL OUTSTANDING ESTIMATION:')
    const totalOverdueAmount = overdueContracts.reduce((sum, contract) => {
      return sum + Number(contract.rentAmount || 0)
    }, 0)

    console.log(`  Total overdue amount: ${totalOverdueAmount.toLocaleString('hu-HU')} Ft`)
    console.log(`  Number of overdue contracts: ${overdueContracts.length}`)
    console.log(`  Average overdue amount: ${overdueContracts.length > 0 ? Math.round(totalOverdueAmount / overdueContracts.length).toLocaleString('hu-HU') : 0} Ft`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkPaymentData()