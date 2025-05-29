'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    // Only ADMIN and EDITOR_ADMIN can access settings
    // OFFICE_ADMIN is explicitly excluded
    if (!session?.user || !['ADMIN', 'EDITOR_ADMIN'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Show loading or redirect
  if (status === 'loading') {
    return <div className="flex items-center justify-center h-64">Betöltés...</div>
  }

  if (!session?.user || !['ADMIN', 'EDITOR_ADMIN'].includes(session.user.role)) {
    return <div className="flex items-center justify-center h-64">Átirányítás...</div>
  }

  return <>{children}</>
}