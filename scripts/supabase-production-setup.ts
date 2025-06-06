#!/usr/bin/env tsx
/**
 * SUPABASE PRODUCTION SETUP SCRIPT
 * Automatikusan beállítja a Supabase adatbázist production használatra
 * 
 * Használat:
 * npx tsx scripts/supabase-production-setup.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Supabase connection string
const SUPABASE_URL = 'postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres';

console.log('🚀 SUPABASE PRODUCTION SETUP STARTED');
console.log('=====================================');

async function setupSupabaseProduction() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: SUPABASE_URL
      }
    }
  });

  try {
    // 1. Kapcsolat tesztelése
    console.log('1️⃣  Adatbázis kapcsolat tesztelése...');
    await prisma.$connect();
    console.log('   ✅ Kapcsolat sikeres!');

    // 2. Táblák létrehozása (Prisma push)
    console.log('\n2️⃣  Adatbázis séma szinkronizálása...');
    console.log('   💡 Futtasd külön: npx prisma db push --schema=./prisma/schema.prisma');
    
    // 3. Admin user létrehozása
    console.log('\n3️⃣  Admin user létrehozása...');
    
    const adminEmail = 'admin@molino.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Ellenőrzés: létezik-e már az admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('   ⚠️  Admin user már létezik, frissítjük...');
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          firstName: 'Admin',
          lastName: 'User'
        }
      });
    } else {
      console.log('   ➕ Új admin user létrehozása...');
      await prisma.user.create({
        data: {
          id: 'admin-molino-2025',
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          language: 'HU',
          isActive: true
        }
      });
    }
    console.log('   ✅ Admin user kész!');

    // 4. Company rekord létrehozása
    console.log('\n4️⃣  Company rekord létrehozása...');
    
    const existingCompany = await prisma.company.findFirst();
    if (!existingCompany) {
      await prisma.company.create({
        data: {
          id: 'molino-company-2025',
          name: 'Molino Rental Company',
          email: 'admin@molino.com',
          settings: {
            theme: 'light',
            language: 'hu',
            currency: 'EUR',
            timezone: 'Europe/Budapest'
          }
        }
      });
      console.log('   ✅ Company rekord létrehozva!');
    } else {
      console.log('   ✅ Company rekord már létezik!');
    }

    // 5. Test userek létrehozása
    console.log('\n5️⃣  Test userek létrehozása...');
    
    const testPassword = await bcrypt.hash('user123', 10);
    
    // Owners
    for (let i = 1; i <= 5; i++) {
      const ownerEmail = `owner${i}@example.com`;
      const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
      
      if (!existingOwner) {
        const user = await prisma.user.create({
          data: {
            email: ownerEmail,
            password: testPassword,
            firstName: `Owner`,
            lastName: `${i}`,
            role: 'OWNER',
            language: 'HU',
            isActive: true
          }
        });

        // Owner profil létrehozása
        await prisma.owner.create({
          data: {
            userId: user.id,
            taxNumber: `12345678-${i}-12`,
            bankAccount: `ES91 2100 0418 4502 0005 139${i}`
          }
        });
      }
    }
    console.log('   ✅ 5 Owner user létrehozva!');

    // Tenants
    for (let i = 1; i <= 5; i++) {
      const tenantEmail = `tenant${i}@example.com`;
      const existingTenant = await prisma.user.findUnique({ where: { email: tenantEmail } });
      
      if (!existingTenant) {
        const user = await prisma.user.create({
          data: {
            email: tenantEmail,
            password: testPassword,
            firstName: `Tenant`,
            lastName: `${i}`,
            role: 'TENANT',
            language: 'HU',
            isActive: true
          }
        });

        // Tenant profil létrehozása
        await prisma.tenant.create({
          data: {
            userId: user.id,
            emergencyName: `Emergency Contact ${i}`,
            emergencyPhone: `+34 600 000 00${i}`
          }
        });
      }
    }
    console.log('   ✅ 5 Tenant user létrehozva!');

    // Providers
    for (let i = 1; i <= 5; i++) {
      const providerEmail = `provider${i}@example.com`;
      const existingProvider = await prisma.user.findUnique({ where: { email: providerEmail } });
      
      if (!existingProvider) {
        const user = await prisma.user.create({
          data: {
            email: providerEmail,
            password: testPassword,
            firstName: `Provider`,
            lastName: `${i}`,
            role: 'PROVIDER',
            language: 'HU',
            isActive: true
          }
        });

        // Provider profil létrehozása
        await prisma.provider.create({
          data: {
            userId: user.id,
            businessName: `Provider Business ${i}`,
            specialty: ['PLUMBING', 'ELECTRICAL'],
            hourlyRate: 50 + (i * 10),
            currency: 'EUR'
          }
        });
      }
    }
    console.log('   ✅ 5 Provider user létrehozva!');

    // 6. Sample Property létrehozása
    console.log('\n6️⃣  Sample Property létrehozása...');
    
    const firstOwner = await prisma.owner.findFirst();
    if (firstOwner && !(await prisma.property.findFirst())) {
      await prisma.property.create({
        data: {
          street: 'Calle de Ejemplo, 123',
          city: 'Alicante',
          postalCode: '03001',
          country: 'España',
          latitude: 38.3452,
          longitude: -0.4810,
          ownerId: firstOwner.id,
          type: 'APARTMENT',
          size: 85.5,
          rooms: 3,
          bedrooms: 2,
          capacity: 4,
          rentAmount: 750,
          currency: 'EUR',
          status: 'AVAILABLE'
        }
      });
      console.log('   ✅ Sample Property létrehozva!');
    } else {
      console.log('   ✅ Property már létezik!');
    }

    console.log('\n🎉 SUPABASE PRODUCTION SETUP KÉSZ!');
    console.log('===================================');
    console.log('\n📋 ÖSSZEFOGLALÓ:');
    console.log('✅ Adatbázis kapcsolat működik');
    console.log('✅ Admin user: admin@molino.com / admin123');
    console.log('✅ Test userek: owner1-5@example.com / user123');
    console.log('✅ Test userek: tenant1-5@example.com / user123');
    console.log('✅ Test userek: provider1-5@example.com / user123');
    console.log('✅ Sample property létrehozva');
    console.log('\n🔗 Production URL: https://molino-rental-crm.vercel.app');
    console.log('🔗 Bypass login: https://molino-rental-crm.vercel.app/api/bypass-login');

  } catch (error) {
    console.error('\n❌ HIBA történt:');
    console.error(error);
    console.log('\n🔧 HIBAELHÁRÍTÁS:');
    console.log('1. Ellenőrizd a DATABASE_URL-t');
    console.log('2. Futtasd: npx prisma db push');
    console.log('3. Ellenőrizd a Supabase project státuszát');
  } finally {
    await prisma.$disconnect();
  }
}

// Script futtatása
setupSupabaseProduction().catch(console.error);