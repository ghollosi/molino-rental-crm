'use client'

import { useParams } from 'next/navigation'
import { TenantForm } from '@/components/forms/tenant-form'

export default function EditTenantPage() {
  const params = useParams()
  const id = params.id as string

  return <TenantForm mode="edit" tenantId={id} />
}