import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createTestTenants() {
  console.log('🚀 Creating test tenants...')

  const testTenants = [
    {
      firstName: 'Péter',
      lastName: 'Molnár',
      email: 'molnar.peter@example.com',
      phone: '+36 30 111 2222',
      emergencyName: 'Molnár Éva',
      emergencyPhone: '+36 30 111 3333',
    },
    {
      firstName: 'Anna',
      lastName: 'Varga',
      email: 'varga.anna@example.com', 
      phone: '+36 30 222 3333',
      emergencyName: 'Varga József',
      emergencyPhone: '+36 30 222 4444',
    },
    {
      firstName: 'László',
      lastName: 'Kovács',
      email: 'kovacs.laszlo@example.com',
      phone: '+36 30 333 4444',
      emergencyName: 'Kovács Mária',
      emergencyPhone: '+36 30 333 5555',
    },
    {
      firstName: 'Eszter',
      lastName: 'Nagy',
      email: 'nagy.eszter@example.com',
      phone: '+36 30 444 5555',
      emergencyName: 'Nagy Tamás',
      emergencyPhone: '+36 30 444 6666',
    },
    {
      firstName: 'Gábor',
      lastName: 'Horváth',
      email: 'horvath.gabor@example.com',
      phone: '+36 30 555 6666',
      emergencyName: 'Horváth Judit',
      emergencyPhone: '+36 30 555 7777',
    },
  ]

  for (const tenantData of testTenants) {
    try {
      // Check if tenant already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: tenantData.email }
      })

      if (existingUser) {
        console.log(`⏭️  Tenant ${tenantData.firstName} ${tenantData.lastName} already exists`)
        continue
      }

      // Create user
      const hashedPassword = await bcrypt.hash('tenant123', 12)
      const user = await prisma.user.create({
        data: {
          email: tenantData.email,
          password: hashedPassword,
          firstName: tenantData.firstName,
          lastName: tenantData.lastName,
          role: 'TENANT',
          phone: tenantData.phone,
          isActive: true,
        },
      })

      // Create tenant
      await prisma.tenant.create({
        data: {
          userId: user.id,
          emergencyName: tenantData.emergencyName,
          emergencyPhone: tenantData.emergencyPhone,
          isActive: true,
        },
      })

      console.log(`✅ Created tenant: ${tenantData.firstName} ${tenantData.lastName}`)
    } catch (error) {
      console.error(`❌ Error creating ${tenantData.firstName} ${tenantData.lastName}:`, error)
    }
  }

  console.log('🎉 Test tenants created successfully!')
}

createTestTenants()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })