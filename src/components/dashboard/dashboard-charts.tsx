'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { trpc } from '@/src/lib/trpc'
import { UserRole } from '@prisma/client'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { hu } from 'date-fns/locale'

interface DashboardChartsProps {
  userRole: UserRole
}

const COLORS = {
  primary: '#0070f3',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6'
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary, 
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.purple
]

export function DashboardCharts({ userRole }: DashboardChartsProps) {
  // Fetch analytics data
  const { data: issueStats } = trpc.analytics.issuesByMonth.useQuery()
  const { data: propertyStats } = trpc.analytics.propertiesByStatus.useQuery()
  const { data: revenueStats } = trpc.analytics.revenueByMonth.useQuery()
  const { data: issuesByCategory, isLoading: isLoadingCategories } = trpc.analytics.issuesByCategory.useQuery()


  // Fallback data if API is loading (based on real data)
  const defaultIssuesByMonth = [
    { month: 'Dec', issues: 0, resolved: 0 },
    { month: 'Jan', issues: 0, resolved: 0 },
    { month: 'Feb', issues: 0, resolved: 0 },
    { month: 'Már', issues: 0, resolved: 0 },
    { month: 'Ápr', issues: 0, resolved: 0 },
    { month: 'Máj', issues: 2, resolved: 0 }
  ]

  const mockPropertiesByStatus = [
    { name: 'Elérhető', value: 2, color: COLORS.secondary },
    { name: 'Bérelt', value: 2, color: COLORS.primary }
  ]

  const mockRevenueByMonth = [
    { month: 'Dec', revenue: 530000, expenses: 159000 },
    { month: 'Jan', revenue: 530000, expenses: 159000 },
    { month: 'Feb', revenue: 530000, expenses: 159000 },
    { month: 'Már', revenue: 530000, expenses: 159000 },
    { month: 'Ápr', revenue: 530000, expenses: 159000 },
    { month: 'Máj', revenue: 530000, expenses: 159000 }
  ]

  const mockIssuesByCategory = [
    { category: 'Vízvezeték', count: 1 },
    { category: 'Fűtés/Légkondicionálás', count: 1 }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Hibabejelentések trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hibabejelentések trendje</CardTitle>
            <CardDescription>
              Havi hibabejelentések és megoldások száma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueStats || defaultIssuesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="issues" fill={COLORS.warning} name="Beérkezett" />
                <Bar dataKey="resolved" fill={COLORS.secondary} name="Megoldott" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ingatlanok státusz megoszlása */}
        <Card>
          <CardHeader>
            <CardTitle>Ingatlanok állapota</CardTitle>
            <CardDescription>
              Ingatlanok megoszlása státusz szerint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyStats || mockPropertiesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(propertyStats || mockPropertiesByStatus).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bevételek és kiadások */}
      <Card>
        <CardHeader>
          <CardTitle>Pénzügyi áttekintés</CardTitle>
          <CardDescription>
            Havi bevételek és kiadások trendje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueStats || mockRevenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K Ft`} />
              <Tooltip 
                content={<CustomTooltip />}
                formatter={(value: number) => [`${value.toLocaleString()} Ft`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1" 
                stroke={COLORS.secondary} 
                fill={COLORS.secondary}
                fillOpacity={0.6}
                name="Bevétel"
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stackId="2" 
                stroke={COLORS.danger} 
                fill={COLORS.danger}
                fillOpacity={0.6}
                name="Kiadás"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hibabejelentések kategória szerint */}
      <Card>
        <CardHeader>
          <CardTitle>Hibabejelentések kategóriák szerint</CardTitle>
          <CardDescription>
            A leggyakoribb hibabejelentési kategóriák
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-muted-foreground">Betöltés...</div>
            </div>
          ) : (issuesByCategory && issuesByCategory.length > 0) || (mockIssuesByCategory && mockIssuesByCategory.length > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issuesByCategory || mockIssuesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.primary} name="Hibabejelentések" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <p>Nincs hibabejelentés az adatbázisban</p>
                <p className="text-sm mt-1">Hibabejelentések létrehozása után itt jelennek meg a statisztikák</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}