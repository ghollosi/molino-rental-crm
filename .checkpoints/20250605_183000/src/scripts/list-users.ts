import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  try {
    console.log('📋 Fetching all users from database...\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        language: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (users.length === 0) {
      console.log('No users found in the database.')
      return
    }

    console.log(`Found ${users.length} users:\n`)
    console.log('=' .repeat(80))
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Language: ${user.language}`)
      console.log(`   Phone: ${user.phone || 'Not provided'}`)
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`)
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
      console.log(`   ID: ${user.id}`)
      console.log('-'.repeat(80))
    })

    // Summary by role
    console.log('\n📊 Summary by Role:')
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} user(s)`)
    })

  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()