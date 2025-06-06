'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { EnhancedDashboardStats } from '@/components/dashboard/enhanced-dashboard-stats'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentIssues } from '@/components/dashboard/recent-issues'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { PropertyOverview } from '@/components/dashboard/property-overview'
import { FinancialSummary } from '@/src/components/dashboard/financial-summary'
import { OutstandingPayments } from '@/src/components/dashboard/outstanding-payments'
import { CalendarWidget } from '@/src/components/dashboard/calendar-widget'
import { FinancialForecastingWidget } from '@/components/provider-matching/financial-forecasting-widget'
import { api } from '@/lib/trpc/client'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [bypassSession, setBypassSession] = useState<any>(null)
  
  // Check for bypass session
  useEffect(() => {
    if (status === 'unauthenticated' || !session) {
      // Check if we have bypass cookie
      const checkBypass = async () => {
        try {
          const response = await fetch('/api/test-nextauth')
          const data = await response.json()
          if (data.user) {
            setBypassSession({
              user: data.user
            })
          }
        } catch (error) {
          console.error('Bypass check error:', error)
        }
      }
      checkBypass()
    }
  }, [status, session])
  
  const activeSession = session || bypassSession
  const { data: currentUser } = api.user.getCurrentUser.useQuery(undefined, {
    enabled: !!activeSession?.user?.id
  })
  
  if (!activeSession) {
    return <div>Loading...</div>
  }

  // Build display name from current user data or fallback to session
  const displayName = currentUser 
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email?.split('@')[0]
    : activeSession.user.email?.split('@')[0] || 'Felhasználó'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Üdvözöljük, {displayName}!
        </h1>
        <p className="text-gray-600">
          Itt van egy áttekintés a rendszer aktuális állapotáról.
        </p>
      </div>

      <EnhancedDashboardStats userRole={activeSession.user.role} />

      {/* Financial Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialSummary userRole={activeSession.user.role} />
        <RecentIssues userRole={activeSession.user.role} />
      </div>

      {/* Outstanding Payments - Full Width */}
      <OutstandingPayments />

      <DashboardCharts userRole={activeSession.user.role} />

      {/* Calendar Widget - Full Width */}
      <CalendarWidget userRole={activeSession.user.role} />

      {/* Financial Forecasting Widget */}
      <FinancialForecastingWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions userRole={activeSession.user.role} />
        <PropertyOverview userRole={activeSession.user.role} />
      </div>
    </div>
  )
}