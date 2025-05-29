'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const priorities = [
  { value: 'LOW', label: 'Alacsony' },
  { value: 'MEDIUM', label: 'Közepes' },
  { value: 'HIGH', label: 'Magas' },
  { value: 'URGENT', label: 'Sürgős' },
]

const categories = [
  { value: 'PLUMBING', label: 'Vízszerelés' },
  { value: 'ELECTRICAL', label: 'Villanyszerelés' },
  { value: 'HVAC', label: 'Fűtés/Klíma' },
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

export default function EditIssuePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
  const { id } = use(params)

  const { data: issue, isLoading } = api.issue.getById.useQuery(id)
  const updateMutation = api.issue.update.useMutation({
    onSuccess: () => {
      alert('A hibabejelentés sikeresen frissítve!')
      router.push(`/dashboard/issues/${id}`)
    },
    onError: (error) => {
      alert(`Hiba történt: ${error.message}`)
    },
  })

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as any,
    category: 'OTHER' as any,
    status: 'OPEN' as any,
    photos: [] as string[],
  })

  // Frissítjük a form adatokat amikor betöltődik a hibabejelentés
  useEffect(() => {
    if (issue) {
      setFormData({
        title: issue.title || '',
        description: issue.description || '',
        priority: issue.priority,
        category: issue.category,
        status: issue.status,
        photos: issue.photos || [],
      })
    }
  }, [issue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    updateMutation.mutate({
      id,
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      category: formData.category,
      status: formData.status,
      photos: formData.photos,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Betöltés...</div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Hibabejelentés nem található</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/issues/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Hibabejelentés szerkesztése</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Hibabejelentés adatai</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Cím *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Leírás</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                placeholder="Részletes leírás a problémáról..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioritás *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                >
                  <SelectTrigger id="priority">
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
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Státusz</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger id="status">
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

            <div>
              <Label>Képek</Label>
              <ImageUpload
                value={formData.photos}
                onChange={(photos) => setFormData({ ...formData, photos })}
                maxFiles={5}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Mentés...' : 'Mentés'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/issues/${id}`)}
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