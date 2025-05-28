'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, FileText, Download, Calendar, DollarSign, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState<number | null>(null)
  const [quickStats, setQuickStats] = useState({
    activeProperties: 0,
    satisfiedTenants: 0,
    openIssues: 0,
    occupancyRate: 0
  })

  const reports = [
    {
      id: 1,
      title: 'Havi bevételi jelentés',
      description: 'Részletes áttekintés a havi bérleti díjakról és bevételekről',
      icon: DollarSign,
      status: 'ready',
      lastGenerated: '2024-01-15',
      apiType: 'monthly-revenue',
    },
    {
      id: 2,
      title: 'Hibabejelentések összesítő',
      description: 'Statisztikák a bejelentett hibákról és azok kezeléséről',
      icon: AlertTriangle,
      status: 'ready',
      lastGenerated: '2024-01-14',
      apiType: 'issues-summary',
    },
    {
      id: 3,
      title: 'Ingatlan teljesítmény',
      description: 'Ingatlanok kihasználtsága és jövedelmezősége',
      icon: BarChart3,
      status: 'ready',
      lastGenerated: '2024-01-10',
      apiType: 'property-performance',
    },
    {
      id: 4,
      title: 'Bérlői elégedettség',
      description: 'Bérlői visszajelzések és elégedettségi felmérések',
      icon: FileText,
      status: 'ready',
      lastGenerated: null,
      apiType: 'tenant-satisfaction',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'secondary'
      case 'processing':
        return 'default'
      case 'draft':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Kész'
      case 'processing':
        return 'Feldolgozás alatt'
      case 'draft':
        return 'Tervezet'
      default:
        return status
    }
  }

  const handleGenerateReport = async (reportId: number, format: 'pdf' | 'excel' = 'pdf') => {
    const report = reports.find(r => r.id === reportId)
    if (!report) return

    setIsGenerating(reportId)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: report.apiType,
          format: format,
          filters: {}
        })
      })

      if (!response.ok) {
        throw new Error('Jelentés generálás sikertelen')
      }

      // Fájl letöltése
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.apiType}-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'html'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Siker",
        description: `${report.title} sikeresen generálva és letöltve`,
      })

    } catch (error) {
      console.error('Report generation failed:', error)
      toast({
        title: "Hiba",
        description: "Jelentés generálás sikertelen",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const handleDownloadReport = async (reportId: number, format: 'pdf' | 'excel' = 'pdf') => {
    await handleGenerateReport(reportId, format)
  }

  // Gyors statisztikák betöltése
  useEffect(() => {
    const loadQuickStats = async () => {
      try {
        // Property-k számának lekérése
        const propertiesResponse = await fetch('/api/properties')
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json()
          const rented = propertiesData.properties?.filter((p: any) => p.status === 'RENTED').length || 0
          const total = propertiesData.properties?.length || 1
          
          setQuickStats(prev => ({
            ...prev,
            activeProperties: rented,
            occupancyRate: Math.round((rented / total) * 100)
          }))
        }

        // Issues számának lekérése
        const issuesResponse = await fetch('/api/issues')
        if (issuesResponse.ok) {
          const issuesData = await issuesResponse.json()
          const openIssues = issuesData.issues?.filter((i: any) => 
            ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)
          ).length || 0
          
          setQuickStats(prev => ({
            ...prev,
            openIssues
          }))
        }

        // Elégedett bérlők (mock adat)
        setQuickStats(prev => ({
          ...prev,
          satisfiedTenants: Math.max(1, prev.activeProperties - 2)
        }))

      } catch (error) {
        console.error('Failed to load quick stats:', error)
      }
    }

    loadQuickStats()
  }, [])

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Jelentések</h1>
        <p className="text-gray-600">
          Részletes jelentések és statisztikák az ingatlankezelésről
        </p>
      </div>

      {/* Analytics link */}
      <div className="mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Részletes analitika</h3>
                  <p className="text-gray-600">Interaktív grafikonok és statisztikák</p>
                </div>
              </div>
              <Button asChild>
                <Link href="/dashboard/reports/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analitika megtekintése
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => {
          const IconComponent = report.icon
          return (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <Badge variant={getStatusColor(report.status)} className="mt-1">
                        {getStatusText(report.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{report.description}</p>
                
                {report.lastGenerated && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    Utoljára generálva: {new Date(report.lastGenerated).toLocaleDateString('hu-HU')}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(report.id, 'pdf')}
                    disabled={isGenerating === report.id}
                  >
                    {isGenerating === report.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    {isGenerating === report.id ? 'Generálás...' : 'PDF letöltés'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReport(report.id, 'excel')}
                    disabled={isGenerating === report.id}
                  >
                    {isGenerating === report.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Excel letöltés
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Gyors statisztikák</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{quickStats.activeProperties}</div>
                <div className="text-sm text-gray-600">Aktív ingatlan</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{quickStats.satisfiedTenants}</div>
                <div className="text-sm text-gray-600">Elégedett bérlő</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{quickStats.openIssues}</div>
                <div className="text-sm text-gray-600">Nyitott hiba</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{quickStats.occupancyRate}%</div>
                <div className="text-sm text-gray-600">Kihasználtság</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}