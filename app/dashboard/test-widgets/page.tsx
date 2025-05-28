'use client'

import { FinancialSummary } from '@/src/components/dashboard/financial-summary'
import { ExpiringContracts } from '@/src/components/dashboard/expiring-contracts'

export default function TestWidgetsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Widget Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Financial Summary Widget</h2>
          <FinancialSummary />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-3">Expiring Contracts Widget</h2>
          <ExpiringContracts />
        </div>
      </div>
    </div>
  )
}