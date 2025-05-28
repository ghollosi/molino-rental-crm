/**
 * @file Workflow Automation Cron Job
 * @description Időalapú workflow szabályok végrehajtása
 * @created 2025-05-28
 */

import { NextRequest, NextResponse } from 'next/server'
import { WorkflowEngine } from '@/lib/workflow'

export async function GET(request: NextRequest) {
  try {
    // Biztonsági ellenőrzés - csak belső hívásokat engedélyezzük
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Jogosulatlan hozzáférés' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting workflow cron job...')
    const startTime = Date.now()

    // Időalapú workflow szabályok ellenőrzése
    await WorkflowEngine.checkTimeBasedRules()

    // SLA megfelelőség ellenőrzése és eszkaláció
    const slaCheck = await WorkflowEngine.checkSLACompliance()
    
    // Eszkaláció küldése kritikus esetekben
    for (const breach of slaCheck.slaBreaches) {
      if (breach.priority === 'URGENT' || breach.hoursOverdue > 24) {
        await WorkflowEngine.sendEscalationAlert(breach)
      }
    }

    const duration = Date.now() - startTime
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      stats: {
        slaBreaches: slaCheck.stats.totalBreaches,
        upcomingDeadlines: slaCheck.stats.upcomingCount,
        escalationsSent: slaCheck.slaBreaches.filter(b => 
          b.priority === 'URGENT' || b.hoursOverdue > 24
        ).length
      }
    }

    console.log('✅ Workflow cron job completed:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Workflow cron job failed:', error)
    return NextResponse.json(
      { 
        error: 'Workflow cron job hiba',
        details: error instanceof Error ? error.message : 'Ismeretlen hiba'
      },
      { status: 500 }
    )
  }
}

// POST endpoint manual triggering számára
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual workflow trigger started...')
    
    const body = await request.json()
    const action = body.action

    let result: any = {}

    switch (action) {
      case 'check-time-rules':
        await WorkflowEngine.checkTimeBasedRules()
        result.message = 'Időalapú szabályok ellenőrizve'
        break
        
      case 'check-sla':
        result = await WorkflowEngine.checkSLACompliance()
        break
        
      case 'get-stats':
        result = await WorkflowEngine.getWorkflowStats()
        break
        
      default:
        return NextResponse.json(
          { error: 'Ismeretlen action paraméter' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Manual workflow trigger failed:', error)
    return NextResponse.json(
      { 
        error: 'Workflow trigger hiba',
        details: error instanceof Error ? error.message : 'Ismeretlen hiba'
      },
      { status: 500 }
    )
  }
}