'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, User, Building, Mail, Bell, Shield, AlertCircle, CheckCircle, Smartphone, Workflow, Cloud } from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import { api } from '@/lib/trpc/client'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  
  // Get current user data from database
  const { data: currentUser } = api.user.getCurrentUser.useQuery(undefined, {
    enabled: !!session?.user?.id
  })

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser && !isFormInitialized) {
      setProfileData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      })
      setIsFormInitialized(true)
    }
  }, [currentUser, isFormInitialized])

  const updateUserMutation = api.user.update.useMutation({
    onSuccess: async (updatedUser) => {
      console.log('User updated successfully:', updatedUser)
      
      toast({
        title: "Siker",
        description: "Profil sikeresen frissítve!",
      })
      setSuccess('Profil beállítások sikeresen mentve!')
      
      // Update NextAuth session immediately
      console.log('Updating NextAuth session with new data...')
      
      try {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: `${updatedUser.firstName} ${updatedUser.lastName}`,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            phone: updatedUser.phone,
          }
        })
        
        console.log('Session updated successfully')
        
        // Update local form data too
        setProfileData({
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || ''
        })
        
        toast({
          title: "Kész!",
          description: "A profil frissítése megtörtént!",
        })
        
      } catch (error) {
        console.error('Session update failed:', error)
        toast({
          title: "Figyelmeztetés",
          description: "Az adatok mentve, de a session frissítése sikertelen. Töltse újra az oldalt.",
          variant: "destructive"
        })
      }
    },
    onError: (error) => {
      console.error('Update error:', error)
      
      if (error.message.includes('not found') || error.message.includes('No record was found') || error.message.includes('Session user not found')) {
        toast({
          title: "Session hiba",
          description: "A session lejárt vagy érvénytelen. Jelentkezzen be újra.",
          variant: "destructive"
        })
        setError('Session hiba - kérjük jelentkezzen be újra')
        
        // Offer logout after 3 seconds
        setTimeout(() => {
          if (confirm('A session lejárt. Szeretne kijelentkezni és újra bejelentkezni?')) {
            signOut({ callbackUrl: '/login' })
          }
        }, 3000)
      } else {
        toast({
          title: "Hiba",
          description: "Profil frissítés sikertelen: " + error.message,
          variant: "destructive"
        })
        setError('Profil frissítés sikertelen')
      }
    }
  })

  const handleSave = async (section: string) => {
    setError(null)
    
    if (section === 'Profil') {
      console.log('=== PROFILE SAVE DEBUG ===')
      console.log('Session:', session)
      console.log('Session user ID:', session?.user?.id)
      console.log('Profile data:', profileData)
      
      if (!session?.user?.id) {
        setError('Felhasználó azonosító hiányzik. Kérjük jelentkezzen be újra.')
        toast({
          title: "Hiba",
          description: "Felhasználó azonosító hiányzik. Kérjük jelentkezzen be újra.",
          variant: "destructive"
        })
        return
      }

      const updateData = {
        id: session.user.id,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone || undefined
      }
      
      console.log('Update data to send:', updateData)

      try {
        const result = await updateUserMutation.mutateAsync(updateData)
        console.log('Update result:', result)
      } catch (error) {
        console.error('Update error:', error)
        // Error is handled in onError callback
      }
    } else {
      // For other sections, show mock success for now
      setSuccess(`${section} beállítások sikeresen mentve!`)
      setTimeout(() => setSuccess(null), 3000)
    }
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Cég</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Értesítések</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center space-x-2">
            <Workflow className="h-4 w-4" />
            <span>Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="cloud-storage" className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <span>Cloud Storage</span>
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
              {error && error.includes('Session hiba') && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Session hiba:</strong> Az adatbázis frissítése után a session érvénytelen lett. 
                    Kérjük <button 
                      onClick={() => signOut({ callbackUrl: '/login' })} 
                      className="underline font-medium hover:text-orange-900"
                    >
                      jelentkezzen ki és be újra
                    </button> a profil frissítéséhez.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Keresztnév</Label>
                  <Input 
                    id="firstName" 
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Vezetéknév</Label>
                  <Input 
                    id="lastName" 
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">E-mail cím</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefonszám</Label>
                <Input 
                  id="phone" 
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
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
              
              <Button 
                onClick={() => handleSave('Profil')}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Mentés...' : 'Változások mentése'}
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

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email beállítások</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Email szolgáltatás aktiválva</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Az email értesítések sikeresen konfigurálva. Resend szolgáltatás használatban.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Automatikus értesítések</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>🔧 Új hibabejelentés</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>🔄 Státusz változás</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>👷 Feladat hozzárendelés</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>🏠 Üdvözlő email</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Email tesztelés</h4>
                  <p className="text-sm text-gray-600">
                    Tesztelje az email értesítések működését a dedikált tesztelő felületen.
                  </p>
                  <Link href="/dashboard/settings/email">
                    <Button className="w-full">
                      Email teszt oldal megnyitása
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings/pdf">
                    <Button variant="outline" className="w-full">
                      PDF teszt oldal megnyitása
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings/pwa">
                    <Button variant="outline" className="w-full">
                      PWA beállítások
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings/workflow">
                    <Button variant="outline" className="w-full">
                      Workflow automatizáció
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">Email konfiguráció</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Szolgáltató</Label>
                    <div className="font-mono text-gray-600">Resend</div>
                  </div>
                  <div>
                    <Label>Feladó email</Label>
                    <div className="font-mono text-gray-600">noreply@molino-rental.com</div>
                  </div>
                  <div>
                    <Label>Fejlesztői mód</Label>
                    <div className="font-mono text-gray-600">
                      {process.env.NODE_ENV === 'development' ? 'Igen' : 'Nem'}
                    </div>
                  </div>
                  <div>
                    <Label>Email státusz</Label>
                    <div className="font-mono text-green-600">Működik</div>
                  </div>
                </div>
              </div>
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

        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Workflow className="h-5 w-5" />
                <span>Workflow automatizáció</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Automatikus hibabejelentés kezelés</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  A rendszer automatikusan kezeli a hibabejelentések állapotait, eszkalációkat és SLA követést.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Aktív workflow szabályok</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>🚨 Sürgős hibák kezelése</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>⏰ Időalapú eszkaláció</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>📸 Képes hibák prioritása</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>✅ Automatikus lezárás</span>
                      <span className="text-green-600 font-medium">Aktív</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">SLA határidők</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span>URGENT prioritás</span>
                      <span className="text-red-600 font-medium">2 óra</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span>HIGH prioritás</span>
                      <span className="text-orange-600 font-medium">8 óra</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span>MEDIUM prioritás</span>
                      <span className="text-yellow-600 font-medium">24 óra</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span>LOW prioritás</span>
                      <span className="text-green-600 font-medium">72 óra</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Workflow kezelés</h4>
                <p className="text-sm text-gray-600">
                  Részletes workflow beállítások, statisztikák és SLA követés a dedikált admin felületen.
                </p>
                <Link href="/dashboard/settings/workflow">
                  <Button className="w-full">
                    Workflow admin felület megnyitása
                  </Button>
                </Link>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">Workflow működése</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• <strong>Automatikus triggerek:</strong> Hibabejelentés létrehozása, hozzárendelés, kép feltöltése</p>
                  <p>• <strong>Időalapú ellenőrzés:</strong> Eszkaláció és SLA követés óránként</p>
                  <p>• <strong>Email értesítések:</strong> Automatikus értesítések tulajdonosoknak és szolgáltatóknak</p>
                  <p>• <strong>Statisztikák:</strong> Teljesítmény mérés és jelentések</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloud-storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="h-5 w-5" />
                <span>Cloud Storage beállítások</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Cloud className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Cloudflare R2 Storage</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Teljes fájlkezelési rendszer feltöltéssel, letöltéssel és tárolóstatisztikákkal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Konfiguráció</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>☁️ R2 Endpoint</span>
                      <span className="text-green-600 font-medium">Konfigurálva</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>🔑 Access Keys</span>
                      <span className="text-green-600 font-medium">Konfigurálva</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>🪣 R2 Bucket</span>
                      <span className="text-green-600 font-medium">molino-rental-uploads</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>📡 Connection</span>
                      <span className="text-yellow-600 font-medium">Tesztelés szükséges</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Funkciók</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>📤 Fájl feltöltés</span>
                      <span className="text-green-600 font-medium">Elérhető</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>📥 Fájl letöltés</span>
                      <span className="text-green-600 font-medium">Elérhető</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>🗂️ Fájl kezelés</span>
                      <span className="text-green-600 font-medium">Elérhető</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>📊 Statisztikák</span>
                      <span className="text-green-600 font-medium">Elérhető</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Cloud Storage kezelő felület</h4>
                <p className="text-sm text-gray-600">
                  Teljes R2 storage kezelés: kapcsolat tesztelése, fájl feltöltés, letöltés, törlés és statisztikák.
                </p>
                <Link href="/dashboard/settings/cloud-storage">
                  <Button className="w-full">
                    Cloud Storage kezelő megnyitása
                  </Button>
                </Link>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-3">R2 beállítások</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Provider</Label>
                    <div className="font-mono text-gray-600">Cloudflare R2</div>
                  </div>
                  <div>
                    <Label>S3 kompatibilitás</Label>
                    <div className="font-mono text-gray-600">Igen</div>
                  </div>
                  <div>
                    <Label>Maximális fájlméret</Label>
                    <div className="font-mono text-gray-600">50MB</div>
                  </div>
                  <div>
                    <Label>Támogatott formátumok</Label>
                    <div className="font-mono text-gray-600">Minden típus</div>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSave('Cloud Storage')}>
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