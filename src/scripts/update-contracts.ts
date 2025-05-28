/**
 * Update existing contracts with contract numbers and default status
 */

import { db } from '@/lib/db'

async function updateContracts() {
  try {
    console.log('🔄 Updating existing contracts...')

    const contracts = await db.contract.findMany({
      where: {
        contractNumber: null
      }
    })

    console.log(`Found ${contracts.length} contracts without contract numbers`)

    for (const contract of contracts) {
      const contractNumber = `CTR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      
      await db.contract.update({
        where: { id: contract.id },
        data: {
          contractNumber,
          status: 'DRAFT' // Set default status
        }
      })
      
      console.log(`✅ Updated contract ${contract.id} with number ${contractNumber}`)
    }

    console.log('✅ All contracts updated successfully!')

  } catch (error) {
    console.error('❌ Failed to update contracts:', error)
  }
}

updateContracts().then(() => {
  console.log('Update complete')
  process.exit(0)
})