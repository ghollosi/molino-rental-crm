'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Plus, FileText, Pencil, Trash2, Copy, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import LoadingSpinner from '@/components/loading-spinner'

const typeLabels = {
  RENTAL: 'Bérleti',
  MAINTENANCE: 'Karbantartási',
  OPERATION: 'Üzemeltetési',
  MEDIATION: 'Közvetítői',
  CUSTOM: 'Egyéni',
}

const typeColors = {
  RENTAL: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-green-100 text-green-800',
  OPERATION: 'bg-purple-100 text-purple-800',
  MEDIATION: 'bg-orange-100 text-orange-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
}

export default function ContractTemplatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, refetch } = api.contractTemplate.list.useQuery({
    search: search || undefined,
    type: selectedType !== 'all' ? selectedType as any : undefined,
    limit: 100,
  })

  const deleteMutation = api.contractTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success('Sablon sikeresen törölve')
      setDeleteId(null)
      refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Hiba történt a törlés során')
    },
  })

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Szerződés sablonok</h1>
          <p className="text-muted-foreground">Kezelje a rendszerben elérhető szerződés sablonokat</p>
        </div>
        <Button onClick={() => router.push('/dashboard/contracts/templates/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Új sablon
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Keresés név vagy leírás alapján..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Összes típus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes típus</SelectItem>
            <SelectItem value="RENTAL">Bérleti</SelectItem>
            <SelectItem value="MAINTENANCE">Karbantartási</SelectItem>
            <SelectItem value="OPERATION">Üzemeltetési</SelectItem>
            <SelectItem value="MEDIATION">Közvetítői</SelectItem>
            <SelectItem value="CUSTOM">Egyéni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={typeColors[template.type]}>
                      {typeLabels[template.type]}
                    </Badge>
                    {template.isSystem && (
                      <Badge variant="secondary">Rendszer</Badge>
                    )}
                    {!template.isActive && (
                      <Badge variant="destructive">Inaktív</Badge>
                    )}
                  </div>
                </div>
              </div>
              {template.description && (
                <CardDescription className="mt-2">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {(template.variables as any[])?.length || 0} változó
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/contracts/templates/${template.id}/preview`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/contracts/templates/${template.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!template.isSystem && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sablon törlése</DialogTitle>
            <DialogDescription>
              Biztosan törölni szeretné ezt a sablont? Ez a művelet nem visszavonható.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Mégse
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Törlés...' : 'Törlés'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}