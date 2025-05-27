import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.issueTimeline.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.property.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.owner.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Molino RENTAL Kft.',
      taxNumber: '12345678-1-42',
      bankAccount: '12345678-12345678-12345678',
      street: 'Váci út 1.',
      city: 'Budapest',
      postalCode: '1133',
      country: 'Magyarország',
      settings: {
        currency: 'HUF',
        language: 'HU',
        timezone: 'Europe/Budapest',
        emailNotifications: true,
        email: 'info@molino-rental.hu',
        phone: '+36 1 234 5678',
        website: 'https://molino-rental.hu',
      },
    },
  })

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@molino.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      language: 'HU',
      phone: '+36 20 123 4567',
    },
  })

  const owner1 = await prisma.user.create({
    data: {
      email: 'owner1@example.com',
      password: userPassword,
      name: 'Nagy István',
      role: 'OWNER',
      language: 'HU',
      phone: '+36 30 111 2222',
    },
  })

  const owner2 = await prisma.user.create({
    data: {
      email: 'owner2@example.com',
      password: userPassword,
      name: 'Kovács Mária',
      role: 'OWNER',
      language: 'HU',
      phone: '+36 30 333 4444',
    },
  })

  const tenant1 = await prisma.user.create({
    data: {
      email: 'tenant1@example.com',
      password: userPassword,
      name: 'Szabó Péter',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 555 6666',
    },
  })

  const tenant2 = await prisma.user.create({
    data: {
      email: 'tenant2@example.com',
      password: userPassword,
      name: 'Tóth Anna',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 777 8888',
    },
  })

  const provider1 = await prisma.user.create({
    data: {
      email: 'provider1@example.com',
      password: userPassword,
      name: 'Fix-It Kft.',
      role: 'PROVIDER',
      language: 'HU',
      phone: '+36 20 999 0000',
    },
  })

  // Create owner profiles
  const ownerProfile1 = await prisma.owner.create({
    data: {
      userId: owner1.id,
      taxNumber: '87654321-1-42',
      bankAccount: '87654321-87654321-87654321',
      billingStreet: 'Petőfi utca 10.',
      billingCity: 'Budapest',
      billingPostalCode: '1052',
      billingCountry: 'Magyarország',
    },
  })

  const ownerProfile2 = await prisma.owner.create({
    data: {
      userId: owner2.id,
      taxNumber: '11223344-1-42',
      bankAccount: '11223344-11223344-11223344',
      billingStreet: 'Kossuth tér 5.',
      billingCity: 'Debrecen',
      billingPostalCode: '4024',
      billingCountry: 'Magyarország',
    },
  })

  // Create tenant profiles
  const tenantProfile1 = await prisma.tenant.create({
    data: {
      userId: tenant1.id,
      emergencyName: 'Szabó János',
      emergencyPhone: '+36 30 123 4567',
    },
  })

  const tenantProfile2 = await prisma.tenant.create({
    data: {
      userId: tenant2.id,
      emergencyName: 'Tóth László',
      emergencyPhone: '+36 30 987 6543',
    },
  })

  // Create provider profile
  const providerProfile = await prisma.provider.create({
    data: {
      userId: provider1.id,
      businessName: 'Fix-It Szolgáltató Kft.',
      specialty: ['PLUMBING', 'ELECTRICAL', 'HVAC'],
      hourlyRate: 15000,
      currency: 'HUF',
      rating: 4.5,
      availability: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '16:00' },
      },
    },
  })

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      ownerId: ownerProfile1.id,
      street: 'Andrássy út 60.',
      city: 'Budapest',
      postalCode: '1062',
      country: 'Magyarország',
      type: 'APARTMENT',
      size: 65,
      rooms: 2,
      floor: 3,
      rentAmount: 180000,
      currency: 'HUF',
      status: 'RENTED',
      photos: [],
    },
  })

  const property2 = await prisma.property.create({
    data: {
      ownerId: ownerProfile1.id,
      street: 'Váci út 15.',
      city: 'Budapest',
      postalCode: '1134',
      country: 'Magyarország',
      type: 'APARTMENT',
      size: 85,
      rooms: 3,
      floor: 5,
      rentAmount: 250000,
      currency: 'HUF',
      status: 'AVAILABLE',
      photos: [],
    },
  })

  const property3 = await prisma.property.create({
    data: {
      ownerId: ownerProfile2.id,
      street: 'Bem rakpart 20.',
      city: 'Budapest',
      postalCode: '1011',
      country: 'Magyarország',
      type: 'HOUSE',
      size: 150,
      rooms: 4,
      floor: 0,
      rentAmount: 350000,
      currency: 'HUF',
      status: 'RENTED',
      photos: [],
    },
  })

  // Create contracts
  const contract1 = await prisma.contract.create({
    data: {
      propertyId: property1.id,
      tenantId: tenantProfile1.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      rentAmount: 180000,
      deposit: 360000,
      paymentDay: 5,
    },
  })

  const contract2 = await prisma.contract.create({
    data: {
      propertyId: property3.id,
      tenantId: tenantProfile2.id,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      rentAmount: 350000,
      deposit: 700000,
      paymentDay: 1,
    },
  })

  // Create issues
  const issue1 = await prisma.issue.create({
    data: {
      propertyId: property1.id,
      reportedById: tenant1.id,
      title: 'Csöpög a csap a konyhában',
      description: 'A konyhai mosogató csapja folyamatosan csöpög, javítás szükséges.',
      category: 'PLUMBING',
      priority: 'HIGH',
      status: 'OPEN',
      photos: [],
    },
  })

  const issue2 = await prisma.issue.create({
    data: {
      propertyId: property3.id,
      reportedById: tenant2.id,
      assignedToId: providerProfile.id,
      title: 'Nem működik a fűtés',
      description: 'A nappaliban lévő radiátor nem melegszik, pedig a többi helyiségben működik a fűtés.',
      category: 'HVAC',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      photos: [],
    },
  })

  // Create offers
  const offer1 = await prisma.offer.create({
    data: {
      propertyId: property1.id,
      issueId: issue1.id,
      createdById: provider1.id,
      items: [
        {
          description: 'Csap csere',
          quantity: 1,
          unitPrice: 25000,
          total: 25000,
        },
        {
          description: 'Munkadíj',
          quantity: 2,
          unitPrice: 15000,
          total: 30000,
        },
      ],
      laborCost: 30000,
      materialCost: 25000,
      totalAmount: 55000,
      currency: 'HUF',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'SENT',
      notes: 'A csap teljes cseréje szükséges, javítás nem lehetséges.',
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📧 Test accounts:')
  console.log('Admin: admin@molino.com / admin123')
  console.log('Owner: owner1@example.com / user123')
  console.log('Tenant: tenant1@example.com / user123')
  console.log('Provider: provider1@example.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })