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
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/ui/image-upload'

export default function CreateOwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    // Új mezők
    isCompany: false,
    companyName: '',
    taxNumber: '',
    billingStreet: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: 'Magyarország',
  })
  const [documents, setDocuments] = useState<string[]>([])

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
      const response = await fetch('/api/standalone-create-owner', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          // Új mezők
          isCompany: formData.isCompany,
          companyName: formData.isCompany ? formData.companyName.trim() : undefined,
          taxNumber: formData.taxNumber.trim() || undefined,
          billingStreet: formData.billingStreet.trim() || undefined,
          billingCity: formData.billingCity.trim() || undefined,
          billingPostalCode: formData.billingPostalCode.trim() || undefined,
          billingCountry: formData.billingCountry.trim() || undefined,
          documents: documents.filter(doc => !doc.startsWith('blob:')),
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setSuccess(true)
        setError('')
        setTimeout(() => {
          router.push('/dashboard/owners')
        }, 2000)
      } else {
        const errorMsg = data.error || 'Hiba történt a tulajdonos létrehozásánál'
        setError(errorMsg)
      }
    } catch (error) {
      setError('Hálózati hiba történt. Kérlek próbáld újra.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
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
                />
              </div>

              <div className="pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCompany"
                    checked={formData.isCompany}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isCompany: checked as boolean }))
                    }
                    disabled={loading}
                  />
                  <Label 
                    htmlFor="isCompany" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Ez egy cég
                  </Label>
                </div>
              </div>

              {formData.isCompany && (
                <div>
                  <Label htmlFor="companyName">Cég neve *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Példa Kft."
                    required={formData.isCompany}
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="taxNumber">Adószám</Label>
                <Input
                  id="taxNumber"
                  value={formData.taxNumber}
                  onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                  placeholder="12345678-1-42"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-medium">Számlázási cím</h3>
              
              <div>
                <Label htmlFor="billingStreet">Utca, házszám</Label>
                <Input
                  id="billingStreet"
                  value={formData.billingStreet}
                  onChange={(e) => handleInputChange('billingStreet', e.target.value)}
                  placeholder="Példa utca 123"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingCity">Város</Label>
                  <Input
                    id="billingCity"
                    value={formData.billingCity}
                    onChange={(e) => handleInputChange('billingCity', e.target.value)}
                    placeholder="Budapest"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="billingPostalCode">Irányítószám</Label>
                  <Input
                    id="billingPostalCode"
                    value={formData.billingPostalCode}
                    onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                    placeholder="1234"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="billingCountry">Ország</Label>
                <Input
                  id="billingCountry"
                  value={formData.billingCountry}
                  onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                  placeholder="Magyarország"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-medium">Okmányok</h3>
              <p className="text-sm text-muted-foreground">
                Töltse fel a tulajdonos okmányainak fényképeit
              </p>
              <ImageUpload
                value={documents}
                onChange={setDocuments}
                maxFiles={5}
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
              💡 <strong>Tudnivalók:</strong> Az új tulajdonos automatikusan OWNER szerepkört kap 
              és bejelentkezhet a megadott email és jelszó kombinációval.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}