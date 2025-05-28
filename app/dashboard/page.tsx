'use client'

import { useSession } from 'next-auth/react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { EnhancedDashboardStats } from '@/components/dashboard/enhanced-dashboard-stats'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentIssues } from '@/components/dashboard/recent-issues'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { PropertyOverview } from '@/components/dashboard/property-overview'
import { FinancialSummary } from '@/src/components/dashboard/financial-summary'
import { ExpiringContracts } from '@/src/components/dashboard/expiring-contracts'
import { OutstandingPayments } from '@/src/components/dashboard/outstanding-payments'

export default function DashboardPage() {
  const { data: session } = useSession()
  
  if (!session) {
    return <div>Loading...</div>
  }

  // Session loaded

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - mobile optimized */}
      <div className="px-4 md:px-0">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">
          Üdvözöljük, {session.user.name}!
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2 leading-relaxed">
          Itt van egy áttekintés a rendszer aktuális állapotáról.
        </p>
      </div>

      {/* Stats - mobile responsive */}
      <div className="px-4 md:px-0">
        <EnhancedDashboardStats userRole={session.user.role} />
      </div>

      {/* Main widgets - stack on mobile, side by side on tablet+ */}
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <FinancialSummary userRole={session.user.role} />
          <ExpiringContracts />
        </div>

        {/* Outstanding payments - full width on all devices */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <OutstandingPayments />
        </div>
      </div>

      {/* Charts - mobile optimized */}
      <div className="px-4 md:px-0">
        <DashboardCharts userRole={session.user.role} />
      </div>

      {/* Secondary widgets - stack on mobile */}
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <RecentIssues userRole={session.user.role} />
          <QuickActions userRole={session.user.role} />
        </div>

        {/* Property overview - full width */}
        <PropertyOverview userRole={session.user.role} />
      </div>
    </div>
  )
}