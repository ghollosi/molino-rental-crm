'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X, Send, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'

export default function CameraIssuePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [propertyId, setPropertyId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  // API queries
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100
  })

  const createIssue = api.issue.create.useMutation({
    onSuccess: () => {
      toast.success('Hibabejelentés sikeresen létrehozva!')
      router.push('/dashboard/issues')
    },
    onError: (error) => {
      toast.error('Hiba történt a bejelentés során')
      console.error('Issue creation error:', error)
    }
  })

  // Helymeghatározás
  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Location error:', error)
        }
      )
    }
  }, [])

  // Kép kezelés
  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!propertyId || !category || !description && images.length === 0) {
      toast.error('Kérjük töltse ki a kötelező mezőket vagy töltsön fel képet!')
      return
    }

    setIsSubmitting(true)
    try {
      // Itt lenne a képfeltöltés logika
      const uploadedImageUrls: string[] = []
      
      // Képek feltöltése
      for (const image of images) {
        // TODO: Implement actual image upload
        uploadedImageUrls.push(image)
      }

      await createIssue.mutateAsync({
        title: `${category} - Mobil bejelentés`,
        description: description || 'Képpel bejelentett hiba',
        category: category as any,
        priority: priority as any,
        propertyId,
        images: uploadedImageUrls,
        location: location ? `${location.lat},${location.lng}` : undefined
      })
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobil header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold">Gyors hibabejelentés</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Képfeltöltés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotók
            </CardTitle>
            <CardDescription>
              Készítsen fotót a hibáról vagy töltse fel a galériából
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Képek megjelenítése */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Hiba kép ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Feltöltés gombok */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleImageCapture}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Fotózás
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture')
                      fileInputRef.current.click()
                      setTimeout(() => {
                        fileInputRef.current?.setAttribute('capture', 'environment')
                      }, 100)
                    }
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Galéria
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alap információk */}
        <Card>
          <CardHeader>
            <CardTitle>Részletek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="property">Ingatlan *</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon ingatlant" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.items?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.street}, {property.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Kategória *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Válasszon kategóriát" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLUMBING">Vízvezeték</SelectItem>
                  <SelectItem value="ELECTRICAL">Elektromos</SelectItem>
                  <SelectItem value="HVAC">Fűtés/Légkondi</SelectItem>
                  <SelectItem value="STRUCTURAL">Szerkezeti</SelectItem>
                  <SelectItem value="OTHER">Egyéb</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Sürgősség</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Alacsony</SelectItem>
                  <SelectItem value="MEDIUM">Közepes</SelectItem>
                  <SelectItem value="HIGH">Magas</SelectItem>
                  <SelectItem value="URGENT">Sürgős</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Leírás (opcionális)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="További részletek a hibáról..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Helymeghatározás */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={getLocation}
              disabled={location !== null}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {location ? 'Helymeghatározás kész' : 'Helymeghatározás'}
            </Button>
            {location && (
              <p className="text-sm text-gray-600 mt-2 text-center">
                GPS koordináták rögzítve
              </p>
            )}
          </CardContent>
        </Card>

        {/* Információ */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A képek és helymeghatározás segít a szolgáltatóknak gyorsabban megtalálni és megoldani a problémát.
          </AlertDescription>
        </Alert>

        {/* Küldés gomb */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting || !propertyId || !category || (images.length === 0 && !description)}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Küldés...' : 'Hibabejelentés küldése'}
        </Button>
      </div>
    </div>
  )
}