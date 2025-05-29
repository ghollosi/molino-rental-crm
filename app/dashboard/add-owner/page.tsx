'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AddOwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const response = await fetch('/api/trpc/owner.quickCreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "0": {
            "json": {
              name: formData.name,
              email: formData.email,
              password: formData.password,
              phone: formData.phone || undefined,
            }
          }
        })
      })

      const data = await response.json()
      console.log('Response:', data)
      
      if (response.ok && data[0]?.result?.data) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard/owners')
        }, 1500)
      } else {
        const errorMsg = data[0]?.error?.message || 'Hiba a tulajdonos létrehozásánál'
        setError(errorMsg)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Kapcsolati hiba')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/owners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a tulajdonosokhoz
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🏠 Új tulajdonos hozzáadása</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Tulajdonos sikeresen létrehozva! Átirányítás...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Név *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Teljes név"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="email">Email cím *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Jelszó *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Legalább 6 karakter"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+36 20 123 4567"
                disabled={loading}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.email || !formData.password}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Létrehozás...' : 'Tulajdonos létrehozása'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/owners')}
                disabled={loading}
              >
                Mégse
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tipp:</strong> Az új tulajdonos automatikusan OWNER szerepkört kap, 
              és meg fog jelenni a tulajdonosok listájában.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}