'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/loading-spinner'

const typeLabels = {
  RENTAL: 'Bérleti',
  MAINTENANCE: 'Karbantartási',
  OPERATION: 'Üzemeltetési',
  MEDIATION: 'Közvetítői',
  CUSTOM: 'Egyéni',
}

export default function PreviewContractTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string
  const [previewData, setPreviewData] = useState<Record<string, any>>({})

  const { data: template, isLoading } = api.contractTemplate.getById.useQuery(templateId)
  const { data: preview, refetch: refetchPreview } = api.contractTemplate.preview.useQuery(
    { templateId, data: previewData },
    { enabled: !!template }
  )

  const handleVariableChange = (key: string, value: any) => {
    setPreviewData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleGeneratePreview = () => {
    refetchPreview()
  }

  const handleDownload = () => {
    if (!preview) return

    const blob = new Blob([preview.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${template?.name || 'szerződés'}_előnézet.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <p>Sablon nem található</p>
        <Button onClick={() => router.push('/dashboard/contracts/templates')}>
          Vissza a listához
        </Button>
      </div>
    )
  }

  const variables = template.variables as Array<{key: string, label: string, type: string, required: boolean}>

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/contracts/templates')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Vissza
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge>{typeLabels[template.type]}</Badge>
              {template.isSystem && <Badge variant="secondary">Rendszer sablon</Badge>}
            </div>
            {template.description && (
              <p className="text-muted-foreground mt-2">{template.description}</p>
            )}
          </div>
          <Button onClick={handleDownload} disabled={!preview}>
            <Download className="h-4 w-4 mr-2" />
            Letöltés
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Változók kitöltése</CardTitle>
              <CardDescription>
                Töltse ki a változókat az előnézet generálásához
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {variables.map((variable) => (
                <div key={variable.key} className="space-y-2">
                  <Label htmlFor={variable.key}>
                    {variable.label}
                    {variable.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {variable.type === 'text' && (
                    <Input
                      id={variable.key}
                      type="text"
                      value={previewData[variable.key] || ''}
                      onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                      placeholder={`Adja meg: ${variable.label}`}
                    />
                  )}
                  {variable.type === 'number' && (
                    <Input
                      id={variable.key}
                      type="number"
                      value={previewData[variable.key] || ''}
                      onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                      placeholder={`Adja meg: ${variable.label}`}
                    />
                  )}
                  {variable.type === 'date' && (
                    <Input
                      id={variable.key}
                      type="date"
                      value={previewData[variable.key] || ''}
                      onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                    />
                  )}
                  {variable.type === 'boolean' && (
                    <select
                      id={variable.key}
                      value={previewData[variable.key] || ''}
                      onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Válasszon...</option>
                      <option value="Igen">Igen</option>
                      <option value="Nem">Nem</option>
                    </select>
                  )}
                </div>
              ))}
              
              <Button onClick={handleGeneratePreview} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Előnézet frissítése
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Szerződés előnézet</CardTitle>
              <CardDescription>
                A kitöltött változókkal generált szerződés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 min-h-[600px] max-h-[800px] overflow-y-auto">
                {preview ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {preview.content}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-center mt-8">
                    Töltse ki a változókat és kattintson az "Előnézet frissítése" gombra
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}