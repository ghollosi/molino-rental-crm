'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CreateTestPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })

  const createOwner = api.owner.quickCreate.useMutation({
    onSuccess: (data) => {
      setStatus('success')
      setMessage(`✅ Siker! Tulajdonos létrehozva: ${data.user.email}`)
      setTimeout(() => {
        router.push('/dashboard/owners')
      }, 2000)
    },
    onError: (error) => {
      setStatus('error')
      setMessage(`❌ Hiba: ${error.message}`)
      console.error('Create error:', error)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('Tulajdonos létrehozása...')
    
    await createOwner.mutateAsync(formData)
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
          <CardTitle>Tulajdonos létrehozás teszt - QuickCreate API</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ez az oldal közvetlenül az owner.quickCreate API-t hívja
            </AlertDescription>
          </Alert>

          {status !== 'idle' && (
            <Alert 
              variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'default'}
              className="mb-6"
            >
              {status === 'success' && <CheckCircle className="h-4 w-4" />}
              {status === 'error' && <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Név *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Jelszó *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full"
            >
              {status === 'loading' ? 'Létrehozás...' : 'Tulajdonos létrehozása'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}