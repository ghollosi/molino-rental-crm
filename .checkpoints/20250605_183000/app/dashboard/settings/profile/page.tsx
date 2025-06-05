'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import { api } from '@/lib/trpc/client'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
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

  const handleSave = async () => {
    setError(null)
    
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
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Felhasználói profil</h1>
        <p className="text-gray-600">
          Személyes adatok és fiók beállítások kezelése
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profil adatok</span>
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
            onClick={handleSave}
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? 'Mentés...' : 'Változások mentése'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}