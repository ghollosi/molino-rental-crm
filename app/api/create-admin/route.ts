import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('🔄 Creating admin user in production database...')
    
    // Use fetch to make a SQL query to Supabase REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Delete existing admin user if exists
    await fetch(`${supabaseUrl}/rest/v1/User?email=eq.admin@molino.com`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    // Create new admin user with production schema (name field, not firstName/lastName)
    const response = await fetch(`${supabaseUrl}/rest/v1/User`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: 'cmb9bk7zv0000jnsh3qx43rth',
        email: 'admin@molino.com',
        password: hashedPassword,
        name: 'Admin User',  // Using name field for production schema
        role: 'ADMIN',
        language: 'HU',
        phone: '+36 1 234 5678',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Supabase error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log('✅ Admin user created successfully:', result)
    
    return NextResponse.json({ 
      success: true,
      user: Array.isArray(result) ? result[0] : result,
      message: 'Admin user created successfully. You can now login with admin@molino.com / admin123'
    })
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}