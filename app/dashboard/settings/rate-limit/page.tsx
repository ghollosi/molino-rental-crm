'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertCircle, CheckCircle2, Activity, Clock, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function RateLimitTestPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const testEndpoint = async (endpoint: string, method: string = 'GET', expectedLimit: number) => {
    const results: any[] = []
    setIsLoading(true)

    try {
      // Make multiple requests to test rate limiting
      for (let i = 0; i < expectedLimit + 2; i++) {
        const start = Date.now()
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: method === 'POST' ? JSON.stringify({ test: true }) : undefined,
        })

        const elapsed = Date.now() - start
        const headers: any = {}
        response.headers.forEach((value, key) => {
          if (key.toLowerCase().includes('ratelimit') || key.toLowerCase() === 'retry-after') {
            headers[key] = value
          }
        })

        results.push({
          request: i + 1,
          status: response.status,
          statusText: response.statusText,
          elapsed: `${elapsed}ms`,
          headers,
          rateLimited: response.status === 429,
        })

        // If rate limited, stop making requests
        if (response.status === 429) {
          const data = await response.json()
          results[results.length - 1].message = data.message
          results[results.length - 1].retryAfter = data.retryAfter
          break
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setTestResults(results)
      
      const rateLimited = results.some(r => r.rateLimited)
      if (rateLimited) {
        toast.success('Rate limiting működik! A kérések korlátozva vannak.')
      } else {
        toast.warning('Rate limiting nem aktiválódott a tesztnél.')
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Hiba történt a teszt során')
    } finally {
      setIsLoading(false)
    }
  }

  const endpoints = [
    { name: 'API Health Check', path: '/api/health-check', method: 'GET', limit: 10 },
    { name: 'Auth Session', path: '/api/auth/session', method: 'GET', limit: 100 },
    { name: 'Export Endpoint', path: '/api/export/html?type=properties&list=true', method: 'GET', limit: 20 },
    { name: 'Email Test', path: '/api/test-email', method: 'POST', limit: 3 },
    { name: 'tRPC Endpoint', path: '/api/trpc/user.getCurrentUser', method: 'GET', limit: 60 },
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rate Limiting Teszt</h1>
        <p className="text-gray-600">
          API végpontok rate limiting tesztelése
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Rate Limiting Állapot</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Aktív</p>
                  <p className="text-sm text-green-700">Middleware konfigurálva</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">LRU Cache</p>
                  <p className="text-sm text-blue-700">In-memory tárolás</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                <Zap className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Adaptív</p>
                  <p className="text-sm text-purple-700">Útvonal alapú limitek</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limit Konfigurációk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">API Routes</p>
                  <p className="text-gray-600">10 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">Auth Routes</p>
                  <p className="text-gray-600">30 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">Session Routes</p>
                  <p className="text-gray-600">100 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">Upload</p>
                  <p className="text-gray-600">5 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">Export</p>
                  <p className="text-gray-600">20 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">3 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">tRPC</p>
                  <p className="text-gray-600">60 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">Cron</p>
                  <p className="text-gray-600">1 req/perc</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">IP alapú</p>
                  <p className="text-gray-600">Egyedi limit</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Tesztelés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Válassz egy végpontot a rate limiting teszteléséhez. A teszt több kérést fog küldeni, hogy ellenőrizze a limiteket.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.path} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{endpoint.name}</p>
                      <p className="text-sm text-gray-600">{endpoint.path} ({endpoint.method})</p>
                      <p className="text-xs text-gray-500">Limit: {endpoint.limit} req/perc</p>
                    </div>
                    <Button
                      onClick={() => testEndpoint(endpoint.path, endpoint.method, endpoint.limit)}
                      disabled={isLoading}
                      size="sm"
                    >
                      Teszt
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Teszt Eredmények</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kérés</th>
                      <th className="text-left p-2">Státusz</th>
                      <th className="text-left p-2">Idő</th>
                      <th className="text-left p-2">Rate Limit Headers</th>
                      <th className="text-left p-2">Megjegyzés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((result, idx) => (
                      <tr key={idx} className={`border-b ${result.rateLimited ? 'bg-red-50' : ''}`}>
                        <td className="p-2">#{result.request}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            result.rateLimited ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {result.status} {result.statusText}
                          </span>
                        </td>
                        <td className="p-2">{result.elapsed}</td>
                        <td className="p-2">
                          {Object.entries(result.headers).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{key}:</span> {value as string}
                            </div>
                          ))}
                        </td>
                        <td className="p-2">
                          {result.rateLimited && (
                            <div className="text-xs">
                              <p className="text-red-600 font-medium">Rate limited!</p>
                              {result.retryAfter && (
                                <p>Retry after: {result.retryAfter}s</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}