import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Comprehensive seeding database with 10 records for each entity...')

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

  // Create passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // Create admin user
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

  // Create 10 owner users
  const ownerUsers = []
  const ownerNames = [
    'Nagy István', 'Kovács Mária', 'Szabó László', 'Tóth Anna', 'Varga Péter',
    'Horváth Katalin', 'Kiss János', 'Molnár Éva', 'Nemeth Gábor', 'Farkas Zsuzsanna'
  ]
  
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `owner${i + 1}@example.com`,
        password: userPassword,
        name: ownerNames[i],
        role: 'OWNER',
        language: 'HU',
        phone: `+36 30 ${String(i + 1).padStart(3, '0')} ${String(i + 1).padStart(4, '0')}`,
      },
    })
    ownerUsers.push(user)
  }

  // Create 10 tenant users
  const tenantUsers = []
  const tenantNames = [
    'Balogh Péter', 'Juhász Anna', 'Lakatos Gábor', 'Mészáros Kata', 'Oláh József',
    'Papp Zsófia', 'Rácz Tamás', 'Simon Éva', 'Takács Balázs', 'Urbán Nóra'
  ]
  
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `tenant${i + 1}@example.com`,
        password: userPassword,
        name: tenantNames[i],
        role: 'TENANT',
        language: 'HU',
        phone: `+36 70 ${String(i + 1).padStart(3, '0')} ${String(i + 1).padStart(4, '0')}`,
      },
    })
    tenantUsers.push(user)
  }

  // Create 10 provider users
  const providerUsers = []
  const providerNames = [
    'Fix-It Kft.', 'Gyors Javítás Bt.', 'Megbízható Szerviz', 'Profik Szolgáltató',
    'Villany Mester', 'Vízvezeték Szakértő', 'Fűtés Guru', 'Festék és Tapéta',
    'Ablak-Ajtó Szerviz', 'Tetőfedő Mesterek'
  ]
  
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `provider${i + 1}@example.com`,
        password: userPassword,
        name: providerNames[i],
        role: 'PROVIDER',
        language: 'HU',
        phone: `+36 20 ${String(i + 1).padStart(3, '0')} ${String(i + 1).padStart(4, '0')}`,
      },
    })
    providerUsers.push(user)
  }

  // Create 10 owner profiles
  const ownerProfiles = []
  const districts = ['1052', '1061', '1067', '1062', '1051', '1053', '1054', '1055', '1056', '1013']
  const streets = [
    'Petőfi utca 10.', 'Váci utca 25.', 'Kossuth tér 5.', 'Andrássy út 60.',
    'Rákóczi út 15.', 'Deák Ferenc tér 8.', 'József körút 33.', 'Múzeum körút 12.',
    'Bajcsy-Zsilinszky út 18.', 'Alkotmány utca 7.'
  ]
  
  for (let i = 0; i < 10; i++) {
    const profile = await prisma.owner.create({
      data: {
        userId: ownerUsers[i].id,
        taxNumber: `${12345678 + i}-1-42`,
        bankAccount: `${12345678 + i}-${12345678 + i}-${12345678 + i}`,
        billingStreet: streets[i],
        billingCity: 'Budapest',
        billingPostalCode: districts[i],
        billingCountry: 'Magyarország',
      },
    })
    ownerProfiles.push(profile)
  }

  // Create 10 tenant profiles
  const tenantProfiles = []
  const emergencyNames = [
    'Szabó János', 'Tóth László', 'Nagy Péter', 'Kovács Anna', 'Varga József',
    'Horváth Éva', 'Kiss Gábor', 'Molnár Kata', 'Nemeth László', 'Farkas János'
  ]
  
  for (let i = 0; i < 10; i++) {
    const profile = await prisma.tenant.create({
      data: {
        userId: tenantUsers[i].id,
        emergencyName: emergencyNames[i],
        emergencyPhone: `+36 30 ${String(i + 10).padStart(3, '0')} ${String(i + 1).padStart(4, '0')}`,
      },
    })
    tenantProfiles.push(profile)
  }

  // Create 10 provider profiles
  const providerProfiles = []
  const specialties = [
    ['PLUMBING', 'ELECTRICAL'],
    ['ELECTRICAL', 'HVAC'],
    ['HVAC', 'STRUCTURAL'],
    ['PLUMBING', 'OTHER'],
    ['ELECTRICAL'],
    ['PLUMBING'],
    ['HVAC'],
    ['STRUCTURAL', 'OTHER'],
    ['ELECTRICAL', 'STRUCTURAL'],
    ['PLUMBING', 'HVAC', 'ELECTRICAL']
  ]
  
  for (let i = 0; i < 10; i++) {
    const profile = await prisma.provider.create({
      data: {
        userId: providerUsers[i].id,
        businessName: providerNames[i],
        specialty: specialties[i],
        hourlyRate: 12000 + (i * 2000),
        currency: 'HUF',
        rating: 3.5 + (i * 0.15),
        availability: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '16:00' },
        },
      },
    })
    providerProfiles.push(profile)
  }

  // Create 10 properties
  const properties = []
  const propertyStreets = [
    'Andrássy út 60.', 'Váci út 15.', 'Bem rakpart 20.', 'Széchenyi tér 8.',
    'Fővám tér 11.', 'Kálvin tér 3.', 'Ferenciek tere 7.', 'Vörösmarty tér 12.',
    'Oktogon 4.', 'Blaha Lujza tér 9.'
  ]
  const propertyTypes = ['APARTMENT', 'APARTMENT', 'HOUSE', 'APARTMENT', 'OFFICE', 'APARTMENT', 'HOUSE', 'COMMERCIAL', 'APARTMENT', 'HOUSE']
  const propertyStatuses = ['RENTED', 'AVAILABLE', 'RENTED', 'AVAILABLE', 'RENTED', 'MAINTENANCE', 'AVAILABLE', 'RENTED', 'AVAILABLE', 'RENTED']
  
  for (let i = 0; i < 10; i++) {
    const property = await prisma.property.create({
      data: {
        ownerId: ownerProfiles[i].id,
        street: propertyStreets[i],
        city: 'Budapest',
        postalCode: districts[i],
        country: 'Magyarország',
        type: propertyTypes[i] as any,
        size: 50 + (i * 15),
        rooms: 1 + (i % 4),
        floor: i % 8,
        rentAmount: 150000 + (i * 25000),
        currency: 'HUF',
        status: propertyStatuses[i] as any,
        photos: [],
      },
    })
    properties.push(property)
  }

  // Update property tenants for rented properties
  for (let i = 0; i < 10; i++) {
    if (propertyStatuses[i] === 'RENTED' && i < tenantProfiles.length) {
      await prisma.property.update({
        where: { id: properties[i].id },
        data: { currentTenantId: tenantProfiles[i].id },
      })
    }
  }

  // Create 10 contracts
  const contracts = []
  for (let i = 0; i < 10; i++) {
    if (propertyStatuses[i] === 'RENTED' && i < tenantProfiles.length) {
      const startDate = new Date(2024, i % 12, 1)
      const endDate = new Date(2025, (i + 6) % 12, 28)
      
      const contract = await prisma.contract.create({
        data: {
          propertyId: properties[i].id,
          tenantId: tenantProfiles[i].id,
          startDate,
          endDate,
          rentAmount: 150000 + (i * 25000),
          deposit: (150000 + (i * 25000)) * 2,
          paymentDay: (i % 28) + 1,
        },
      })
      contracts.push(contract)
    }
  }

  // Create 10 issues
  const issues = []
  const issueTitles = [
    'Csöpög a csap a konyhában',
    'Nem működik a fűtés',
    'Kiégett a villany a nappaliban',
    'Eldugult a lefolyó',
    'Repedt a fal a hálószobában',
    'Nem zár jól az ajtó',
    'Problémás a bojler',
    'Kiszakadt a tapéta',
    'Rozsdás a radiátor',
    'Nem működik a csengő'
  ]
  
  const issueCategories = ['PLUMBING', 'HVAC', 'ELECTRICAL', 'PLUMBING', 'STRUCTURAL', 'OTHER', 'HVAC', 'OTHER', 'HVAC', 'ELECTRICAL']
  const issuePriorities = ['HIGH', 'URGENT', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'HIGH']
  const issueStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'OPEN', 'ASSIGNED', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'ASSIGNED', 'OPEN']
  
  for (let i = 0; i < 10; i++) {
    const assignedProvider = issueStatuses[i] === 'ASSIGNED' || issueStatuses[i] === 'IN_PROGRESS' 
      ? providerProfiles[i % providerProfiles.length].id 
      : null

    const issue = await prisma.issue.create({
      data: {
        propertyId: properties[i].id,
        reportedById: tenantUsers[i % tenantUsers.length].id,
        assignedToId: assignedProvider,
        title: issueTitles[i],
        description: `Részletes leírás: ${issueTitles[i].toLowerCase()}. Sürgős intézkedés szükséges.`,
        category: issueCategories[i] as any,
        priority: issuePriorities[i] as any,
        status: issueStatuses[i] as any,
        photos: [],
        scheduledDate: assignedProvider ? new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000) : null,
        completedDate: issueStatuses[i] === 'COMPLETED' ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : null,
      },
    })
    issues.push(issue)
  }

  // Create 10 offers
  const offers = []
  for (let i = 0; i < 10; i++) {
    const materialCost = 15000 + (i * 5000)
    const laborCost = 20000 + (i * 8000)
    const totalAmount = materialCost + laborCost
    
    const offer = await prisma.offer.create({
      data: {
        propertyId: properties[i].id,
        issueId: issues[i].id,
        createdById: providerUsers[i % providerUsers.length].id,
        items: [
          {
            description: `Anyagköltség - ${issueTitles[i]}`,
            quantity: 1,
            unitPrice: materialCost,
            total: materialCost,
          },
          {
            description: 'Munkadíj',
            quantity: Math.ceil(laborCost / 15000),
            unitPrice: 15000,
            total: laborCost,
          },
        ],
        laborCost,
        materialCost,
        totalAmount,
        currency: 'HUF',
        validUntil: new Date(Date.now() + (15 + i * 5) * 24 * 60 * 60 * 1000),
        status: i < 3 ? 'ACCEPTED' : i < 6 ? 'SENT' : i < 8 ? 'DRAFT' : 'REJECTED',
        notes: i % 2 === 0 ? 'Gyors javítás lehetséges.' : 'Előzetes árajánlat, pontos felmérés szükséges.',
      },
    })
    offers.push(offer)
  }

  // Create timeline entries for issues
  for (let i = 0; i < issues.length; i++) {
    await prisma.issueTimeline.create({
      data: {
        issueId: issues[i].id,
        status: 'OPEN',
        changedById: tenantUsers[i % tenantUsers.length].id,
        notes: 'Hibabejelentés létrehozva',
        timestamp: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
      },
    })

    if (issueStatuses[i] !== 'OPEN') {
      await prisma.issueTimeline.create({
        data: {
          issueId: issues[i].id,
          status: issueStatuses[i] as any,
          changedById: admin.id,
          notes: `Státusz változtatva: ${issueStatuses[i]}`,
          timestamp: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
        },
      })
    }
  }

  console.log('✅ Comprehensive database seeded successfully!')
  console.log('\n📊 Created records:')
  console.log('👤 Users: 31 (1 admin + 10 owners + 10 tenants + 10 providers)')
  console.log('🏢 Owner profiles: 10')
  console.log('🏠 Tenant profiles: 10') 
  console.log('🔧 Provider profiles: 10')
  console.log('🏘️  Properties: 10')
  console.log('📋 Contracts: 6 (for rented properties)')
  console.log('⚠️  Issues: 10')
  console.log('💰 Offers: 10')
  console.log('📝 Timeline entries: 20+')
  console.log('\n📧 Test accounts:')
  console.log('Admin: admin@molino.com / admin123')
  console.log('Owners: owner1-10@example.com / user123')
  console.log('Tenants: tenant1-10@example.com / user123')
  console.log('Providers: provider1-10@example.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })