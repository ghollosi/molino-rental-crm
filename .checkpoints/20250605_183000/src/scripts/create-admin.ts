import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@molino.com' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists!')
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@molino.com',
        password: hashedPassword,
        role: 'ADMIN',
        language: 'HU',
        isActive: true
      }
    })

    console.log('Admin user created successfully!')
    console.log('Email: admin@molino.com')
    console.log('Password: admin123')
    console.log('Role: ADMIN')
  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()