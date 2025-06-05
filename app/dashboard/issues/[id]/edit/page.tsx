'use client'

import { useParams } from 'next/navigation'
import { IssueForm } from '@/components/forms/issue-form'

export default function EditIssuePage() {
  const params = useParams()
  const id = params.id as string

  return (
    <IssueForm mode="edit" issueId={id} />
  )
}