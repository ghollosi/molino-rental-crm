// 🎯 TULAJDONOS LÉTREHOZÓ SCRIPT
// Használat: node create-owner.js "Név" "email@example.com" "jelszó"

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prodDb = "postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"
const prisma = new PrismaClient({ datasources: { db: { url: prodDb } } })

async function createOwner() {
  try {
    // Get arguments from command line
    const args = process.argv.slice(2)
    
    let name, email, password
    
    if (args.length >= 3) {
      [name, email, password] = args
    } else {
      // Default values
      const timestamp = Date.now()
      name = 'Új Tulajdonos'
      email = `tulajdonos-${timestamp}@example.com`
      password = 'jelszo123'
    }
    
    console.log('🏠 MOLINO RENTAL - Tulajdonos Létrehozás')
    console.log('=' .repeat(45))
    console.log(`📝 Név: ${name}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Jelszó: ${password}`)
    console.log('')
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.log('❌ HIBA: Ez az email cím már használatban van!')
      return
    }
    
    // Create user
    console.log('⏳ User létrehozása...')
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'OWNER' }
    })
    
    // Create owner profile
    console.log('⏳ Tulajdonos profil létrehozása...')
    const owner = await prisma.owner.create({
      data: { userId: user.id }
    })
    
    console.log('')
    console.log('🎉 SIKERES LÉTREHOZÁS!')
    console.log(`✅ User ID: ${user.id}`)
    console.log(`✅ Owner ID: ${owner.id}`)
    console.log(`✅ Email: ${email}`)
    console.log('')
    console.log('👆 Most menj a dashboard-ra és nézd meg a tulajdonosok listáját!')
    console.log('🌐 https://molino-rental-crm-production.vercel.app/dashboard/owners')
    
  } catch (error) {
    console.error('❌ HIBA:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createOwner()