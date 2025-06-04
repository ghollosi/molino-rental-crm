'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, AlertCircle, Plus, Trash2, Calculator, X, Check, User, Camera, Sparkles } from 'lucide-react'
import Link from 'next/link'
// Dynamic pricing átmozgatva a backend-re
import { format } from 'date-fns'
import { useSession } from 'next-auth/react'
import { ImageUpload } from '@/components/ui/image-upload'
import { analyzeIssueWithAI } from '@/lib/ai-categorization'

interface OfferFormData {
  propertyId: string
  issueId?: string
  totalAmount: number
  validUntil: string
  notes?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    total: number
  }[]
  dynamicPricing?: {
    modifiers: string[]
    adjustment: number
    basePrice: number
    applied: boolean
  }
}

interface IssueFormData {
  title: string
  description: string
  priority: string
  category: string
  propertyId: string
  photos?: string[]
}

export default function NewOfferPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  
  // Issue modal states
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [issuePhotos, setIssuePhotos] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [items, setItems] = useState([
    { description: 'Munkadíj', quantity: 1, unitPrice: 0, total: 0 },
    { description: 'Anyagköltség', quantity: 1, unitPrice: 0, total: 0 }
  ])

  // State a dinamikus árazás párbeszédpanelhez
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingCalculation, setPricingCalculation] = useState<{
    basePrice: number
    multiplier: number
    finalPrice: number
    modifiers: string[]
    selectedIssue: any
    adjustment: number
  } | null>(null)
  const [appliedPricing, setAppliedPricing] = useState<{
    modifiers: string[]
    adjustment: number
    finalPrice: number
  } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<OfferFormData>({
    defaultValues: {
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 nap múlva
      items: items,
      totalAmount: 0,
    }
  })

  // Ingatlanok lekérdezése
  const { data: properties } = api.property.list.useQuery({
    page: 1,
    limit: 100,
  })

  // Watch form fields  
  const watchPropertyId = watch('propertyId')
  const watchIssueId = watch('issueId')

  // Hibabejelentések lekérdezése (nyitott)
  const { data: allIssues } = api.issue.list.useQuery({ 
    page: 1, 
    limit: 100,
    status: 'OPEN'
  })

  // Szűrjük le a hibabejelentéseket a kiválasztott ingatlan alapján
  const issues = {
    issues: allIssues?.issues?.filter(issue => 
      !watchPropertyId || issue.propertyId === watchPropertyId
    ) || []
  }

  const createOffer = api.offer.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/offers')
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  // Issue form hook
  const issueForm = useForm<IssueFormData>({
    defaultValues: {
      priority: 'MEDIUM',
      propertyId: watchPropertyId || '',
    }
  })

  // Current user data
  const { data: currentUser } = api.user.getCurrentUser.useQuery()

  // Query refetch function
  const { refetch: refetchIssues } = api.issue.list.useQuery({ 
    page: 1, 
    limit: 100,
    status: 'OPEN'
  })

  // Create issue mutation
  const createIssue = api.issue.create.useMutation({
    onSuccess: async (newIssue) => {
      setShowIssueModal(false)
      issueForm.reset()
      setIssuePhotos([])
      setIssueError(null)
      // Frissítjük a hibabejelentések listáját
      await refetchIssues()
      // Automatikusan kiválasztjuk az új hibabejelentést
      setValue('issueId', newIssue.id)
    },
    onError: (error) => {
      setIssueError(error.message)
    },
  })

  // Issue form submit handler
  const onIssueSubmit = async (data: IssueFormData) => {
    setIssueError(null)

    // Beállítjuk a propertyId-t
    data.propertyId = watchPropertyId!

    await createIssue.mutateAsync({
      ...data,
      photos: issuePhotos,
    })
  }

  // AI analysis function
  const handleAIAnalysis = async () => {
    const title = issueForm.watch('title')
    const description = issueForm.watch('description')

    if (!title || !description) {
      setIssueError('Kérjük, töltse ki a címet és leírást az AI elemzéshez')
      return
    }

    setIsAnalyzing(true)
    try {
      // Kombináljuk a címet és leírást az elemzéshez
      const fullDescription = `${title}. ${description}`
      const result = await analyzeIssueWithAI(fullDescription, issuePhotos)
      
      // Beállítjuk az eredményeket
      issueForm.setValue('priority', result.priority.priority)
      issueForm.setValue('category', result.category.category)
      
      console.log('AI Analysis Result:', result) // Debug log
    } catch (error) {
      console.error('AI Analysis Error:', error) // Debug log
      setIssueError('Hiba történt az AI elemzés során: ' + (error as Error).message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Ha az ingatlan megváltozik, töröljük a kiválasztott hibabejelentést és árazást
  useEffect(() => {
    setValue('issueId', undefined)
    setAppliedPricing(null)
    setPricingCalculation(null)
    // Frissítjük az issue form propertyId mezőjét is
    issueForm.setValue('propertyId', watchPropertyId || '')
  }, [watchPropertyId, setValue, issueForm])

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof typeof items[0], value: string | number) => {
    const newItems = [...items]
    
    if (field === 'description') {
      newItems[index].description = value as string
    } else if (field === 'quantity' || field === 'unitPrice' || field === 'total') {
      newItems[index][field] = value as number
    }
    
    // Számoljuk ki az összeget
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
    
    // Nullázzuk a totalAmount-ot és a dinamikus árazást
    setValue('totalAmount', 0)
    setAppliedPricing(null)
    setValue('items', newItems)
  }

  const onSubmit = async (data: OfferFormData) => {
    setError(null)
    
    const validItems = items.filter(item => 
      item.description && item.quantity > 0 && item.unitPrice > 0
    )
    
    if (validItems.length === 0) {
      setError('Legalább egy tétel megadása kötelező')
      return
    }

    const itemsTotal = validItems.reduce((sum, item) => sum + item.total, 0)
    const totalAmount = appliedPricing ? appliedPricing.finalPrice : itemsTotal

    await createOffer.mutateAsync({
      propertyId: data.propertyId,
      issueId: data.issueId || undefined,
      items: validItems,
      totalAmount: totalAmount,
      validUntil: new Date(data.validUntil),
      notes: data.notes || undefined,
      dynamicPricing: appliedPricing ? {
        modifiers: appliedPricing.modifiers,
        adjustment: appliedPricing.adjustment,
        basePrice: itemsTotal,
        applied: true
      } : undefined,
    })
  }

  const watchItems = watch('items') || []
  const watchTotalAmount = watch('totalAmount') || 0
  const itemsTotal = watchItems.reduce((sum, item) => sum + (item.total || 0), 0)
  
  // A megjelenített összeg: ha van totalAmount beállítva (dinamikus árazás), azt használjuk, különben a tételek összege
  const displayTotal = watchTotalAmount > 0 ? watchTotalAmount : itemsTotal

  // Dynamic pricing kiszámítása (előnézet verzió)
  const calculateDynamicPricing = () => {
    const selectedIssue = issues?.issues.find(i => i.id === watchIssueId)
    if (!selectedIssue) {
      alert('Kérjük, válasszon hibabejelentést a dinamikus árazáshoz!')
      return
    }

    const basePrice = itemsTotal
    let multiplier = 1.0
    let modifiers: string[] = []

    // Prioritás alapú szorzó
    switch (selectedIssue.priority) {
      case 'URGENT':
        multiplier += 0.5 // +50%
        modifiers.push('Sürgős prioritás: +50%')
        break
      case 'HIGH':
        multiplier += 0.25 // +25%
        modifiers.push('Magas prioritás: +25%')
        break
      case 'MEDIUM':
        multiplier += 0.1 // +10%
        modifiers.push('Közepes prioritás: +10%')
        break
      case 'LOW':
        multiplier += 0.0 // +0%
        modifiers.push('Alacsony prioritás: +0%')
        break
    }

    // Szezonális szorzó (egyszerű)
    const month = new Date().getMonth()
    if (month >= 11 || month <= 1) { // December-február
      multiplier += 0.15 // +15% télen
      modifiers.push('Téli szezon: +15%')
    }

    const finalPrice = basePrice * multiplier

    const adjustment = Math.round(finalPrice) - basePrice
    
    // Előnézet megjelenítése párbeszédpanelben
    setPricingCalculation({
      basePrice,
      multiplier,
      finalPrice: Math.round(finalPrice),
      modifiers,
      selectedIssue,
      adjustment
    })
    setShowPricingModal(true)
  }

  // Dinamikus ár alkalmazása
  const applyDynamicPricing = () => {
    if (pricingCalculation) {
      setValue('totalAmount', pricingCalculation.finalPrice)
      setAppliedPricing({
        modifiers: pricingCalculation.modifiers,
        adjustment: pricingCalculation.adjustment,
        finalPrice: pricingCalculation.finalPrice
      })
    }
    setShowPricingModal(false)
  }

  // Dinamikus ár elvetése
  const rejectDynamicPricing = () => {
    setShowPricingModal(false)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/offers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Új ajánlat készítése</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyId">Ingatlan *</Label>
                <Select
                  value={watchPropertyId || ''}
                  onValueChange={(value) => setValue('propertyId', value)}
                  {...register('propertyId', { required: 'Az ingatlan kiválasztása kötelező' })}
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

              <div>
                <Label htmlFor="validUntil">Érvényesség *</Label>
                <Input
                  id="validUntil"
                  type="date"
                  {...register('validUntil', { required: 'Az érvényesség megadása kötelező' })}
                />
                {errors.validUntil && (
                  <p className="text-sm text-red-500 mt-1">{errors.validUntil.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueId">Kapcsolódó hibabejelentés</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={watchIssueId || undefined}
                      onValueChange={(value) => {
                        // Ne állítsuk be a dummy value-kat
                        if (value && value !== 'no-property' && value !== 'no-issues') {
                          setValue('issueId', value)
                        } else {
                          setValue('issueId', undefined)
                        }
                      }}
                    >
                    <SelectTrigger>
                      <SelectValue placeholder={watchPropertyId ? "Válasszon hibabejelentést (opcionális)" : "Először válasszon ingatlant"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!watchPropertyId ? (
                        <SelectItem value="no-property" disabled>
                          Először válasszon ingatlant
                        </SelectItem>
                      ) : issues?.issues.length === 0 ? (
                        <SelectItem value="no-issues" disabled>
                          Nincs nyitott hibabejelentés ehhez az ingatlanhoz
                        </SelectItem>
                      ) : (
                        issues?.issues.map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            {issue.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                    </Select>
                  </div>
                  {watchPropertyId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowIssueModal(true)}
                      className="whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Új hiba
                    </Button>
                  )}
                </div>
              </div>
            </div>


            <div>
              <Label htmlFor="notes">Megjegyzések</Label>
              <textarea
                id="notes"
                {...register('notes')}
                placeholder="További megjegyzések az ajánlathoz..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Label>Tételek *</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Munkadíj, anyagköltség, egyéb szolgáltatások
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tétel hozzáadása
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder="Megnevezés"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Mennyiség"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Egységár"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Összeg"
                        value={item.total}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Tételek összesen: {new Intl.NumberFormat('hu-HU', {
                      style: 'currency',
                      currency: 'HUF',
                      maximumFractionDigits: 0,
                    }).format(itemsTotal)}
                  </p>
                  
                  {/* Dinamikus árazás részletezés */}
                  {appliedPricing && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-700">Dinamikus árazás:</p>
                        {appliedPricing.modifiers.map((modifier, index) => (
                          <p key={index} className="text-sm text-green-600">
                            + {modifier}
                          </p>
                        ))}
                        <p className="text-sm font-semibold text-green-700">
                          Kiigazítás: {appliedPricing.adjustment >= 0 ? '+' : ''}{new Intl.NumberFormat('hu-HU', {
                            style: 'currency',
                            currency: 'HUF',
                            maximumFractionDigits: 0,
                          }).format(appliedPricing.adjustment)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-lg font-semibold mt-2 pt-2 border-t">
                    Összesen: {new Intl.NumberFormat('hu-HU', {
                      style: 'currency',
                      currency: 'HUF',
                      maximumFractionDigits: 0,
                    }).format(displayTotal)}
                  </p>
                </div>
              </div>
              
              {/* Dinamikus árazás gomb */}
              {watchIssueId && !appliedPricing && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateDynamicPricing}
                    className="flex items-center gap-2"
                  >
                    <Calculator className="h-4 w-4" />
                    Dinamikus árazás alkalmazása
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    A prioritás és szezonalitás alapján automatikus árkiigazítás
                  </p>
                </div>
              )}
              
              {appliedPricing && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setValue('totalAmount', 0)
                      setAppliedPricing(null)
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Dinamikus árazás eltávolítása
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mentés...' : 'Ajánlat létrehozása'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/offers')}
              >
                Mégse
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dinamikus árazás párbeszédpanel */}
      {showPricingModal && pricingCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Dinamikus árazás előnézet</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={rejectDynamicPricing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-medium text-blue-800">
                  Hibabejelentés: {pricingCalculation.selectedIssue.title}
                </p>
                <p className="text-sm text-blue-600">
                  Prioritás: {pricingCalculation.selectedIssue.priority}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Alap ár:</span>
                  <span className="font-medium">{pricingCalculation.basePrice.toLocaleString()} HUF</span>
                </div>
                
                {pricingCalculation.modifiers.map((modifier, index) => (
                  <div key={index} className="flex justify-between text-sm text-green-600">
                    <span>+ {modifier}</span>
                  </div>
                ))}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Szorzó:</span>
                    <span className="font-medium">{pricingCalculation.multiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kiigazítás:</span>
                    <span className={`font-medium ${pricingCalculation.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pricingCalculation.adjustment >= 0 ? '+' : ''}{pricingCalculation.adjustment.toLocaleString()} HUF
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Végső ár:</span>
                    <span className="text-green-600">{pricingCalculation.finalPrice.toLocaleString()} HUF</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={applyDynamicPricing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Alkalmazás
              </Button>
              <Button
                variant="outline"
                onClick={rejectDynamicPricing}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Elvetés
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Új hibabejelentés modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Új hibabejelentés</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowIssueModal(false)
                  setIssueError(null)
                  issueForm.reset()
                  setIssuePhotos([])
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {issueError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{issueError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={issueForm.handleSubmit(onIssueSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="issue-title">Cím *</Label>
                <Input
                  id="issue-title"
                  {...issueForm.register('title', { required: 'A cím megadása kötelező' })}
                  placeholder="Rövid összefoglaló a problémáról"
                />
                {issueForm.formState.errors.title && (
                  <p className="text-sm text-red-500 mt-1">
                    {issueForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="issue-description">Részletes leírás *</Label>
                <textarea
                  id="issue-description"
                  {...issueForm.register('description', { required: 'A leírás megadása kötelező' })}
                  placeholder="Részletes leírás a problémáról, tünetekről, és körülményekről"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {issueForm.formState.errors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {issueForm.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issue-priority">Prioritás *</Label>
                  <Select
                    value={issueForm.watch('priority')}
                    onValueChange={(value) => issueForm.setValue('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon prioritást" />
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
                  <Label htmlFor="issue-category">Kategória *</Label>
                  <Select
                    value={issueForm.watch('category')}
                    onValueChange={(value) => issueForm.setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Válasszon kategóriát" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLUMBING">Vízvezeték</SelectItem>
                      <SelectItem value="ELECTRICAL">Elektromos</SelectItem>
                      <SelectItem value="HVAC">Fűtés/Klíma</SelectItem>
                      <SelectItem value="STRUCTURAL">Szerkezeti</SelectItem>
                      <SelectItem value="OTHER">Egyéb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Fényképek</Label>
                <ImageUpload
                  value={issuePhotos}
                  onChange={setIssuePhotos}
                  maxFiles={5}
                  description="Töltsen fel képeket a problémáról (maximum 5 kép, egyenként max 5MB)"
                />
              </div>

              {/* AI Analysis */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">AI elemzés</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isAnalyzing ? 'Elemzés...' : 'AI automatikus kategorizálás'}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Az AI automatikusan beállítja a prioritást és kategóriát a megadott cím és leírás alapján.
                </p>
                {isAnalyzing && (
                  <div className="mt-2 text-sm text-blue-600">
                    🤖 AI elemzés folyamatban...
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowIssueModal(false)
                    setIssueError(null)
                    issueForm.reset()
                    setIssuePhotos([])
                  }}
                  className="flex-1"
                >
                  Mégse
                </Button>
                <Button
                  type="submit"
                  disabled={createIssue.isPending}
                  className="flex-1"
                >
                  {createIssue.isPending ? 'Mentés...' : 'Hibabejelentés létrehozása'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}