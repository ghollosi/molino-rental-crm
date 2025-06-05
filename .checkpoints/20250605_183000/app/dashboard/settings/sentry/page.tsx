'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, Bug, Activity, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import * as Sentry from '@sentry/nextjs'
import { logError, logApiError, logDatabaseError, trackPerformance } from '@/src/lib/sentry'

export default function SentryTestPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const testSentryIntegration = async () => {
    setIsLoading(true)
    const results: any[] = []

    try {
      // Test 1: Basic error capture
      try {
        throw new Error('Test error from Sentry dashboard')
      } catch (error) {
        logError(error as Error, { test: 'basic_error', source: 'sentry_dashboard' })
        results.push({ test: 'Basic Error Capture', status: 'success', message: 'Error logged to Sentry' })
      }

      // Test 2: API error simulation
      try {
        throw new Error('Simulated API error')
      } catch (error) {
        logApiError(error as Error, '/test/endpoint', 'POST', 'test-user-id')
        results.push({ test: 'API Error Logging', status: 'success', message: 'API error logged with context' })
      }

      // Test 3: Database error simulation
      try {
        throw new Error('Simulated database connection error')
      } catch (error) {
        logDatabaseError(error as Error, 'SELECT', 'users')
        results.push({ test: 'Database Error Logging', status: 'success', message: 'Database error logged' })
      }

      // Test 4: Performance tracking
      const startTime = Date.now()
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate slow operation
      const duration = Date.now() - startTime
      trackPerformance('test_operation', duration, { operation: 'sentry_test' })
      results.push({ test: 'Performance Tracking', status: 'success', message: `Operation tracked (${duration}ms)` })

      // Test 5: Custom message
      Sentry.captureMessage('Sentry integration test completed successfully', 'info')
      results.push({ test: 'Custom Message', status: 'success', message: 'Custom message sent to Sentry' })

      setTestResults(results)
      toast.success('Sentry integration tests completed!')

    } catch (error) {
      console.error('Test error:', error)
      toast.error('Error during Sentry tests')
      results.push({ test: 'Overall', status: 'error', message: 'Tests failed' })
      setTestResults(results)
    } finally {
      setIsLoading(false)
    }
  }

  const sentryStatus = {
    configured: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configured' : 'Not configured'
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sentry Error Tracking</h1>
        <p className="text-gray-600">
          Hibák monitorozása és teljesítmény nyomon követése
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Sentry Állapot</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                {sentryStatus.configured ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                )}
                <div>
                  <p className="font-medium">{sentryStatus.configured ? 'Konfigurálva' : 'Nincs konfigurálva'}</p>
                  <p className="text-sm text-gray-600">DSN: {sentryStatus.dsn}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Környezet</p>
                  <p className="text-sm text-blue-700">{sentryStatus.environment}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium">Tracking</p>
                  <p className="text-sm text-purple-700">Errors & Performance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sentry Funkciók</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Error Tracking</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ Basic Errors</Badge>
                    <span>Automatikus hibafogás</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ API Errors</Badge>
                    <span>Endpoint specifikus hibák</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ Database Errors</Badge>
                    <span>Adatbázis műveletek</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ Auth Errors</Badge>
                    <span>Bejelentkezési hibák</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Performance Monitoring</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ Request Tracing</Badge>
                    <span>API kérések nyomon követése</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ Database Queries</Badge>
                    <span>Lassú lekérdezések</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ User Sessions</Badge>
                    <span>Session replays</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">✅ Rate Limiting</Badge>
                    <span>Túllépések monitorozása</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Sentry Integráció Tesztelése</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ez a teszt különböző típusú hibákat és eseményeket küld a Sentry-nek. 
                  A fejlesztői környezetben ezek nem kerülnek valós elküldésre.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button 
                  onClick={testSentryIntegration}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Bug className="h-4 w-4" />
                  <span>{isLoading ? 'Tesztelés...' : 'Sentry Tesztek Futtatása'}</span>
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Teszt Eredmények</h4>
                  <div className="space-y-2">
                    {testResults.map((result, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.test}</span>
                          <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                            {result.status === 'success' ? '✅ Sikeres' : '❌ Hiba'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle>Konfiguráció</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Client Config</p>
                  <p className="text-gray-600">sentry.client.config.ts</p>
                </div>
                <div>
                  <p className="font-medium">Server Config</p>
                  <p className="text-gray-600">sentry.server.config.ts</p>
                </div>
                <div>
                  <p className="font-medium">Edge Config</p>
                  <p className="text-gray-600">sentry.edge.config.ts</p>
                </div>
                <div>
                  <p className="font-medium">Utilities</p>
                  <p className="text-gray-600">src/lib/sentry.ts</p>
                </div>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Production környezetben állítsd be a NEXT_PUBLIC_SENTRY_DSN környezeti változót a valós Sentry DSN-nel.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}