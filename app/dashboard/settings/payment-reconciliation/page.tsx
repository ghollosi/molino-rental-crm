'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, RefreshCw, BarChart3, AlertTriangle, Clock, Euro, TrendingUp, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function PaymentReconciliationPage() {
  const [isTriggering, setIsTriggering] = useState(false)
  const [dateRange, setDateRange] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    dateTo: new Date().toISOString().split('T')[0], // today
  })

  // Fetch data
  const { data: stats, refetch: refetchStats } = api.reconciliation.getStats.useQuery({
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  })

  const { data: logs, refetch: refetchLogs } = api.reconciliation.getLogs.useQuery({
    page: 1,
    limit: 10,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  })

  const { data: unreconciledInvoices } = api.reconciliation.getUnreconciledInvoices.useQuery({
    page: 1,
    limit: 5,
  })

  // Trigger manual reconciliation
  const triggerReconciliation = async () => {
    setIsTriggering(true)
    try {
      const result = await api.reconciliation.triggerManualReconciliation.mutate()
      
      toast.success('Kézi párosítás elindítva!', {
        description: result.message,
      })

      // Refresh data
      setTimeout(() => {
        refetchStats()
        refetchLogs()
      }, 2000)
    } catch (error: any) {
      toast.error('Kézi párosítás sikertelen', {
        description: error.message,
      })
    } finally {
      setIsTriggering(false)
    }
  }

  const getStatusBadge = (errors: number, autoReconciled: number) => {
    if (errors > 0) {
      return <Badge variant="destructive">Hibás</Badge>
    }
    if (autoReconciled > 0) {
      return <Badge variant="default">Sikeres</Badge>
    }
    return <Badge variant="secondary">Üres</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Automatikus Fizetési Párosítás</h1>
        <p className="text-muted-foreground">
          CaixaBank tranzakciók és Zoho számlák automatikus párosításának monitorozása
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Párosítás Vezérlés
          </CardTitle>
          <CardDescription>
            Kézi párosítás indítása és monitorozás
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={triggerReconciliation} 
              disabled={isTriggering}
              variant="outline"
            >
              {isTriggering ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Kézi Párosítás Indítása
            </Button>

            {stats?.lastRun && (
              <div className="text-sm text-muted-foreground">
                Utolsó futás: {formatDistanceToNow(new Date(stats.lastRun), { addSuffix: true })}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>🔄 <strong>Automatikus ütemezés:</strong> Naponta 6:00, 12:00, 18:00</p>
            <p>🎯 <strong>Párosítási logika:</strong> Összeg ±1 EUR, dátum ±7 nap, konfidencia >90%</p>
            <p>📱 <strong>Értesítések:</strong> WhatsApp automatikus fizetés visszaigazolás</p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div className="text-sm font-medium">Összes Futás</div>
              </div>
              <div className="text-2xl font-bold">{stats.totals.totalRuns}</div>
              <div className="text-xs text-muted-foreground">
                Utolsó 30 napban
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="text-sm font-medium">Sikeres Párosítás</div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.totals.autoReconciled}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.rates.successRate.toFixed(1)}% siker arány
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-purple-500" />
                <div className="text-sm font-medium">Frissített Számlák</div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totals.invoicesUpdated}
              </div>
              <div className="text-xs text-muted-foreground">
                Zoho-ban is frissítve
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div className="text-sm font-medium">Hibák</div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {stats.totals.errors}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.rates.errorRate.toFixed(1)}% hiba arány
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Időszak Szűrő
          </CardTitle>
          <CardDescription>
            Válassza ki az elemzés időszakát
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Kezdő dátum</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateRange.dateFrom}
                onChange={(e) => setDateRange(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Befejező dátum</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateRange.dateTo}
                onChange={(e) => setDateRange(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      {logs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Legutóbbi Párosítások
            </CardTitle>
            <CardDescription>
              Automatikus párosítási napló
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">
                        {new Date(log.processedAt).toLocaleString('hu-HU')}
                      </div>
                      {getStatusBadge(log.errors, log.autoReconciled)}
                      <Badge variant="outline">{log.triggerType}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.contractsChecked} szerződés ellenőrizve • 
                      {log.transactionsMatched} tranzakció párosítva • 
                      {log.autoReconciled} automatikusan feldolgozva
                    </div>
                    {log.errors > 0 && (
                      <div className="text-sm text-red-600">
                        {log.errors} hiba történt a feldolgozás során
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="font-medium text-green-600">
                      {log.autoReconciled} sikeres
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.notificationsSent} értesítés
                    </div>
                    {log.executionTime && (
                      <div className="text-xs text-muted-foreground">
                        {log.executionTime}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {logs.logs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nincsenek párosítási naplók a megadott időszakban
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unreconciled Invoices */}
      {unreconciledInvoices && unreconciledInvoices.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Párosítás Nélküli Számlák
            </CardTitle>
            <CardDescription>
              Lejárt számlák, amelyek még nem párosítottak automatikusan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreconciledInvoices.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{invoice.tenant.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.property.address}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Esedékesség: {new Date(invoice.dueDate).toLocaleDateString('hu-HU')}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="font-medium text-red-600">
                      {invoice.amount.toFixed(2)} {invoice.currency}
                    </div>
                    <Badge variant="destructive">
                      {invoice.daysPastDue} nap késés
                    </Badge>
                    {invoice.externalInvoiceNumber && (
                      <div className="text-xs text-muted-foreground">
                        #{invoice.externalInvoiceNumber}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Párosítási Konfiguráció</CardTitle>
          <CardDescription>
            Automatikus párosítás beállításai
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Összeg tolerancia:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">±1.00 EUR</code>
            </div>
            <div>
              <strong>Dátum tolerancia:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">±7 nap</code>
            </div>
            <div>
              <strong>Konfidencia küszöb:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">>90%</code>
            </div>
            <div>
              <strong>Cron ütemezés:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                0 6,12,18 * * * (3x naponta)
              </code>
            </div>
            <div>
              <strong>WhatsApp értesítések:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">Automatikus fizetés visszaigazolás</code>
            </div>
            <div>
              <strong>Zoho szinkronizálás:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">Real-time státusz frissítés</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}