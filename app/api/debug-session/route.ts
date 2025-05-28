import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }
    
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json({
      session: {
        user: session.user,
        expires: session.expires
      },
      database: dbUser,
      comparison: {
        nameMatches: session.user.name === dbUser?.name,
        sessionName: session.user.name,
        databaseName: dbUser?.name
      }
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}