import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💰 Creating financial transactions from existing data...')

  // Get all contracts to generate rent income
  const contracts = await prisma.contract.findMany({
    include: {
      property: true,
      tenant: { include: { user: true } }
    }
  })

  // Get all offers to generate expenses
  const acceptedOffers = await prisma.offer.findMany({
    where: { status: 'ACCEPTED' },
    include: {
      property: true,
      issue: true
    }
  })

  console.log(`Found ${contracts.length} contracts and ${acceptedOffers.length} accepted offers`)

  // Generate rent income for the last 6 months
  const transactions: any[] = []
  const now = new Date()
  
  for (const contract of contracts) {
    // Generate monthly rent for last 6 months
    for (let monthsBack = 0; monthsBack < 6; monthsBack++) {
      const transactionDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, contract.paymentDay)
      
      // Only create if transaction date is after contract start
      if (transactionDate >= contract.startDate) {
        transactions.push({
          id: `rent_${contract.id}_${monthsBack}`,
          type: 'INCOME',
          category: 'RENT',
          amount: contract.rentAmount,
          currency: 'HUF',
          description: `Bérleti díj - ${contract.property.street}, ${contract.tenant.user.name}`,
          status: monthsBack <= 1 ? 'PENDING' : 'COMPLETED', // Last 2 months pending
          propertyId: contract.propertyId,
          contractId: contract.id,
          transactionDate,
          dueDate: transactionDate,
          paidDate: monthsBack <= 1 ? null : new Date(transactionDate.getTime() + 2 * 24 * 60 * 60 * 1000), // Paid 2 days later
          createdAt: new Date(transactionDate.getTime() - 5 * 24 * 60 * 60 * 1000), // Created 5 days before
          updatedAt: new Date()
        })
      }
    }
  }

  // Generate expenses from accepted offers
  for (const offer of acceptedOffers) {
    const expenseDate = offer.updatedAt
    
    transactions.push({
      id: `expense_${offer.id}`,
      type: 'EXPENSE',
      category: 'MAINTENANCE',
      amount: offer.totalAmount,
      currency: offer.currency,
      description: `Karbantartás - ${offer.issue?.title || 'Hibajavítás'} (${offer.property.street})`,
      status: 'COMPLETED',
      propertyId: offer.propertyId,
      issueId: offer.issueId,
      offerId: offer.id,
      transactionDate: expenseDate,
      dueDate: expenseDate,
      paidDate: new Date(expenseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // Paid 7 days later
      createdAt: expenseDate,
      updatedAt: new Date()
    })
  }

  // Generate additional maintenance expenses
  const properties = await prisma.property.findMany()
  
  for (const property of properties) {
    // Monthly utility costs
    for (let monthsBack = 0; monthsBack < 6; monthsBack++) {
      const expenseDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 15)
      
      transactions.push({
        id: `utility_${property.id}_${monthsBack}`,
        type: 'EXPENSE',
        category: 'UTILITIES',
        amount: 25000 + Math.floor(Math.random() * 15000), // 25k-40k random
        currency: 'HUF',
        description: `Rezsi költségek - ${property.street}`,
        status: 'COMPLETED',
        propertyId: property.id,
        transactionDate: expenseDate,
        dueDate: expenseDate,
        paidDate: new Date(expenseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(expenseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      })
    }

    // Quarterly insurance
    if (Math.random() > 0.7) { // 30% chance per property
      const insuranceDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      
      transactions.push({
        id: `insurance_${property.id}`,
        type: 'EXPENSE',
        category: 'INSURANCE',
        amount: 50000 + Math.floor(Math.random() * 30000), // 50k-80k
        currency: 'HUF',
        description: `Biztosítás - ${property.street}`,
        status: 'COMPLETED',
        propertyId: property.id,
        transactionDate: insuranceDate,
        dueDate: insuranceDate,
        paidDate: new Date(insuranceDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(insuranceDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      })
    }
  }

  // Execute raw SQL to insert transactions (since Prisma doesn't have the Transaction model yet)
  console.log(`Creating ${transactions.length} financial transactions...`)
  
  // First create the Transaction table if it doesn't exist
  try {
    await prisma.$executeRaw`
      CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');
    `
  } catch {
    // Type already exists
  }

  try {
    await prisma.$executeRaw`
      CREATE TYPE "TransactionCategory" AS ENUM ('RENT', 'MAINTENANCE', 'UTILITIES', 'INSURANCE', 'TAX', 'OTHER');
    `
  } catch {
    // Type already exists
  }

  try {
    await prisma.$executeRaw`
      CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
    `
  } catch {
    // Type already exists
  }

  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Transaction" (
          "id" TEXT NOT NULL,
          "type" "TransactionType" NOT NULL,
          "category" "TransactionCategory" NOT NULL,
          "amount" DECIMAL(65,30) NOT NULL,
          "currency" TEXT NOT NULL DEFAULT 'HUF',
          "description" TEXT NOT NULL,
          "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
          
          "propertyId" TEXT,
          "contractId" TEXT,
          "issueId" TEXT,
          "offerId" TEXT,
          
          "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "dueDate" TIMESTAMP(3),
          "paidDate" TIMESTAMP(3),
          
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
      );
    `
  } catch {
    // Table already exists
  }

  // Clear existing transactions
  await prisma.$executeRaw`DELETE FROM "Transaction"`

  // Insert transactions in batches
  const batchSize = 50
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    
    for (const transaction of batch) {
      await prisma.$executeRaw`
        INSERT INTO "Transaction" (
          "id", "type", "category", "amount", "currency", "description", "status",
          "propertyId", "contractId", "issueId", "offerId",
          "transactionDate", "dueDate", "paidDate", "createdAt", "updatedAt"
        ) VALUES (
          ${transaction.id}, ${transaction.type}::"TransactionType", ${transaction.category}::"TransactionCategory", 
          ${transaction.amount}, ${transaction.currency}, ${transaction.description}, ${transaction.status}::"TransactionStatus",
          ${transaction.propertyId}, ${transaction.contractId}, ${transaction.issueId}, ${transaction.offerId},
          ${transaction.transactionDate}, ${transaction.dueDate}, ${transaction.paidDate}, 
          ${transaction.createdAt}, ${transaction.updatedAt}
        )
      `
    }
  }

  // Calculate summary
  const totalIncome = await prisma.$queryRaw<{total: bigint}[]>`
    SELECT SUM(amount) as total FROM "Transaction" WHERE type = 'INCOME' AND status = 'COMPLETED'
  `
  
  const totalExpenses = await prisma.$queryRaw<{total: bigint}[]>`
    SELECT SUM(amount) as total FROM "Transaction" WHERE type = 'EXPENSE' AND status = 'COMPLETED'
  `

  const pendingIncome = await prisma.$queryRaw<{total: bigint}[]>`
    SELECT SUM(amount) as total FROM "Transaction" WHERE type = 'INCOME' AND status = 'PENDING'
  `

  console.log('✅ Financial transactions created successfully!')
  console.log('\n💰 Financial Summary:')
  console.log(`📈 Total Income (Completed): ${Number(totalIncome[0]?.total || 0).toLocaleString()} HUF`)
  console.log(`📉 Total Expenses (Completed): ${Number(totalExpenses[0]?.total || 0).toLocaleString()} HUF`)
  console.log(`⏳ Pending Income: ${Number(pendingIncome[0]?.total || 0).toLocaleString()} HUF`)
  console.log(`💡 Net Profit: ${(Number(totalIncome[0]?.total || 0) - Number(totalExpenses[0]?.total || 0)).toLocaleString()} HUF`)
  console.log(`📊 Total Transactions: ${transactions.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Financial data seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })