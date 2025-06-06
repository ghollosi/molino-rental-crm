import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Client } from 'pg'

export async function POST() {
  try {
    console.log('🔄 Setting up production database...')
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    console.log('✅ Connected to database')
    
    // Create User table first
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "language" TEXT NOT NULL DEFAULT 'HU',
        "phone" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `)
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `)
    
    console.log('✅ User table created')

    // Create other essential tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Company" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "taxNumber" TEXT,
        "bankAccount" TEXT,
        "street" TEXT,
        "city" TEXT,
        "postalCode" TEXT,
        "country" TEXT,
        "settings" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Delete existing admin user if exists
    await client.query('DELETE FROM "User" WHERE email = $1', ['admin@molino.com'])
    
    // Create new admin user
    await client.query(`
      INSERT INTO "User" (id, email, password, name, role, language, phone, "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      'cmb9bk7zv0000jnsh3qx43rth',
      'admin@molino.com', 
      hashedPassword,
      'Admin User',
      'ADMIN',
      'HU',
      '+36 1 234 5678',
      true
    ])

    console.log('✅ Admin user created')
    
    // Create a default company
    await client.query(`
      INSERT INTO "Company" (id, name, settings, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      'comp_molino_001',
      'Molino RENTAL Kft.',
      JSON.stringify({ currency: 'HUF', language: 'HU', timezone: 'Europe/Budapest' })
    ])

    console.log('✅ Default company created')
    
    await client.end()
    
    return NextResponse.json({ 
      success: true,
      message: 'Database setup complete! You can now login with admin@molino.com / admin123',
      details: {
        userTable: 'created',
        companyTable: 'created',
        adminUser: 'created',
        defaultCompany: 'created'
      }
    })
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    return NextResponse.json({ 
      error: 'Failed to setup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}