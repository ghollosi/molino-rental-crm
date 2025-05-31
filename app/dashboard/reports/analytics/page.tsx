'use client'

import { useSession } from 'next-auth/react'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { EnhancedDashboardStats } from '@/components/dashboard/enhanced-dashboard-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/trpc'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const { data: recentActivity } = api.analytics.recentActivity.useQuery()
  const { data: issuesByPriority } = api.analytics.issuesByPriority.useQuery()

  if (!session) {
    return <div>Betöltés...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analitika és jelentések</h1>
        <p className="text-gray-600">
          Részletes statisztikák és trendek a rendszer használatáról
        </p>
      </div>

      {/* Enhanced stats */}
      <EnhancedDashboardStats userRole={session.user.role} />

      {/* Main charts */}
      <DashboardCharts userRole={session.user.role} />

      {/* Additional analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Hibabejelentések prioritás szerint</CardTitle>
            <CardDescription>
              A hibabejelentések megoszlása prioritás szintek szerint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issuesByPriority || []}
                  dataKey="count"
                  nameKey="priority"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`}
                >
                  {(issuesByPriority || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Legutóbbi tevékenységek</CardTitle>
            <CardDescription>
              A rendszerben történt legutóbbi események
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity?.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'issue' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.subtitle}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString('hu-HU', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {activity.type === 'issue' && (activity as any).priority && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (activity as any).priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      (activity as any).priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      (activity as any).priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {(activity as any).priority}
                    </span>
                  )}
                </div>
              )) || (
                <div className="text-center text-gray-500 py-8">
                  Nincs megjeleníthető tevékenység
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Teljesítmény metrikák</CardTitle>
          <CardDescription>
            Kulcs teljesítménymutató (KPI) értékek
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-gray-500">Bérlő elégedettség</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2.3 nap</div>
              <div className="text-sm text-gray-500">Átlagos válaszidő</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">78%</div>
              <div className="text-sm text-gray-500">Első megoldási arány</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">92%</div>
              <div className="text-sm text-gray-500">Kihasználtság</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}