'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, ClipboardList, FileText, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { trpc } from '@/src/lib/trpc'

interface EnhancedDashboardStatsProps {
  userRole: UserRole
}

export function EnhancedDashboardStats({ userRole }: EnhancedDashboardStatsProps) {
  const { data: stats } = trpc.analytics.dashboardStats.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
  })

  const statCards = [
    {
      title: 'Összes ingatlan',
      value: stats?.properties.total || 0,
      subtitle: `${stats?.properties.active || 0} aktív`,
      icon: Building,
      trend: stats?.properties.occupancyRate || 0,
      trendLabel: 'Kihasználtság',
      color: 'blue'
    },
    {
      title: 'Aktív bérlők',
      value: stats?.tenants.active || 0,
      subtitle: `${stats?.tenants.total || 0} összesen`,
      icon: Users,
      trend: stats?.tenants.total ? (stats.tenants.active / stats.tenants.total * 100) : 0,
      trendLabel: 'Aktív arány',
      color: 'green'
    },
    {
      title: 'Nyitott hibák',
      value: stats?.issues.open || 0,
      subtitle: `${stats?.issues.total || 0} összesen`,
      icon: ClipboardList,
      trend: stats?.issues.resolutionRate || 0,
      trendLabel: 'Megoldási arány',
      color: 'orange'
    },
    {
      title: 'Függő ajánlatok',
      value: stats?.offers.pending || 0,
      subtitle: `${stats?.offers.total || 0} összesen`,
      icon: FileText,
      trend: stats?.offers.total ? ((stats.offers.total - stats.offers.pending) / stats.offers.total * 100) : 0,
      trendLabel: 'Feldolgozott',
      color: 'purple'
    },
  ]

  // Filter stats based on user role
  const filteredStats = userRole === 'TENANT' 
    ? statCards.filter(stat => ['Nyitott hibák', 'Függő ajánlatok'].includes(stat.title))
    : statCards

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: 'text-blue-500'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: 'text-green-500'
      },
      orange: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        icon: 'text-orange-500'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: 'text-purple-500'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const getTrendIcon = (trend: number) => {
    if (trend >= 50) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    } else if (trend >= 25) {
      return <Activity className="h-4 w-4 text-orange-500" />
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {filteredStats.map((stat) => {
        const colors = getColorClasses(stat.color)
        
        return (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600 leading-tight">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${colors.bg}`}>
                <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${colors.icon}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg md:text-2xl font-bold text-gray-900 mb-1">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mb-2 md:mb-3">
                {stat.subtitle}
              </p>
              
              {/* Trend indicator - simplified on mobile */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {getTrendIcon(stat.trend)}
                  <span className="text-xs font-medium">
                    {stat.trend.toFixed(0)}%
                  </span>
                </div>
                <span className="text-xs text-gray-400 hidden md:inline">
                  {stat.trendLabel}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stat.trend >= 75 ? 'bg-green-500' :
                      stat.trend >= 50 ? 'bg-blue-500' :
                      stat.trend >= 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(stat.trend, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}