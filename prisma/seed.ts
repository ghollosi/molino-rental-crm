import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with extensive demo data...')

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

  // Create users with different roles
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@molino.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Molino',
      role: 'ADMIN',
      language: 'HU',
      phone: '+36 20 123 4567',
    },
  })

  // Property owners
  const owner1 = await prisma.user.create({
    data: {
      email: 'nagy.istvan@example.com',
      password: userPassword,
      firstName: 'Nagy',
      lastName: 'István',
      role: 'OWNER',
      language: 'HU',
      phone: '+36 30 111 2222',
    },
  })

  const owner2 = await prisma.user.create({
    data: {
      email: 'kovacs.maria@example.com',
      password: userPassword,
      firstName: 'Kovács',
      lastName: 'Mária',
      role: 'OWNER',
      language: 'HU',
      phone: '+36 30 333 4444',
    },
  })

  const owner3 = await prisma.user.create({
    data: {
      email: 'budapest.investment@example.com',
      password: userPassword,
      firstName: 'Budapest',
      lastName: 'Investment Kft.',
      role: 'OWNER',
      language: 'HU',
      phone: '+36 1 456 7890',
    },
  })

  const owner4 = await prisma.user.create({
    data: {
      email: 'szabo.laszlo@example.com',
      password: userPassword,
      firstName: 'Szabó',
      lastName: 'László',
      role: 'OWNER',
      language: 'HU',
      phone: '+36 20 567 8901',
    },
  })

  // Tenants
  const tenant1 = await prisma.user.create({
    data: {
      email: 'szabo.peter@example.com',
      password: userPassword,
      firstName: 'Szabó',
      lastName: 'Péter',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 555 6666',
    },
  })

  const tenant2 = await prisma.user.create({
    data: {
      email: 'toth.anna@example.com',
      password: userPassword,
      firstName: 'Tóth',
      lastName: 'Anna',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 777 8888',
    },
  })

  const tenant3 = await prisma.user.create({
    data: {
      email: 'horvath.janos@example.com',
      password: userPassword,
      firstName: 'Horváth',
      lastName: 'János',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 123 4567',
    },
  })

  const tenant4 = await prisma.user.create({
    data: {
      email: 'varga.eva@example.com',
      password: userPassword,
      firstName: 'Varga',
      lastName: 'Éva',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 234 5678',
    },
  })

  const tenant5 = await prisma.user.create({
    data: {
      email: 'nemeth.gabor@example.com',
      password: userPassword,
      firstName: 'Németh',
      lastName: 'Gábor',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 345 6789',
    },
  })

  const tenant6 = await prisma.user.create({
    data: {
      email: 'kiss.zsuzsanna@example.com',
      password: userPassword,
      firstName: 'Kiss',
      lastName: 'Zsuzsanna',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 456 7890',
    },
  })

  const tenant7 = await prisma.user.create({
    data: {
      email: 'olah.robert@example.com',
      password: userPassword,
      firstName: 'Oláh',
      lastName: 'Róbert',
      role: 'TENANT',
      language: 'HU',
      phone: '+36 70 567 8901',
    },
  })

  // Service providers
  const provider1 = await prisma.user.create({
    data: {
      email: 'fixit.kft@example.com',
      password: userPassword,
      firstName: 'Fix-It',
      lastName: 'Kft.',
      role: 'PROVIDER',
      language: 'HU',
      phone: '+36 20 999 0000',
    },
  })

  const provider2 = await prisma.user.create({
    data: {
      email: 'elektro.service@example.com',
      password: userPassword,
      firstName: 'Elektro',
      lastName: 'Service',
      role: 'PROVIDER',
      language: 'HU',
      phone: '+36 20 888 1111',
    },
  })

  const provider3 = await prisma.user.create({
    data: {
      email: 'tisztitas.pro@example.com',
      password: userPassword,
      firstName: 'Tisztítás',
      lastName: 'Pro Kft.',
      role: 'PROVIDER',
      language: 'HU',
      phone: '+36 20 777 2222',
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

  const ownerProfile3 = await prisma.owner.create({
    data: {
      userId: owner3.id,
      taxNumber: '22334455-2-41',
      bankAccount: '22334455-22334455-22334455',
      billingStreet: 'Deák Ferenc utca 15.',
      billingCity: 'Budapest',
      billingPostalCode: '1052',
      billingCountry: 'Magyarország',
    },
  })

  const ownerProfile4 = await prisma.owner.create({
    data: {
      userId: owner4.id,
      taxNumber: '33445566-1-42',
      bankAccount: '33445566-33445566-33445566',
      billingStreet: 'Rákóczi út 25.',
      billingCity: 'Szeged',
      billingPostalCode: '6720',
      billingCountry: 'Magyarország',
    },
  })

  // Create tenant profiles
  const tenantProfile1 = await prisma.tenant.create({
    data: {
      userId: tenant1.id,
      emergencyName: 'Szabó János (édesapa)',
      emergencyPhone: '+36 30 123 4567',
    },
  })

  const tenantProfile2 = await prisma.tenant.create({
    data: {
      userId: tenant2.id,
      emergencyName: 'Tóth László (férj)',
      emergencyPhone: '+36 30 987 6543',
    },
  })

  const tenantProfile3 = await prisma.tenant.create({
    data: {
      userId: tenant3.id,
      emergencyName: 'Horváth Mária (feleség)',
      emergencyPhone: '+36 30 111 2222',
    },
  })

  const tenantProfile4 = await prisma.tenant.create({
    data: {
      userId: tenant4.id,
      emergencyName: 'Varga Péter (testvér)',
      emergencyPhone: '+36 30 333 4444',
    },
  })

  const tenantProfile5 = await prisma.tenant.create({
    data: {
      userId: tenant5.id,
      emergencyName: 'Németh András (barát)',
      emergencyPhone: '+36 30 555 6666',
    },
  })

  const tenantProfile6 = await prisma.tenant.create({
    data: {
      userId: tenant6.id,
      emergencyName: 'Kiss István (édesapa)',
      emergencyPhone: '+36 30 777 8888',
    },
  })

  const tenantProfile7 = await prisma.tenant.create({
    data: {
      userId: tenant7.id,
      emergencyName: 'Oláh Katalin (édesanya)',
      emergencyPhone: '+36 30 999 0000',
    },
  })

  // Create provider profiles
  const providerProfile1 = await prisma.provider.create({
    data: {
      userId: provider1.id,
      businessName: 'Fix-It Szolgáltató Kft.',
      specialty: ['Vízvezeték-szerelés', 'Villanyszerelés', 'Fűtés-szellőzés'],
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

  const providerProfile2 = await prisma.provider.create({
    data: {
      userId: provider2.id,
      businessName: 'Elektro Service Budapest',
      specialty: ['Villanyszerelés'],
      hourlyRate: 18000,
      currency: 'HUF',
      rating: 4.8,
      availability: {
        monday: { start: '07:00', end: '19:00' },
        tuesday: { start: '07:00', end: '19:00' },
        wednesday: { start: '07:00', end: '19:00' },
        thursday: { start: '07:00', end: '19:00' },
        friday: { start: '07:00', end: '17:00' },
        saturday: { start: '08:00', end: '14:00' },
      },
    },
  })

  const providerProfile3 = await prisma.provider.create({
    data: {
      userId: provider3.id,
      businessName: 'Tisztítás Pro Kft.',
      specialty: ['Takarítás'],
      hourlyRate: 8000,
      currency: 'HUF',
      rating: 4.2,
      availability: {
        monday: { start: '06:00', end: '20:00' },
        tuesday: { start: '06:00', end: '20:00' },
        wednesday: { start: '06:00', end: '20:00' },
        thursday: { start: '06:00', end: '20:00' },
        friday: { start: '06:00', end: '20:00' },
        saturday: { start: '08:00', end: '16:00' },
        sunday: { start: '10:00', end: '16:00' },
      },
    },
  })

  // Create properties with diverse data
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

  const property4 = await prisma.property.create({
    data: {
      ownerId: ownerProfile3.id,
      street: 'Kálvin tér 10.',
      city: 'Budapest',
      postalCode: '1091',
      country: 'Magyarország',
      type: 'OFFICE',
      size: 120,
      rooms: 5,
      floor: 2,
      rentAmount: 400000,
      currency: 'HUF',
      status: 'RENTED',
      photos: [],
    },
  })

  const property5 = await prisma.property.create({
    data: {
      ownerId: ownerProfile3.id,
      street: 'Dohány utca 5.',
      city: 'Budapest',
      postalCode: '1074',
      country: 'Magyarország',
      type: 'COMMERCIAL',
      size: 200,
      rooms: 3,
      floor: 0,
      rentAmount: 600000,
      currency: 'HUF',
      status: 'AVAILABLE',
      photos: [],
    },
  })

  const property6 = await prisma.property.create({
    data: {
      ownerId: ownerProfile4.id,
      street: 'Arany János utca 8.',
      city: 'Szeged',
      postalCode: '6720',
      country: 'Magyarország',
      type: 'APARTMENT',
      size: 75,
      rooms: 2,
      floor: 1,
      rentAmount: 120000,
      currency: 'HUF',
      status: 'RENTED',
      photos: [],
    },
  })

  const property7 = await prisma.property.create({
    data: {
      ownerId: ownerProfile4.id,
      street: 'Tisza Lajos körút 25.',
      city: 'Szeged',
      postalCode: '6722',
      country: 'Magyarország',
      type: 'APARTMENT',
      size: 45,
      rooms: 1,
      floor: 4,
      rentAmount: 90000,
      currency: 'HUF',
      status: 'AVAILABLE',
      photos: [],
    },
  })

  const property8 = await prisma.property.create({
    data: {
      ownerId: ownerProfile2.id,
      street: 'Széchenyi tér 12.',
      city: 'Debrecen',
      postalCode: '4024',
      country: 'Magyarország',
      type: 'APARTMENT',
      size: 95,
      rooms: 3,
      floor: 2,
      rentAmount: 160000,
      currency: 'HUF',
      status: 'MAINTENANCE',
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

  const contract3 = await prisma.contract.create({
    data: {
      propertyId: property4.id,
      tenantId: tenantProfile3.id,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2026-02-28'),
      rentAmount: 400000,
      deposit: 800000,
      paymentDay: 10,
    },
  })

  const contract4 = await prisma.contract.create({
    data: {
      propertyId: property6.id,
      tenantId: tenantProfile4.id,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-08-31'),
      rentAmount: 120000,
      deposit: 240000,
      paymentDay: 15,
    },
  })

  const contract5 = await prisma.contract.create({
    data: {
      propertyId: property2.id,
      tenantId: tenantProfile5.id,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      rentAmount: 220000,
      deposit: 440000,
      paymentDay: 5,
    },
  })

  // Create issues with various statuses and priorities
  const issue1 = await prisma.issue.create({
    data: {
      propertyId: property1.id,
      reportedById: tenant1.id,
      title: 'Csöpög a csap a konyhában',
      description: 'A konyhai mosogató csapja folyamatosan csöpög, javítás szükséges. A probléma már egy hete fennáll.',
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
      assignedToId: providerProfile1.id,
      title: 'Nem működik a fűtés',
      description: 'A nappaliban lévő radiátor nem melegszik, pedig a többi helyiségben működik a fűtés. Sürgős javítás szükséges.',
      category: 'HVAC',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      photos: [],
    },
  })

  const issue3 = await prisma.issue.create({
    data: {
      propertyId: property4.id,
      reportedById: tenant3.id,
      assignedToId: providerProfile2.id,
      title: 'Villogó égők az irodában',
      description: 'Az iroda 3-as számú helyiségében a mennyezeti világítás folyamatosan villog.',
      category: 'ELECTRICAL',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      photos: [],
    },
  })

  const issue4 = await prisma.issue.create({
    data: {
      propertyId: property6.id,
      reportedById: tenant4.id,
      title: 'Eldugult lefolyó a fürdőszobában',
      description: 'A zuhanyzó lefolyója eldugult, a víz nem folyik el.',
      category: 'PLUMBING',
      priority: 'HIGH',
      status: 'OPEN',
      photos: [],
    },
  })

  const issue5 = await prisma.issue.create({
    data: {
      propertyId: property1.id,
      reportedById: tenant1.id,
      assignedToId: providerProfile3.id,
      title: 'Takarítás szükséges a közös részeken',
      description: 'A lépcsőház és a bejárat takarítása szükséges.',
      category: 'OTHER',
      priority: 'LOW',
      status: 'COMPLETED',
      photos: [],
    },
  })

  const issue6 = await prisma.issue.create({
    data: {
      propertyId: property8.id,
      reportedById: admin.id,
      title: 'Vízkár a lakásban',
      description: 'A szomszéd lakásból víz szivárgott be, teljes felújítás szükséges.',
      category: 'STRUCTURAL',
      priority: 'URGENT',
      status: 'OPEN',
      photos: [],
    },
  })

  const issue7 = await prisma.issue.create({
    data: {
      propertyId: property3.id,
      reportedById: tenant2.id,
      title: 'Repedt ablaküveg',
      description: 'A hálószoba ablaküvege megrepedt, csere szükséges.',
      category: 'STRUCTURAL',
      priority: 'MEDIUM',
      status: 'OPEN',
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
          description: 'Egykaros mosogató csap csere',
          quantity: 1,
          unitPrice: 25000,
          total: 25000,
        },
        {
          description: 'Szerelési munkadíj',
          quantity: 2,
          unitPrice: 15000,
          total: 30000,
        },
        {
          description: 'Kiszállási díj',
          quantity: 1,
          unitPrice: 5000,
          total: 5000,
        },
      ],
      laborCost: 35000,
      materialCost: 25000,
      totalAmount: 60000,
      currency: 'HUF',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'SENT',
      notes: 'A csap teljes cseréje szükséges, javítás nem lehetséges. Garanciaidő: 2 év.',
    },
  })

  const offer2 = await prisma.offer.create({
    data: {
      propertyId: property3.id,
      issueId: issue2.id,
      createdById: provider1.id,
      items: [
        {
          description: 'Radiátor szelep csere',
          quantity: 1,
          unitPrice: 15000,
          total: 15000,
        },
        {
          description: 'Fűtési rendszer átmosás',
          quantity: 1,
          unitPrice: 45000,
          total: 45000,
        },
        {
          description: 'Munkadíj',
          quantity: 4,
          unitPrice: 15000,
          total: 60000,
        },
      ],
      laborCost: 60000,
      materialCost: 60000,
      totalAmount: 120000,
      currency: 'HUF',
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      status: 'ACCEPTED',
      notes: 'Sürgős javítás. Munka befejezése: 3-5 munkanap.',
    },
  })

  const offer3 = await prisma.offer.create({
    data: {
      propertyId: property4.id,
      issueId: issue3.id,
      createdById: provider2.id,
      items: [
        {
          description: 'LED izzó csere',
          quantity: 6,
          unitPrice: 2500,
          total: 15000,
        },
        {
          description: 'Ballaszt csere',
          quantity: 2,
          unitPrice: 8000,
          total: 16000,
        },
        {
          description: 'Villanyszerelési munkadíj',
          quantity: 2,
          unitPrice: 18000,
          total: 36000,
        },
      ],
      laborCost: 36000,
      materialCost: 31000,
      totalAmount: 67000,
      currency: 'HUF',
      validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
      status: 'ACCEPTED',
      notes: 'Munka elvégezve. Garancia: 1 év az alkatrészekre.',
    },
  })

  const offer4 = await prisma.offer.create({
    data: {
      propertyId: property6.id,
      issueId: issue4.id,
      createdById: provider1.id,
      items: [
        {
          description: 'Dugulás-elhárítás spirállal',
          quantity: 1,
          unitPrice: 25000,
          total: 25000,
        },
        {
          description: 'Lefolyó-tisztító szerek',
          quantity: 1,
          unitPrice: 3000,
          total: 3000,
        },
      ],
      laborCost: 25000,
      materialCost: 3000,
      totalAmount: 28000,
      currency: 'HUF',
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      status: 'SENT',
      notes: 'Gyors megoldás, jellemzően 1-2 óra alatt elvégezhető.',
    },
  })

  const offer5 = await prisma.offer.create({
    data: {
      propertyId: property1.id,
      issueId: issue5.id,
      createdById: provider3.id,
      items: [
        {
          description: 'Lépcsőház takarítás',
          quantity: 1,
          unitPrice: 15000,
          total: 15000,
        },
        {
          description: 'Bejárat takarítás és felmosás',
          quantity: 1,
          unitPrice: 8000,
          total: 8000,
        },
        {
          description: 'Takarítószerek',
          quantity: 1,
          unitPrice: 2000,
          total: 2000,
        },
      ],
      laborCost: 23000,
      materialCost: 2000,
      totalAmount: 25000,
      currency: 'HUF',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'ACCEPTED',
      notes: 'Heti rendszeres takarítási szolgáltatás is kérhető.',
    },
  })

  // Create contract templates
  console.log('📝 Creating contract templates...')
  
  const rentalTemplate = await prisma.contractTemplate.create({
    data: {
      name: 'Lakásbérleti szerződés',
      type: 'RENTAL',
      description: 'Általános lakásbérleti szerződés sablon magánszemélyek és cégek részére',
      content: `LAKÁSBÉRLETI SZERZŐDÉS

Amely létrejött egyrészről
Név: {{tulajdonos_nev}}
Születési név: {{tulajdonos_szuletesi_nev}}
Születési hely, idő: {{tulajdonos_szuletesi_hely_ido}}
Anyja neve: {{tulajdonos_anyja_neve}}
Személyi igazolvány száma: {{tulajdonos_szemelyi_szam}}
Lakcím: {{tulajdonos_lakcim}}
mint Bérbeadó (a továbbiakban: Bérbeadó),

másrészről
Név: {{berlo_nev}}
Születési név: {{berlo_szuletesi_nev}}
Születési hely, idő: {{berlo_szuletesi_hely_ido}}
Anyja neve: {{berlo_anyja_neve}}
Személyi igazolvány száma: {{berlo_szemelyi_szam}}
Lakcím: {{berlo_lakcim}}
mint Bérlő (a továbbiakban: Bérlő)

között az alulírott napon és helyen az alábbi feltételekkel:

1. A BÉRLEMÉNY
Bérbeadó bérbe adja, Bérlő pedig bérbe veszi a {{ingatlan_cim}} szám alatti, {{ingatlan_alapterulet}} m² alapterületű, {{ingatlan_szobaszam}} szobás lakást (a továbbiakban: Bérlemény).

2. A BÉRLETI JOGVISZONY IDŐTARTAMA
A bérleti jogviszony {{kezdo_datum}}-tól {{veg_datum}}-ig terjedő határozott időre jön létre.

3. BÉRLETI DÍJ
A bérleti díj összege: {{berleti_dij}} Ft/hó (azaz {{berleti_dij_szoveg}} forint havonta).
A bérleti díj minden hónap {{fizetes_napja}}. napjáig esedékes.

4. KAUCIÓ
Bérlő a szerződés aláírásával egyidejűleg {{kaucio}} Ft, azaz {{kaucio_szoveg}} forint kauciót fizet Bérbeadó részére.

5. REZSIKÖLTSÉGEK
{{rezsi_megallpodas}}

6. A FELEK JOGAI ÉS KÖTELEZETTSÉGEI
[További részletek...]`,
      variables: [
        { key: 'tulajdonos_nev', label: 'Tulajdonos neve', type: 'text', required: true },
        { key: 'tulajdonos_szuletesi_nev', label: 'Tulajdonos születési neve', type: 'text', required: true },
        { key: 'tulajdonos_szuletesi_hely_ido', label: 'Tulajdonos születési hely, idő', type: 'text', required: true },
        { key: 'tulajdonos_anyja_neve', label: 'Tulajdonos anyja neve', type: 'text', required: true },
        { key: 'tulajdonos_szemelyi_szam', label: 'Tulajdonos személyi száma', type: 'text', required: true },
        { key: 'tulajdonos_lakcim', label: 'Tulajdonos lakcíme', type: 'text', required: true },
        { key: 'berlo_nev', label: 'Bérlő neve', type: 'text', required: true },
        { key: 'berlo_szuletesi_nev', label: 'Bérlő születési neve', type: 'text', required: true },
        { key: 'berlo_szuletesi_hely_ido', label: 'Bérlő születési hely, idő', type: 'text', required: true },
        { key: 'berlo_anyja_neve', label: 'Bérlő anyja neve', type: 'text', required: true },
        { key: 'berlo_szemelyi_szam', label: 'Bérlő személyi száma', type: 'text', required: true },
        { key: 'berlo_lakcim', label: 'Bérlő lakcíme', type: 'text', required: true },
        { key: 'ingatlan_cim', label: 'Ingatlan címe', type: 'text', required: true },
        { key: 'ingatlan_alapterulet', label: 'Alapterület (m²)', type: 'number', required: true },
        { key: 'ingatlan_szobaszam', label: 'Szobák száma', type: 'number', required: true },
        { key: 'kezdo_datum', label: 'Kezdő dátum', type: 'date', required: true },
        { key: 'veg_datum', label: 'Vég dátum', type: 'date', required: true },
        { key: 'berleti_dij', label: 'Bérleti díj (Ft)', type: 'number', required: true },
        { key: 'berleti_dij_szoveg', label: 'Bérleti díj szöveggel', type: 'text', required: true },
        { key: 'fizetes_napja', label: 'Fizetés napja', type: 'number', required: true },
        { key: 'kaucio', label: 'Kaució összege (Ft)', type: 'number', required: true },
        { key: 'kaucio_szoveg', label: 'Kaució szöveggel', type: 'text', required: true },
        { key: 'rezsi_megallpodas', label: 'Rezsi megállapodás', type: 'text', required: true },
      ],
    },
  })

  const maintenanceTemplate = await prisma.contractTemplate.create({
    data: {
      name: 'Rendszeres karbantartási szerződés',
      type: 'MAINTENANCE',
      description: 'Ingatlan rendszeres karbantartására vonatkozó szerződés sablon',
      content: `KARBANTARTÁSI SZERZŐDÉS

Megrendelő: {{megrendelo_nev}}
Cím: {{megrendelo_cim}}

Vállalkozó: {{vallalkozo_nev}}
Cím: {{vallalkozo_cim}}

1. A SZERZŐDÉS TÁRGYA
Vállalkozó vállalja a {{ingatlan_cim}} alatti ingatlan rendszeres karbantartását.

2. KARBANTARTÁSI FELADATOK:
{{karbantartasi_feladatok}}

3. DÍJAZÁS
Havi átalánydíj: {{havi_dij}} Ft + ÁFA
Fizetési határidő: tárgyhó {{fizetes_napja}}. napja

4. IDŐTARTAM
Jelen szerződés {{kezdo_datum}}-tól határozatlan időre szól.`,
      variables: [
        { key: 'megrendelo_nev', label: 'Megrendelő neve', type: 'text', required: true },
        { key: 'megrendelo_cim', label: 'Megrendelő címe', type: 'text', required: true },
        { key: 'vallalkozo_nev', label: 'Vállalkozó neve', type: 'text', required: true },
        { key: 'vallalkozo_cim', label: 'Vállalkozó címe', type: 'text', required: true },
        { key: 'ingatlan_cim', label: 'Ingatlan címe', type: 'text', required: true },
        { key: 'karbantartasi_feladatok', label: 'Karbantartási feladatok', type: 'text', required: true },
        { key: 'havi_dij', label: 'Havi díj (Ft)', type: 'number', required: true },
        { key: 'fizetes_napja', label: 'Fizetés napja', type: 'number', required: true },
        { key: 'kezdo_datum', label: 'Kezdő dátum', type: 'date', required: true },
      ],
    },
  })

  const operationTemplate = await prisma.contractTemplate.create({
    data: {
      name: 'Komplett ingatlanüzemeltetési szerződés',
      type: 'OPERATION',
      description: 'Teljes körű ingatlanüzemeltetési szolgáltatásra vonatkozó szerződés',
      content: `INGATLANÜZEMELTETÉSI SZERZŐDÉS

Megbízó: {{megbizo_nev}}
Üzemeltető: {{uzemelteto_nev}}

1. ÜZEMELTETÉSI SZOLGÁLTATÁSOK:
- Műszaki üzemeltetés
- Takarítás és higiénia
- Karbantartás és javítások
- Energia menedzsment
- Biztonságtechnika
{{egyeb_szolgaltatasok}}

2. DÍJAZÁS
Üzemeltetési díj: {{uzemeltetesi_dij}} Ft/hó + ÁFA

3. TELJESÍTÉSI HATÁRIDŐK
{{teljesitesi_hataridok}}`,
      variables: [
        { key: 'megbizo_nev', label: 'Megbízó neve', type: 'text', required: true },
        { key: 'uzemelteto_nev', label: 'Üzemeltető neve', type: 'text', required: true },
        { key: 'egyeb_szolgaltatasok', label: 'Egyéb szolgáltatások', type: 'text', required: false },
        { key: 'uzemeltetesi_dij', label: 'Üzemeltetési díj (Ft/hó)', type: 'number', required: true },
        { key: 'teljesitesi_hataridok', label: 'Teljesítési határidők', type: 'text', required: true },
      ],
    },
  })

  const mediationTemplate = await prisma.contractTemplate.create({
    data: {
      name: 'Komplett bérbeadás-közvetítői szerződés',
      type: 'MEDIATION',
      description: 'Ingatlan bérbeadásának közvetítésére vonatkozó megbízási szerződés',
      content: `BÉRBEADÁS-KÖZVETÍTŐI MEGBÍZÁSI SZERZŐDÉS

Megbízó: {{megbizo_nev}}
Közvetítő: {{kozvetito_nev}}

1. MEGBÍZÁS TÁRGYA
Megbízó megbízza Közvetítőt a {{ingatlan_cim}} alatti ingatlan bérbeadásának közvetítésével.

2. KÖZVETÍTŐI DÍJ
Sikeres közvetítés esetén: {{kozvetitoi_dij_szazalek}}% + ÁFA a havi bérleti díjból
Fizetendő: {{kozvetitoi_dij_osszeg}} Ft + ÁFA

3. EXKLUZIVITÁS
{{exkluzivitas}}

4. IDŐTARTAM
A megbízás {{kezdo_datum}}-tól {{veg_datum}}-ig érvényes.`,
      variables: [
        { key: 'megbizo_nev', label: 'Megbízó neve', type: 'text', required: true },
        { key: 'kozvetito_nev', label: 'Közvetítő neve', type: 'text', required: true },
        { key: 'ingatlan_cim', label: 'Ingatlan címe', type: 'text', required: true },
        { key: 'kozvetitoi_dij_szazalek', label: 'Közvetítői díj (%)', type: 'number', required: true },
        { key: 'kozvetitoi_dij_osszeg', label: 'Közvetítői díj összege', type: 'number', required: true },
        { key: 'exkluzivitas', label: 'Exkluzivitás feltételei', type: 'text', required: true },
        { key: 'kezdo_datum', label: 'Kezdő dátum', type: 'date', required: true },
        { key: 'veg_datum', label: 'Vég dátum', type: 'date', required: true },
      ],
    },
  })

  console.log('✅ Database seeded successfully with comprehensive demo data!')
  console.log('\n📊 Created data summary:')
  console.log('👥 Users: 15 (1 admin, 4 owners, 7 tenants, 3 providers)')
  console.log('🏠 Properties: 8 (various types and statuses)')
  console.log('📋 Contracts: 5 (active and expired)')
  console.log('🚨 Issues: 7 (different priorities and statuses)')
  console.log('💰 Offers: 5 (various statuses)')
  console.log('📝 Contract Templates: 4 (rental, maintenance, operation, mediation)')
  console.log('\n📧 Test accounts:')
  console.log('👨‍💼 Admin: admin@molino.com / admin123')
  console.log('🏘️  Owner: nagy.istvan@example.com / user123')
  console.log('🏠 Tenant: szabo.peter@example.com / user123')
  console.log('🔧 Provider: fixit.kft@example.com / user123')
  console.log('\n🌐 You can now explore the application with realistic data!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })