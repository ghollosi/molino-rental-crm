'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, ClipboardList, FileText } from 'lucide-react'
import { UserRole } from '@prisma/client'

interface DashboardStatsProps {
  userRole: UserRole
}

export function DashboardStats({ userRole }: DashboardStatsProps) {
  // TODO: Replace with real data from tRPC
  const stats = [
    {
      title: 'Összes ingatlan',
      value: '24',
      icon: Building,
      description: 'Aktív ingatlanok',
    },
    {
      title: 'Aktív bérlők',
      value: '18',
      icon: Users,
      description: 'Jelenleg bérlő',
    },
    {
      title: 'Nyitott hibák',
      value: '7',
      icon: ClipboardList,
      description: 'Megoldásra vár',
    },
    {
      title: 'Függő ajánlatok',
      value: '3',
      icon: FileText,
      description: 'Válaszra vár',
    },
  ]

  // Filter stats based on user role
  const filteredStats = userRole === 'TENANT' 
    ? stats.filter(stat => ['Nyitott hibák', 'Függő ajánlatok'].includes(stat.title))
    : stats

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {filteredStats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}