import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { runScheduledTasks } from '@/src/lib/scheduled-tasks'

export async function GET(request: NextRequest) {
  try {
    // Check if it's a cron job or manual trigger
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // If not from cron, check user auth
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      const session = await auth()
      
      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
    
    console.log('📧 Starting notification tasks...')
    
    const results = await runScheduledTasks()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
    
  } catch (error) {
    console.error('Notification cron error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request)
}