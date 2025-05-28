'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, FileText, Download, Calendar, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const reports = [
    {
      id: 1,
      title: 'Havi bevételi jelentés',
      description: 'Részletes áttekintés a havi bérleti díjakról és bevételekről',
      icon: DollarSign,
      status: 'ready',
      lastGenerated: '2024-01-15',
    },
    {
      id: 2,
      title: 'Hibabejelentések összesítő',
      description: 'Statisztikák a bejelentett hibákról és azok kezeléséről',
      icon: AlertTriangle,
      status: 'ready',
      lastGenerated: '2024-01-14',
    },
    {
      id: 3,
      title: 'Ingatlan teljesítmény',
      description: 'Ingatlanok kihasználtsága és jövedelmezősége',
      icon: BarChart3,
      status: 'processing',
      lastGenerated: '2024-01-10',
    },
    {
      id: 4,
      title: 'Bérlői elégedettség',
      description: 'Bérlői visszajelzések és elégedettségi felmérések',
      icon: FileText,
      status: 'draft',
      lastGenerated: null,
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

  const handleGenerateReport = (reportId: number) => {
    // TODO: Implement report generation
    console.log('Generating report:', reportId)
  }

  const handleDownloadReport = (reportId: number) => {
    // TODO: Implement report download
    console.log('Downloading report:', reportId)
  }

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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={report.status === 'processing'}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {report.status === 'processing' ? 'Feldolgozás...' : 'Generálás'}
                  </Button>
                  
                  {report.status === 'ready' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadReport(report.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Letöltés
                    </Button>
                  )}
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
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Aktív ingatlan</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-gray-600">Elégedett bérlő</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-sm text-gray-600">Nyitott hiba</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">95%</div>
                <div className="text-sm text-gray-600">Kihasználtság</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}