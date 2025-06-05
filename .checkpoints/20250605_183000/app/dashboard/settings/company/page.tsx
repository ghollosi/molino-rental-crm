'use client'

import { CompanySettings } from '@/components/settings/company-settings'

export default function CompanyPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cégadatok</h1>
        <p className="text-gray-600">
          Céginformációk és üzleti adatok kezelése
        </p>
      </div>

      <CompanySettings />
    </div>
  )
}