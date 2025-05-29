import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testFinancialQuery() {
  try {
    console.log('Testing Transaction table...')
    
    // Test basic count
    const count = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM "Transaction"
    `
    console.log(`Total transactions: ${Number(count[0].count)}`)
    
    // Test monthly income
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const monthlyIncome = await prisma.$queryRaw<{total: bigint}[]>`
      SELECT SUM(amount) as total 
      FROM "Transaction" 
      WHERE type = 'INCOME' 
      AND "transactionDate" >= ${startOfMonth}
      AND "transactionDate" <= ${endOfMonth}
    `
    
    console.log(`Monthly income: ${Number(monthlyIncome[0]?.total || 0)} HUF`)
    
    // Test yearly income  
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const yearlyIncome = await prisma.$queryRaw<{total: bigint}[]>`
      SELECT SUM(amount) as total 
      FROM "Transaction" 
      WHERE type = 'INCOME' 
      AND "transactionDate" >= ${startOfYear}
    `
    
    console.log(`Yearly income: ${Number(yearlyIncome[0]?.total || 0)} HUF`)
    
    // Test outstanding payments
    const outstanding = await prisma.$queryRaw<{total: bigint}[]>`
      SELECT SUM(amount) as total 
      FROM "Transaction" 
      WHERE type = 'INCOME' 
      AND status = 'PENDING'
    `
    
    console.log(`Outstanding: ${Number(outstanding[0]?.total || 0)} HUF`)
    
    console.log('✅ All queries successful!')
    
  } catch (error) {
    console.error('❌ Query failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFinancialQuery()