'use client'

import { useSession } from 'next-auth/react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { EnhancedDashboardStats } from '@/components/dashboard/enhanced-dashboard-stats'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentIssues } from '@/components/dashboard/recent-issues'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { PropertyOverview } from '@/components/dashboard/property-overview'
import { FinancialSummary } from '@/src/components/dashboard/financial-summary'
import { OutstandingPayments } from '@/src/components/dashboard/outstanding-payments'

export default function DashboardPage() {
  const { data: session } = useSession()
  
  if (!session) {
    return <div>Loading...</div>
  }

  // Session loaded

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Üdvözöljük, {session.user.name}!
        </h1>
        <p className="text-gray-600">
          Itt van egy áttekintés a rendszer aktuális állapotáról.
        </p>
      </div>

      <EnhancedDashboardStats userRole={session.user.role} />

      {/* Financial Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialSummary userRole={session.user.role} />
        <RecentIssues userRole={session.user.role} />
      </div>

      {/* Outstanding Payments - Full Width */}
      <OutstandingPayments />

      <DashboardCharts userRole={session.user.role} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions userRole={session.user.role} />
        <PropertyOverview userRole={session.user.role} />
      </div>
    </div>
  )
}