'use client'

import { FinancialSummary } from '@/src/components/dashboard/financial-summary'
import { ExpiringContracts } from '@/src/components/dashboard/expiring-contracts'
import { OutstandingPayments } from '@/src/components/dashboard/outstanding-payments'

export default function TestWidgetsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Widget Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Financial Summary Widget</h2>
          <FinancialSummary userRole="ADMIN" />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-3">Expiring Contracts Widget</h2>
          <ExpiringContracts />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Outstanding Payments Widget</h2>
          <OutstandingPayments />
        </div>
      </div>
    </div>
  )
}