'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, CreditCard, Euro, Calendar, TrendingUp, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CaixaBankSettingsPage() {
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown')
  const [isCreatingConsent, setIsCreatingConsent] = useState(false)
  const [isProcessingPayments, setIsProcessingPayments] = useState(false)
  const [consentId, setConsentId] = useState('')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0], // today
  })

  // Test CaixaBank connection
  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await api.caixabank.testConnection.query()
      setConnectionStatus('success')
      toast.success('CaixaBank PSD2 kapcsolat sikeres!', {
        description: `Environment: ${result.environment}`,
      })
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error('CaixaBank PSD2 kapcsolat sikertelen', {
        description: error.message,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Create banking consent
  const createConsent = async () => {
    setIsCreatingConsent(true)
    try {
      const result = await api.caixabank.createConsent.mutate({
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })

      setConsentId(result.consentId)
      toast.success('Banking consent létrehozva!', {
        description: result.message,
        action: result.redirectUrl ? {
          label: 'Hozzájárulás megadása',
          onClick: () => window.open(result.redirectUrl, '_blank'),
        } : undefined,
      })
    } catch (error: any) {
      toast.error('Consent létrehozása sikertelen', {
        description: error.message,
      })
    } finally {
      setIsCreatingConsent(false)
    }
  }

  // Process daily payments
  const processDailyPayments = async () => {
    setIsProcessingPayments(true)
    try {
      const result = await api.caixabank.processDailyPayments.mutate()
      
      toast.success('Napi fizetések feldolgozva!', {
        description: `${result.autoReconciled} automatikusan párosítva, ${result.needsReview} felülvizsgálatra vár`,
      })
    } catch (error: any) {
      toast.error('Fizetések feldolgozása sikertelen', {
        description: error.message,
      })
    } finally {
      setIsProcessingPayments(false)
    }
  }

  // Fetch data
  const { data: consentStatus } = api.caixabank.getConsentStatus.useQuery(
    { consentId: consentId || undefined },
    { enabled: !!consentId }
  )

  const { data: accounts } = api.caixabank.getAccounts.useQuery(undefined, {
    enabled: connectionStatus === 'success',
  })

  const { data: balances } = api.caixabank.getBalances.useQuery(undefined, {
    enabled: connectionStatus === 'success',
  })

  const { data: transactions } = api.caixabank.getTransactions.useQuery({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    bookingStatus: 'booked',
  }, {
    enabled: connectionStatus === 'success',
  })

  const ConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const currentBalance = balances?.find(b => b.type === 'interimAvailable')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CaixaBank PSD2 Integráció</h1>
        <p className="text-muted-foreground">
          Automatikus fizetési monitoring és bérleti díj párosítás
        </p>
      </div>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            PSD2 API Kapcsolat
          </CardTitle>
          <CardDescription>
            Ellenőrizze a CaixaBank Open Banking API kapcsolatot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection}
              variant="outline"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              API Kapcsolat Tesztelése
            </Button>
            
            {connectionStatus !== 'unknown' && (
              <div className="flex items-center gap-2">
                <ConnectionStatusIcon />
                <Badge variant={connectionStatus === 'success' ? 'default' : 'destructive'}>
                  {connectionStatus === 'success' ? 'API Kapcsolódva' : 'API Kapcsolat sikertelen'}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Environment:</strong> {process.env.NEXT_PUBLIC_CAIXABANK_SANDBOX ? 'Sandbox' : 'Production'}</p>
            <p><strong>API Version:</strong> PSD2 v1</p>
            <p><strong>Szolgáltatás:</strong> Account Information Service (AIS)</p>
          </div>
        </CardContent>
      </Card>

      {/* Banking Consent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Banking Hozzájárulás
          </CardTitle>
          <CardDescription>
            PSD2 hozzájárulás kezelése számlainformációk eléréséhez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={createConsent} 
              disabled={isCreatingConsent}
              variant="outline"
            >
              {isCreatingConsent ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Új Hozzájárulás Létrehozása
            </Button>

            {consentStatus && (
              <Badge variant={consentStatus.isValid ? 'default' : 'destructive'}>
                {consentStatus.status}
              </Badge>
            )}
          </div>

          {consentId && (
            <div className="space-y-2">
              <Label>Consent ID</Label>
              <Input value={consentId} readOnly />
            </div>
          )}

          {consentStatus && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Érvényes:</strong> {consentStatus.validUntil}</p>
              <p><strong>Utolsó művelet:</strong> {formatDistanceToNow(new Date(consentStatus.lastActionDate), { addSuffix: true })}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Overview */}
      {accounts && accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Számlainformációk
            </CardTitle>
            <CardDescription>
              Üzleti bankszámla adatok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accounts.map((account, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="font-medium">{account.name || account.iban}</div>
                  <div className="text-sm text-muted-foreground">
                    IBAN: {account.iban}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Típus: {account.accountType}
                  </div>
                  {account.balances.map((balance, bidx) => (
                    <div key={bidx} className="flex justify-between">
                      <span className="text-sm">{balance.type}:</span>
                      <span className={`font-medium ${balance.indicator === 'CRDT' ? 'text-green-600' : 'text-red-600'}`}>
                        {balance.indicator === 'CRDT' ? '+' : '-'}{balance.amount.toFixed(2)} {balance.currency}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Payment Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Automatikus Fizetésfeldolgozás
          </CardTitle>
          <CardDescription>
            Napi bérleti díjak automatikus párosítása
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={processDailyPayments} 
            disabled={isProcessingPayments}
          >
            {isProcessingPayments ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            Napi Fizetések Feldolgozása
          </Button>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>🔄 <strong>Automatikus párosítás:</strong> Bérleti díjak és tranzakciók</p>
            <p>💰 <strong>Tolerance:</strong> ±1 cent pontosság</p>
            <p>📅 <strong>Időzítés:</strong> Esedékesség ±7 nap</p>
            <p>🎯 <strong>Konfidencia:</strong> >90% automatikus, <90% felülvizsgálat</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Legutóbbi Tranzakciók
            </CardTitle>
            <CardDescription>
              Banki tranzakciók az elmúlt 30 napból
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom">Kezdő dátum</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">Befejező dátum</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.booked.slice(0, 20).map((transaction, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {transaction.amount > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {transaction.amount > 0 ? transaction.debtorName : transaction.creditorName || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.remittanceInfo || transaction.reference}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.valueDate}
                      </div>
                    </div>
                  </div>
                  <div className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} {transaction.currency}
                  </div>
                </div>
              ))}
            </div>

            {transactions.booked.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nincsenek tranzakciók a megadott időszakban
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Konfiguráció</CardTitle>
          <CardDescription>
            CaixaBank PSD2 beállítások
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>API Endpoint:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_CAIXABANK_SANDBOX 
                  ? 'https://api.sandbox.caixabank.com/psd2/v1'
                  : 'https://api.caixabank.com/psd2/v1'
                }
              </code>
            </div>
            <div>
              <strong>OAuth Endpoint:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_CAIXABANK_SANDBOX 
                  ? 'https://api.sandbox.caixabank.com/oauth2/token'
                  : 'https://api.caixabank.com/oauth2/token'
                }
              </code>
            </div>
            <div>
              <strong>IBAN:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_CAIXABANK_IBAN || 'Nincs beállítva'}
              </code>
            </div>
            <div>
              <strong>Client ID:</strong><br />
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_CAIXABANK_CLIENT_ID ? '***' : 'Nincs beállítva'}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}