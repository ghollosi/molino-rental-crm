'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MultiStepTenantForm } from '@/src/components/forms/multi-step-tenant-form'

export default function NewTenantPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const createTenant = api.tenant.create.useMutation({
    onSuccess: (data) => {
      router.push(`/dashboard/tenants/${data.id}`)
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const handleSubmit = async (data: any) => {
    setError(null)
    await createTenant.mutateAsync(data)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/tenants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a bérlők listájához
          </Link>
        </Button>
      </div>

      <MultiStepTenantForm
        onSubmit={handleSubmit}
        isSubmitting={createTenant.isPending}
        error={error}
      />
    </div>
  )
}