'use client'

import { useState, useEffect } from 'react'
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

export default function FixedDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState('ADMIN')
  const [displayName, setDisplayName] = useState('Admin User')

  useEffect(() => {
    // Check for bypass session
    const checkSession = async () => {
      try {
        // Try to get current user data
        const response = await fetch('/api/test-nextauth')
        const data = await response.json()
        
        if (data.user) {
          setDisplayName(data.user.firstName || 'Admin User')
          setUserRole(data.user.role || 'ADMIN')
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Dashboard betöltése...</p>
        </div>
      </div>
    )
  }

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

      <EnhancedDashboardStats userRole={userRole} />

      {/* Financial Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialSummary userRole={userRole} />
        <RecentIssues userRole={userRole} />
      </div>

      {/* Outstanding Payments - Full Width */}
      <OutstandingPayments userRole={userRole} />

      {/* Property Overview and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PropertyOverview userRole={userRole} />
        <CalendarWidget />
      </div>

      {/* Analytics Charts */}
      <DashboardCharts userRole={userRole} />

      {/* Financial Forecasting */}
      <FinancialForecastingWidget />

      {/* Quick Actions for Admin */}
      {userRole === 'ADMIN' && <QuickActions />}
    </div>
  )
}