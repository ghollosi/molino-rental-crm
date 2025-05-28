'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/src/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { trpc } from '@/src/lib/trpc'
import { Plus, Edit, Trash2, Eye, Copy } from 'lucide-react'
import { ContractTemplateCategory } from '@prisma/client'
import { useToast } from '@/src/hooks/use-toast'

const categoryLabels = {
  RENTAL: 'Bérleti szerződés',
  LEASE: 'Lízingszerződés',
  SUBLEASE: 'Albérleti szerződés',
  COMMERCIAL: 'Kereskedelmi bérlét',
  STORAGE: 'Raktározási szerződés',
  PARKING: 'Parkolási szerződés',
  OTHER: 'Egyéb'
}

export default function ContractTemplatesPage() {
  const { toast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [previewTemplate, setPreviewTemplate] = useState<any>(null)

  const { data: templates, isLoading, refetch } = trpc.contracts.getTemplates.useQuery()
  const createTemplate = trpc.contracts.createTemplate.useMutation({
    onSuccess: () => {
      refetch()
      setIsCreateOpen(false)
      toast({ title: 'Siker', description: 'Sablon sikeresen létrehozva!' })
    },
    onError: (error) => {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' })
    }
  })
  const updateTemplate = trpc.contracts.updateTemplate.useMutation({
    onSuccess: () => {
      refetch()
      setEditingTemplate(null)
      toast({ title: 'Siker', description: 'Sablon sikeresen frissítve!' })
    },
    onError: (error) => {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' })
    }
  })
  const deleteTemplate = trpc.contracts.deleteTemplate.useMutation({
    onSuccess: () => {
      refetch()
      toast({ title: 'Siker', description: 'Sablon sikeresen törölve!' })
    },
    onError: (error) => {
      toast({ title: 'Hiba', description: error.message, variant: 'destructive' })
    }
  })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: 'RENTAL' as ContractTemplateCategory,
    isActive: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const variables = {
      propertyName: { type: 'string', description: 'Ingatlan neve' },
      propertyAddress: { type: 'string', description: 'Ingatlan címe' },
      landlordName: { type: 'string', description: 'Bérbeadó neve' },
      landlordAddress: { type: 'string', description: 'Bérbeadó címe' },
      tenantName: { type: 'string', description: 'Bérlő neve' },
      tenantAddress: { type: 'string', description: 'Bérlő címe' },
      rentAmount: { type: 'number', description: 'Bérleti díj' },
      deposit: { type: 'number', description: 'Kaució' },
      startDate: { type: 'date', description: 'Szerződés kezdete' },
      endDate: { type: 'date', description: 'Szerződés vége' },
      contractDate: { type: 'date', description: 'Szerződéskötés dátuma' },
    }

    if (editingTemplate) {
      updateTemplate.mutate({
        id: editingTemplate.id,
        ...formData,
        variables,
      })
    } else {
      createTemplate.mutate({
        ...formData,
        variables,
      })
    }
  }

  const openEditDialog = (template: any) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
      category: template.category,
      isActive: template.isActive,
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      category: 'RENTAL',
      isActive: true,
    })
    setEditingTemplate(null)
  }

  const duplicateTemplate = (template: any) => {
    setFormData({
      name: `${template.name} (másolat)`,
      description: template.description || '',
      content: template.content,
      category: template.category,
      isActive: true,
    })
    setIsCreateOpen(true)
  }

  const getDefaultTemplate = () => {
    return `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1 style="text-align: center; color: #333;">BÉRLETI SZERZŐDÉS</h1>
  
  <p><strong>Szerződéskötés dátuma:</strong> {{contractDate}}</p>
  
  <h2>Szerződő felek:</h2>
  
  <h3>Bérbeadó:</h3>
  <p><strong>Név:</strong> {{landlordName}}</p>
  <p><strong>Cím:</strong> {{landlordAddress}}</p>
  
  <h3>Bérlő:</h3>
  <p><strong>Név:</strong> {{tenantName}}</p>
  <p><strong>Cím:</strong> {{tenantAddress}}</p>
  
  <h2>Bérlemény adatai:</h2>
  <p><strong>Ingatlan neve:</strong> {{propertyName}}</p>
  <p><strong>Cím:</strong> {{propertyAddress}}</p>
  
  <h2>Szerződés feltételei:</h2>
  <p><strong>Bérleti díj:</strong> {{rentAmount}} Ft/hó</p>
  <p><strong>Kaució:</strong> {{deposit}} Ft</p>
  <p><strong>Szerződés időtartama:</strong> {{startDate}} - {{endDate}}</p>
  
  <div style="margin-top: 50px;">
    <div style="display: flex; justify-content: space-between;">
      <div>
        <p>_________________________</p>
        <p>Bérbeadó aláírása</p>
      </div>
      <div>
        <p>_________________________</p>
        <p>Bérlő aláírása</p>
      </div>
    </div>
  </div>
</div>`
  }

  if (isLoading) {
    return <div className="p-6">Betöltés...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Szerződés sablonok</h1>
          <p className="text-muted-foreground">Szerződés sablonok kezelése és új sablonok létrehozása</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Új sablon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Sablon szerkesztése' : 'Új sablon létrehozása'}</DialogTitle>
              <DialogDescription>
                Hozzon létre új szerződés sablont változókkal. Használja a {'{{változónév}}'} formátumot.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Sablon neve</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Kategória</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ContractTemplateCategory })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Leírás</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="content">Sablon tartalom (HTML)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder={getDefaultTemplate()}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Elérhető változók: {'{propertyName}, {propertyAddress}, {landlordName}, {landlordAddress}, {tenantName}, {tenantAddress}, {rentAmount}, {deposit}, {startDate}, {endDate}, {contractDate}'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Aktív sablon</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateOpen(false)
                  resetForm()
                }}>
                  Mégse
                </Button>
                <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                  {editingTemplate ? 'Frissítés' : 'Létrehozás'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Aktív' : 'Inaktív'}
                    </Badge>
                    <Badge variant="outline">
                      {categoryLabels[template.category as keyof typeof categoryLabels]}
                    </Badge>
                  </CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateTemplate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Biztosan törölni szeretné ezt a sablont?')) {
                        deleteTemplate.mutate({ id: template.id })
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Létrehozva: {new Date(template.createdAt).toLocaleDateString('hu-HU')}
              </p>
              <p className="text-sm text-muted-foreground">
                Utoljára módosítva: {new Date(template.updatedAt).toLocaleDateString('hu-HU')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sablon szerkesztése</DialogTitle>
            <DialogDescription>
              Módosítsa a sablon tulajdonságait és tartalmát.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Sablon neve</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-category">Kategória</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ContractTemplateCategory })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Leírás</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-content">Sablon tartalom (HTML)</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={20}
                className="font-mono text-sm"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Aktív sablon</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Mégse
              </Button>
              <Button type="submit" disabled={updateTemplate.isPending}>
                Frissítés
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sablon előnézet: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              A sablon megjelenítése minta adatokkal.
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div 
              className="border rounded p-4 bg-white"
              dangerouslySetInnerHTML={{
                __html: previewTemplate.content
                  .replace(/\{\{propertyName\}\}/g, 'Minta Ingatlan')
                  .replace(/\{\{propertyAddress\}\}/g, '1234 Budapest, Minta utca 56.')
                  .replace(/\{\{landlordName\}\}/g, 'Kovács János')
                  .replace(/\{\{landlordAddress\}\}/g, '1111 Budapest, Bérbeadó utca 12.')
                  .replace(/\{\{tenantName\}\}/g, 'Nagy Péter')
                  .replace(/\{\{tenantAddress\}\}/g, '2222 Budapest, Bérlő utca 34.')
                  .replace(/\{\{rentAmount\}\}/g, '150,000')
                  .replace(/\{\{deposit\}\}/g, '300,000')
                  .replace(/\{\{startDate\}\}/g, '2024.01.01')
                  .replace(/\{\{endDate\}\}/g, '2024.12.31')
                  .replace(/\{\{contractDate\}\}/g, '2023.12.15')
              }}
            />
          )}
          
          <div className="flex justify-end">
            <Button onClick={() => setPreviewTemplate(null)}>
              Bezárás
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}