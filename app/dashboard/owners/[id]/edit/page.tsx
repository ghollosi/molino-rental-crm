'use client'

import { useParams } from 'next/navigation'
import { OwnerForm } from '@/components/forms/owner-form'

export default function EditOwnerPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <OwnerForm mode="edit" ownerId={id} />
  )
}