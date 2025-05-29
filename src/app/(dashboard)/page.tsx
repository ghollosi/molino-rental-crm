import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentIssues } from '@/components/dashboard/recent-issues'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { PropertyOverview } from '@/components/dashboard/property-overview'
import { FinancialSummary } from '@/src/components/dashboard/financial-summary'

export default function DashboardPage() {
  // Temporarily hardcode admin user for testing
  const mockSession = {
    user: {
      name: 'Admin User',
      email: 'admin@molino.com',
      role: 'ADMIN' as const
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Üdvözöljük, {mockSession.user.name}!
        </h1>
        <p className="text-gray-600">
          Itt van egy áttekintés a rendszer aktuális állapotáról.
        </p>
      </div>

      <DashboardStats userRole={mockSession.user.role} />

      <FinancialSummary userRole={mockSession.user.role} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentIssues userRole={mockSession.user.role} />
        <QuickActions userRole={mockSession.user.role} />
      </div>

      <PropertyOverview userRole={mockSession.user.role} />
    </div>
  )
}