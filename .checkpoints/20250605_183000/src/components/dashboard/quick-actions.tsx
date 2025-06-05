'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, AlertCircle, FileText, Building, Users } from 'lucide-react'
import { UserRole } from '@prisma/client'
import Link from 'next/link'

interface QuickActionsProps {
  userRole: UserRole
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const getActionsForRole = (role: UserRole) => {
    const allActions = [
      {
        title: 'Új hibabejelentés',
        description: 'Új hiba jelentése',
        icon: AlertCircle,
        href: '/dashboard/issues/new',
        color: 'bg-red-500 hover:bg-red-600',
        roles: ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'TENANT'],
      },
      {
        title: 'Új ajánlat',
        description: 'Ajánlat készítése',
        icon: FileText,
        href: '/dashboard/offers/new',
        color: 'bg-blue-500 hover:bg-blue-600',
        roles: ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'SERVICE_MANAGER'],
      },
      {
        title: 'Új ingatlan',
        description: 'Ingatlan hozzáadása',
        icon: Building,
        href: '/dashboard/properties/new',
        color: 'bg-green-500 hover:bg-green-600',
        roles: ['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'],
      },
      {
        title: 'Új felhasználó',
        description: 'Felhasználó regisztrálása',
        icon: Users,
        href: '/dashboard/users/new',
        color: 'bg-purple-500 hover:bg-purple-600',
        roles: ['ADMIN', 'EDITOR_ADMIN'],
      },
    ]

    return allActions.filter(action => action.roles.includes(role))
  }

  const actions = getActionsForRole(userRole)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gyors műveletek</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 justify-start"
              asChild
            >
              <Link href={action.href}>
                <div className={`p-2 rounded-md ${action.color} mr-4`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}