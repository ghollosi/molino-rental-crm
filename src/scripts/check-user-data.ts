/**
 * Quick script to check what's actually in the database
 */

import { db } from '@/lib/db'

async function checkUserData() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    console.log('=== ALL USERS IN DATABASE ===')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`)
      console.log(`   Name: "${user.name}"`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Phone: ${user.phone || 'null'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Updated: ${user.updatedAt}`)
      console.log('---')
    })

    // Find the admin user specifically
    const adminUser = await db.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        updatedAt: true
      }
    })

    console.log('=== ADMIN USER DETAILS ===')
    console.log('Admin User:', adminUser)

  } catch (error) {
    console.error('Database query failed:', error)
  }
}

checkUserData().then(() => {
  console.log('Check complete')
  process.exit(0)
})