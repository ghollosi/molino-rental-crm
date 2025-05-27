'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, User, Building, Mail, Bell, Shield, AlertCircle, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = (section: string) => {
    // TODO: Implement actual save functionality
    setError(null)
    setSuccess(`${section} beállítások sikeresen mentve!`)
    setTimeout(() => setSuccess(null), 3000)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Beállítások</h1>
        <p className="text-gray-600">
          Rendszer és fiók beállítások kezelése
        </p>
      </div>

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Cég</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Értesítések</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Biztonság</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Felhasználói profil</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Keresztnév</Label>
                  <Input id="firstName" defaultValue="Admin" />
                </div>
                <div>
                  <Label htmlFor="lastName">Vezetéknév</Label>
                  <Input id="lastName" defaultValue="User" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">E-mail cím</Label>
                <Input id="email" type="email" defaultValue="admin@molino.com" />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefonszám</Label>
                <Input id="phone" defaultValue="+36 20 123 4567" />
              </div>
              
              <div>
                <Label htmlFor="language">Nyelv</Label>
                <Select defaultValue="hu">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hu">Magyar</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={() => handleSave('Profil')}>
                Változások mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Cég adatok</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Cégnév</Label>
                <Input id="companyName" defaultValue="Molino RENTAL Kft." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxNumber">Adószám</Label>
                  <Input id="taxNumber" defaultValue="12345678-1-42" />
                </div>
                <div>
                  <Label htmlFor="bankAccount">Bankszámlaszám</Label>
                  <Input id="bankAccount" defaultValue="12345678-12345678-12345678" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Cím</Label>
                <Input id="address" defaultValue="Váci út 1., 1133 Budapest" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyEmail">E-mail</Label>
                  <Input id="companyEmail" type="email" defaultValue="info@molino-rental.hu" />
                </div>
                <div>
                  <Label htmlFor="companyPhone">Telefon</Label>
                  <Input id="companyPhone" defaultValue="+36 1 234 5678" />
                </div>
              </div>
              
              <Button onClick={() => handleSave('Cég')}>
                Változások mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Értesítési beállítások</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">E-mail értesítések</div>
                    <div className="text-sm text-gray-500">Új hibabejelentések és ajánlatok</div>
                  </div>
                  <Button variant="outline" size="sm">Bekapcsolva</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sürgős hibabejelentések</div>
                    <div className="text-sm text-gray-500">Azonnali értesítés sürgős problémákról</div>
                  </div>
                  <Button variant="outline" size="sm">Bekapcsolva</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Havi jelentések</div>
                    <div className="text-sm text-gray-500">Automatikus havi összesítők</div>
                  </div>
                  <Button variant="outline" size="sm">Bekapcsolva</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Bérleti díj emlékeztetők</div>
                    <div className="text-sm text-gray-500">Értesítés lejáró bérleti díjakról</div>
                  </div>
                  <Button variant="outline" size="sm">Kikapcsolva</Button>
                </div>
              </div>
              
              <Button onClick={() => handleSave('Értesítési')}>
                Beállítások mentése
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Biztonsági beállítások</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Jelenlegi jelszó</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">Új jelszó</Label>
                  <Input id="newPassword" type="password" />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Új jelszó megerősítése</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Kétfaktoros hitelesítés</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">2FA státusz</div>
                    <div className="text-sm text-gray-500">Extra biztonság a fiókjához</div>
                  </div>
                  <Button variant="outline" size="sm">Bekapcsolás</Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={() => handleSave('Jelszó')}>
                  Jelszó megváltoztatása
                </Button>
                <Button variant="outline">
                  Aktív munkamenetek
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}