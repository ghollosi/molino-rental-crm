import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentIssues } from '@/components/dashboard/recent-issues'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { PropertyOverview } from '@/components/dashboard/property-overview'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

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

      <DashboardStats userRole={session.user.role} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentIssues userRole={session.user.role} />
        <QuickActions userRole={session.user.role} />
      </div>

      <PropertyOverview userRole={session.user.role} />
    </div>
  )
}