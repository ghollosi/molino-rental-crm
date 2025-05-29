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

export default function NewOwnerPage() {
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
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('Név, email és jelszó megadása kötelező')
      return
    }
    
    if (formData.password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      console.log('Sending owner creation request to DIRECT API...', new Date().toISOString())
      
      const response = await fetch('/api/create-owner-direct', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
        })
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok && data.success) {
        setSuccess(true)
        setError('')
        setTimeout(() => {
          router.push('/dashboard/owners')
        }, 2000)
      } else {
        const errorMsg = data.error || 'Hiba történt a tulajdonos létrehozásánál'
        setError(errorMsg)
        console.error('API error:', data)
      }
    } catch (error) {
      console.error('Network error:', error)
      setError('Hálózati hiba történt. Kérlek próbáld újra.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Clear error when user starts typing
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
          <CardTitle>🏠 Új tulajdonos regisztrálása</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Tulajdonos sikeresen létrehozva! Átirányítás a listához...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Név *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Teljes név"
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email cím *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="tulajdonos@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Jelszó *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Legalább 6 karakter"
                  required
                  disabled={loading}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+36 20 123 4567"
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
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
              💡 <strong>Tudnivalók:</strong> Az új tulajdonos automatikusan OWNER szerepkört kap 
              és bejelentkezhet a megadott email és jelszó kombinációval.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}