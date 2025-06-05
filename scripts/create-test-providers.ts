import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createTestProviders() {
  console.log('🚀 Creating test providers...')

  const testProviders = [
    {
      businessName: 'Aqua Fix Kft.',
      firstName: 'János',
      lastName: 'Kovács',
      email: 'kovacs@aquafix.hu',
      phone: '+36 30 123 4567',
      specialty: ['PLUMBING'],
      hourlyRate: 8000,
    },
    {
      businessName: 'ElektroMax Bt.',
      firstName: 'Péter',
      lastName: 'Nagy',
      email: 'nagy@elektromax.hu',
      phone: '+36 30 234 5678',
      specialty: ['ELECTRICAL'],
      hourlyRate: 9000,
    },
    {
      businessName: 'Klíma Center',
      firstName: 'Anna',
      lastName: 'Szabó',
      email: 'szabo@klimacenter.hu',
      phone: '+36 30 345 6789',
      specialty: ['HVAC'],
      hourlyRate: 7500,
    },
    {
      businessName: 'Építő Mester Kft.',
      firstName: 'Gábor',
      lastName: 'Tóth',
      email: 'toth@epitomester.hu',
      phone: '+36 30 456 7890',
      specialty: ['STRUCTURAL'],
      hourlyRate: 10000,
    },
    {
      businessName: 'Multi Szerviz',
      firstName: 'Éva',
      lastName: 'Kiss',
      email: 'kiss@multiszerviz.hu',
      phone: '+36 30 567 8901',
      specialty: ['PLUMBING', 'ELECTRICAL', 'OTHER'],
      hourlyRate: 8500,
    },
  ]

  for (const providerData of testProviders) {
    try {
      // Check if provider already exists
      const existingProvider = await prisma.user.findUnique({
        where: { email: providerData.email }
      })

      if (existingProvider) {
        console.log(`⏭️  Provider ${providerData.businessName} already exists`)
        continue
      }

      // Create user
      const hashedPassword = await bcrypt.hash('provider123', 12)
      const user = await prisma.user.create({
        data: {
          email: providerData.email,
          password: hashedPassword,
          firstName: providerData.firstName,
          lastName: providerData.lastName,
          role: 'PROVIDER',
          phone: providerData.phone,
          isActive: true,
        },
      })

      // Create provider
      await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: providerData.businessName,
          specialty: providerData.specialty,
          hourlyRate: providerData.hourlyRate,
          currency: 'HUF',
        },
      })

      console.log(`✅ Created provider: ${providerData.businessName}`)
    } catch (error) {
      console.error(`❌ Error creating ${providerData.businessName}:`, error)
    }
  }

  console.log('🎉 Test providers created successfully!')
}

createTestProviders()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })