import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// IMPORTANT: Delete this file after using it!
export async function GET(request: Request) {
  try {
    // Security check - only allow from specific secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    if (secret !== 'molino-admin-setup-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminEmail = 'admin@molino.com'

    try {
      // Check if admin exists
      const existingResult = await pool.query(
        'SELECT id, email, name, role FROM "User" WHERE email = $1',
        [adminEmail]
      )

      if (existingResult.rows.length > 0) {
        // Update existing admin
        await pool.query(
          'UPDATE "User" SET password = $1, role = $2, "isActive" = $3, "updatedAt" = NOW() WHERE email = $4',
          [hashedPassword, 'ADMIN', true, adminEmail]
        )
        
        return NextResponse.json({ 
          message: 'Admin user password updated successfully',
          email: adminEmail,
          role: 'ADMIN'
        })
      } else {
        // Generate CUID-like ID
        const generateId = () => {
          const timestamp = Date.now().toString(36)
          const randomPart = Math.random().toString(36).substring(2, 15)
          return `c${timestamp}${randomPart}`
        }
        const newUserId = generateId()

        // Create new admin
        await pool.query(
          'INSERT INTO "User" (id, email, password, name, role, language, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
          [newUserId, adminEmail, hashedPassword, 'Admin User', 'ADMIN', 'HU', true]
        )

        return NextResponse.json({ 
          message: 'Admin user created successfully',
          email: adminEmail,
          role: 'ADMIN'
        })
      }
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}