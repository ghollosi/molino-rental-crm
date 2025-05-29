'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TestCreatePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState<any>(null)

  const testCreate = api.owner.quickCreate.useMutation({
    onSuccess: (data) => {
      setStatus('success')
      setMessage(`✅ Sikeres! Tulajdonos létrehozva: ${data.user.email}`)
      setDetails(data)
      
      // Navigate to owners page after 3 seconds
      setTimeout(() => {
        router.push('/dashboard/owners')
      }, 3000)
    },
    onError: (error) => {
      setStatus('error')
      setMessage(`❌ Hiba: ${error.message}`)
      setDetails(error)
    },
  })

  const handleTest = async () => {
    setStatus('testing')
    setMessage('Teszt tulajdonos létrehozása...')
    
    const testEmail = `test-${Date.now()}@example.com`
    
    await testCreate.mutateAsync({
      name: 'Teszt Tulajdonos',
      email: testEmail,
      password: 'test123',
      phone: '+36 20 123 4567',
    })
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/owners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Tulajdonos létrehozás teszt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ez az oldal teszteli, hogy működik-e a tulajdonos létrehozás a production környezetben.
              </AlertDescription>
            </Alert>

            {status !== 'idle' && (
              <Alert variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'default'}>
                {status === 'success' && <CheckCircle className="h-4 w-4" />}
                {status === 'error' && <AlertCircle className="h-4 w-4" />}
                <AlertDescription>
                  <div>{message}</div>
                  {details && (
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(details, null, 2)}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTest}
              disabled={status === 'testing'}
              className="w-full"
            >
              {status === 'testing' ? 'Tesztelés...' : 'Teszt indítása'}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>A teszt során:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Létrehoz egy teszt tulajdonost véletlenszerű email címmel</li>
                <li>Ellenőrzi, hogy a tRPC API működik-e</li>
                <li>Sikeres létrehozás után átirányít a tulajdonosok listájára</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}