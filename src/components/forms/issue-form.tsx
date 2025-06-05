'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, AlertCircle, User, Plus, Save, Sparkles } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { analyzeIssueWithAI } from '@/lib/ai-categorization'

interface IssueFormData {
  title: string
  description: string
  priority: string
  category: string
  status?: string
  propertyId: string
  photos?: string[]
}

interface IssueFormProps {
  mode: 'create' | 'edit'
  issueId?: string
  onSuccess?: (issueId: string) => void
  onCancel?: () => void
}

const priorities = [
  { value: 'URGENT', label: 'Sürgős' },
  { value: 'HIGH', label: 'Magas' },
  { value: 'MEDIUM', label: 'Közepes' },
  { value: 'LOW', label: 'Alacsony' },
]

const categories = [
  { value: 'PLUMBING', label: 'Vízvezeték' },
  { value: 'ELECTRICAL', label: 'Elektromos' },
  { value: 'HVAC', label: 'Fűtés/Hűtés' },
  { value: 'STRUCTURAL', label: 'Szerkezeti' },
  { value: 'OTHER', label: 'Egyéb' },
]

const statuses = [
  { value: 'OPEN', label: 'Nyitva' },
  { value: 'ASSIGNED', label: 'Kiosztva' },
  { value: 'IN_PROGRESS', label: 'Folyamatban' },
  { value: 'COMPLETED', label: 'Befejezve' },
  { value: 'CLOSED', label: 'Lezárva' },
]

export function IssueForm({ mode, issueId, onSuccess, onCancel }: IssueFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])

  // Csak szerkesztési módban töltjük be a meglévő adatokat
  const { data: issue, isLoading } = api.issue.getById.useQuery(issueId!, {
    enabled: mode === 'edit' && !!issueId,
  })

  // Felhasználó adatainak lekérdezése
  const { data: currentUser } = api.user.getCurrentUser.useQuery()

  // Ingatlanok lekérdezése
  const { data: properties } = api.property.list.useQuery({ 
    page: 1, 
    limit: 100
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<IssueFormData>({
    defaultValues: {
      priority: 'MEDIUM',
      status: 'OPEN',
      title: '',
      description: '',
      category: '',
      propertyId: '',
    }
  })

  // Adatok betöltése szerkesztési módban
  useEffect(() => {
    if (mode === 'edit' && issue) {
      const formData = {
        title: issue.title || '',
        description: issue.description || '',
        priority: issue.priority,
        category: issue.category,
        status: issue.status,
        propertyId: issue.propertyId,
      }
      
      reset(formData)
      setPhotos(issue.photos || [])
    }
  }, [issue, mode, reset])

  const createIssue = api.issue.create.useMutation({
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data.id)
      } else {
        router.push('/dashboard/issues')
      }
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const updateIssue = api.issue.update.useMutation({
    onSuccess: () => {
      if (onSuccess && issueId) {
        onSuccess(issueId)
      } else {
        router.push(`/dashboard/issues/${issueId}`)
      }
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const onSubmit = async (data: IssueFormData) => {
    setError(null)

    if (mode === 'create') {
      await createIssue.mutateAsync({
        title: data.title,
        description: data.description,
        priority: data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        propertyId: data.propertyId,
        category: data.category as 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'OTHER',
        photos: photos
      })
    } else if (mode === 'edit' && issueId) {
      await updateIssue.mutateAsync({
        id: issueId,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        category: data.category as 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'OTHER',
        status: data.status as 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED',
        photos: photos,
      })
    }
  }

  const watchDescription = watch('description')

  // AI kategorizálás a leírás alapján
  const handleAIAnalyze = async () => {
    if (!watchDescription) {
      setError('Kérjük, először írja le a hibát!')
      return
    }

    try {
      const analysis = await analyzeIssueWithAI(watchDescription)
      setValue('category', analysis.category.category)
      setValue('priority', analysis.priority.priority)
      
      // Visszajelzés a felhasználónak
      alert(`AI elemzés kész!\n\nKategória: ${analysis.category.category}\nPrioritás: ${analysis.priority.priority}\n\nIndoklás: ${analysis.category.reasoning}`)
    } catch (error) {
      setError('AI elemzés sikertelen. Próbálja újra!')
    }
  }

  // Betöltés állapot
  if (mode === 'edit' && isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  // Hibaállapot szerkesztéskor
  if (mode === 'edit' && !isLoading && !issue) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Hibabejelentés nem található</div>
      </div>
    )
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (mode === 'edit' && issueId) {
      router.push(`/dashboard/issues/${issueId}`)
    } else {
      router.push('/dashboard/issues')
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vissza
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Új hibabejelentés' : 'Hibabejelentés szerkesztése'}
          </CardTitle>
          {mode === 'create' && currentUser && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <User className="h-4 w-4" />
              <span>Bejelentő: {currentUser.firstName} {currentUser.lastName} ({currentUser.email})</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Cím *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'A cím megadása kötelező' })}
                  placeholder="Rövid leírás a hibáról"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Részletes leírás *</Label>
                <div className="space-y-2">
                  <Textarea
                    id="description"
                    {...register('description', { required: 'A leírás megadása kötelező' })}
                    placeholder="Részletes leírás a hibáról..."
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                  {mode === 'create' && watchDescription && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAIAnalyze}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI elemzés
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioritás *</Label>
                  <Select
                    value={watch('priority')}
                    onValueChange={(value) => setValue('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Kategória *</Label>
                  <Select
                    value={watch('category')}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon kategóriát" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {mode === 'edit' && (
                <div>
                  <Label htmlFor="status">Státusz</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {mode === 'create' && (
                <div>
                  <Label htmlFor="propertyId">Ingatlan *</Label>
                  <Select
                    value={watch('propertyId')}
                    onValueChange={(value) => setValue('propertyId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon ingatlant" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.street}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyId && (
                    <p className="text-sm text-red-500 mt-1">{errors.propertyId.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label>Képek {mode === 'create' ? '(opcionális)' : ''}</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Töltsön fel képeket a hibáról a jobb dokumentálás érdekében
                </p>
                <ImageUpload
                  value={photos}
                  onChange={setPhotos}
                  maxFiles={5}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || createIssue.isPending || updateIssue.isPending}
              >
                {mode === 'create' ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Létrehozás...' : 'Hibabejelentés létrehozása'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Mentés...' : 'Mentés'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Mégse
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}