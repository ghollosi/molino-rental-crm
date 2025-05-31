/**
 * @file Workflow Administration Page
 * @description Workflow szabályok kezelése és statisztikák
 * @created 2025-05-28
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Clock, CheckCircle, TrendingUp, Settings, Play } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface WorkflowStats {
  rulesExecuted: number
  issuesProcessed: number
  avgResolutionTime: number
  slaCompliance: number
}

interface SLACheck {
  slaBreaches: any[]
  upcomingDeadlines: any[]
  stats: any
}

export default function WorkflowAdminPage() {
  const [stats, setStats] = useState<WorkflowStats | null>(null)
  const [slaData, setSlaData] = useState<SLACheck | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadWorkflowData = async () => {
    setIsLoading(true)
    try {
      // Workflow statisztikák betöltése
      const statsResponse = await fetch('/api/cron/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-stats' })
      })
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.result)
      }

      // SLA adatok betöltése
      const slaResponse = await fetch('/api/cron/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-sla' })
      })
      const slaResult = await slaResponse.json()
      if (slaResult.success) {
        setSlaData(slaResult.result)
      }

    } catch (error) {
      console.error('Failed to load workflow data:', error)
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a workflow adatokat",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const triggerWorkflow = async (action: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cron/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const result = await response.json()
      if (result.success) {
        toast({
          title: "Sikeres",
          description: "Workflow műveletek sikeresen végrehajtva"
        })
        await loadWorkflowData() // Frissítjük az adatokat
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Workflow trigger failed:', error)
      toast({
        title: "Hiba",
        description: "Workflow művelet sikertelen",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflowData()
  }, [])

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} perc`
    if (hours < 24) return `${Math.round(hours)} óra`
    return `${Math.round(hours / 24)} nap`
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflow Automatizáció</h1>
          <p className="text-muted-foreground">
            Hibabejelentések automatikus feldolgozása és SLA követés
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => triggerWorkflow('check-time-rules')}
            disabled={isLoading}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Szabályok futtatása
          </Button>
          <Button
            onClick={loadWorkflowData}
            disabled={isLoading}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Frissítés
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Áttekintés</TabsTrigger>
          <TabsTrigger value="sla">SLA Követés</TabsTrigger>
          <TabsTrigger value="rules">Szabályok</TabsTrigger>
          <TabsTrigger value="logs">Napló</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Feldolgozott hibák
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.issuesProcessed || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Összesen lezárt hibabejelentés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Átlagos megoldási idő
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? formatDuration(stats.avgResolutionTime) : '0 óra'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Létrehozástól lezárásig
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  SLA megfelelőség
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.slaCompliance || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Határidőn belül megoldva
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  SLA átlépések
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {slaData?.stats?.totalBreaches || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Jelenlegi nyitott hibák
                </p>
              </CardContent>
            </Card>
          </div>

          {slaData && slaData.upcomingDeadlines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Közelgő határidők</CardTitle>
                <CardDescription>
                  Hibák, amelyek hamarosan átlépik az SLA határidőt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {slaData.upcomingDeadlines.slice(0, 5).map((issue: any) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div>
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-sm text-gray-600">
                          {issue.property.street}, {issue.property.city}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-yellow-700">
                          {issue.priority}
                        </Badge>
                        <div className="text-sm text-yellow-700 mt-1">
                          {issue.hoursRemaining} óra van hátra
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">SLA átlépések</CardTitle>
                <CardDescription>
                  Hibák, amelyek már átlépték a határidőt
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slaData?.slaBreaches.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Jelenleg nincsenek SLA átlépések! 🎉
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slaData?.slaBreaches.map((issue: any) => (
                      <div key={issue.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                        <div>
                          <div className="font-medium">{issue.title}</div>
                          <div className="text-sm text-gray-600">
                            {issue.property.street}, {issue.property.city}
                          </div>
                          {issue.assignedTo?.user ? (
                            <div className="text-sm text-gray-500">
                              Hozzárendelve: {issue.assignedTo.user.name}
                            </div>
                          ) : (
                            <div className="text-sm text-red-600">
                              Nem hozzárendelt
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">
                            {issue.priority}
                          </Badge>
                          <div className="text-sm text-red-600 mt-1">
                            {issue.hoursOverdue} órája lejárt
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA határidők</CardTitle>
                <CardDescription>
                  Prioritás szerinti válaszidő követelmények
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <Badge variant="destructive">URGENT</Badge>
                    <span className="text-sm">2 óra</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <Badge className="bg-orange-500">HIGH</Badge>
                    <span className="text-sm">8 óra</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <Badge className="bg-yellow-500">MEDIUM</Badge>
                    <span className="text-sm">24 óra</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <Badge variant="secondary">LOW</Badge>
                    <span className="text-sm">72 óra</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktív workflow szabályok</CardTitle>
              <CardDescription>
                Automatikusan végrehajtott műveletek és feltételek
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Sürgős hibák automatikus hozzárendelése</h4>
                    <Badge variant="default">Aktív</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Sürgős prioritású hibák automatikusan IN_PROGRESS státuszra kerülnek
                  </p>
                  <div className="text-xs text-gray-500">
                    Trigger: Hibabejelentés létrehozása • Feltétel: URGENT prioritás
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Magas prioritású hibák eszkalációja</h4>
                    <Badge variant="default">Aktív</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Magas prioritású hibák 4 óra után eszkalálódnak
                  </p>
                  <div className="text-xs text-gray-500">
                    Trigger: Időalapú • Feltétel: HIGH prioritás, 4+ óra nyitva
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Befejezett feladatok automatikus lezárása</h4>
                    <Badge variant="default">Aktív</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    COMPLETED státuszú hibák 24 óra után automatikusan CLOSED-ra kerülnek
                  </p>
                  <div className="text-xs text-gray-500">
                    Trigger: Időalapú • Feltétel: COMPLETED státusz, 24+ óra
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Képes hibák gyorsabb feldolgozása</h4>
                    <Badge variant="default">Aktív</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Ha kép van csatolva, a hiba ASSIGNED státuszra kerül
                  </p>
                  <div className="text-xs text-gray-500">
                    Trigger: Kép feltöltése • Feltétel: Van csatolt kép
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow napló</CardTitle>
              <CardDescription>
                Legutóbbi workflow műveletek és események
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Workflow napló funkció fejlesztés alatt...
                <br />
                <Button 
                  onClick={() => triggerWorkflow('check-time-rules')}
                  className="mt-4"
                  variant="outline"
                >
                  Tesztelési workflow futtatása
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}