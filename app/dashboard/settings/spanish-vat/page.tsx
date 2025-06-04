'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Calculator, Euro, FileText, Loader2, Plus, Trash2, Info } from 'lucide-react'

interface VATItem {
  id: string
  type: string
  amount: string
  description: string
}

interface VATCalculation {
  type: string
  description: string
  netAmount: number
  vatRate: number
  vatAmount: number
  grossAmount: number
  vatName: string
}

interface VATResult {
  calculations: VATCalculation[]
  totals: {
    totalNet: number
    totalVAT: number
    totalGross: number
    currency: string
  }
  vatSummary: Array<{
    vatRate: number
    vatName: string
    netAmount: number
    vatAmount: number
  }>
  calculatedAt: string
  disclaimer: string
}

export default function SpanishVATCalculatorPage() {
  const [items, setItems] = useState<VATItem[]>([
    { id: '1', type: 'rental_tourist', amount: '1000', description: '' }
  ])
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<VATResult | null>(null)

  const vatTypes = [
    { value: 'rental_tourist', label: 'Alquiler Turístico (21%)', rate: 21 },
    { value: 'rental_residential', label: 'Alquiler Residencial (0%)', rate: 0 },
    { value: 'maintenance', label: 'Mantenimiento (21%)', rate: 21 },
    { value: 'utilities', label: 'Suministros (10%)', rate: 10 },
    { value: 'cleaning', label: 'Limpieza (21%)', rate: 21 },
    { value: 'insurance', label: 'Seguro (0%)', rate: 0 },
  ]

  const addItem = () => {
    const newItem: VATItem = {
      id: Date.now().toString(),
      type: 'rental_tourist',
      amount: '',
      description: '',
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof VATItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const calculateVAT = async () => {
    // Validate items
    const validItems = items.filter(item => item.amount && parseFloat(item.amount) > 0)
    
    if (validItems.length === 0) {
      toast.error('Kérjük adjon meg legalább egy érvényes összeget')
      return
    }

    setIsCalculating(true)
    try {
      const requestBody = {
        items: validItems.map(item => ({
          type: item.type,
          amount: parseFloat(item.amount),
          description: item.description || undefined,
        })),
        calculateOnly: true,
      }

      const response = await fetch('/api/spanish-vat-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Számítási hiba')
      }

      const result: VATResult = await response.json()
      setResult(result)
      
      toast.success('IVA számítás kész!', {
        description: `Összes: ${result.totals.totalGross.toFixed(2)} EUR (${result.totals.totalVAT.toFixed(2)} EUR IVA)`,
      })
    } catch (error: any) {
      toast.error('IVA számítás sikertelen', {
        description: error.message,
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const getVATTypeInfo = (type: string) => {
    return vatTypes.find(vt => vt.value === type)
  }

  const clearAll = () => {
    setItems([{ id: '1', type: 'rental_tourist', amount: '', description: '' }])
    setResult(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spanyol IVA Kalkulátor</h1>
        <p className="text-muted-foreground">
          Számítsa ki a spanyol IVA-t különböző alquiler típusokhoz
        </p>
      </div>

      {/* VAT Rates Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Spanyol IVA Kulcsok 2025
          </CardTitle>
          <CardDescription>
            Aktuális IVA kulcsok ingatlan szektorban
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge className="bg-red-100 text-red-800">IVA General - 21%</Badge>
              <p className="text-sm text-muted-foreground">
                Alquiler turístico, mantenimiento, limpieza, servicios generales
              </p>
            </div>
            <div className="space-y-2">
              <Badge className="bg-blue-100 text-blue-800">IVA Reducido - 10%</Badge>
              <p className="text-sm text-muted-foreground">
                Suministros básicos (agua, luz, gas), algunos servicios esenciales
              </p>
            </div>
            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800">IVA Exento - 0%</Badge>
              <p className="text-sm text-muted-foreground">
                Alquiler de vivienda habitual, seguros de vivienda
              </p>
            </div>
            <div className="space-y-2">
              <Badge className="bg-purple-100 text-purple-800">IVA Superreducido - 4%</Badge>
              <p className="text-sm text-muted-foreground">
                Productos de primera necesidad (raro en alquileres)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            IVA Kalkulátor
          </CardTitle>
          <CardDescription>
            Adja meg a szolgáltatásokat és összegeket IVA számításhoz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Típus</Label>
                <Select 
                  value={item.type} 
                  onValueChange={(value) => updateItem(item.id, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vatTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Összeg (EUR)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10"
                    value={item.amount}
                    onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Leírás (opcionális)</Label>
                <Input
                  placeholder="Szolgáltatás leírása..."
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                {getVATTypeInfo(item.type) && (
                  <Badge variant="outline" className="mb-2">
                    {getVATTypeInfo(item.type)?.rate}%
                  </Badge>
                )}
                {items.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="mb-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Tétel hozzáadása
            </Button>
            <Button variant="outline" onClick={clearAll}>
              Mindent törölni
            </Button>
          </div>

          <Button 
            onClick={calculateVAT} 
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            IVA Számítása
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              IVA Számítás Eredménye
            </CardTitle>
            <CardDescription>
              Részletes IVA lebontás spanyol szabályok szerint
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Individual Items */}
            <div className="space-y-3">
              <h3 className="font-medium">Tételek részletesen:</h3>
              {result.calculations.map((calc, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{calc.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground">Nettó:</span><br />
                    <span className="font-medium">{calc.netAmount.toFixed(2)} EUR</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground">{calc.vatName}:</span><br />
                    <Badge variant="outline">{calc.vatRate}%</Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground">IVA:</span><br />
                    <span className="font-medium text-blue-600">{calc.vatAmount.toFixed(2)} EUR</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground">Bruttó:</span><br />
                    <span className="font-medium text-green-600">{calc.grossAmount.toFixed(2)} EUR</span>
                  </div>
                </div>
              ))}
            </div>

            {/* VAT Summary */}
            {result.vatSummary.length > 1 && (
              <div className="space-y-3">
                <h3 className="font-medium">IVA összesítés kulcsonként:</h3>
                {result.vatSummary.map((summary, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <Badge variant="outline">{summary.vatName} ({summary.vatRate}%)</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Nettó: {summary.netAmount.toFixed(2)} EUR
                      </div>
                      <div className="font-medium text-blue-600">
                        IVA: {summary.vatAmount.toFixed(2)} EUR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Összesen Nettó</div>
                <div className="text-xl font-bold">{result.totals.totalNet.toFixed(2)} EUR</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Összesen IVA</div>
                <div className="text-xl font-bold text-blue-600">{result.totals.totalVAT.toFixed(2)} EUR</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Összesen Bruttó</div>
                <div className="text-xl font-bold text-green-600">{result.totals.totalGross.toFixed(2)} EUR</div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <strong>Fontos:</strong> {result.disclaimer}
            </div>

            <div className="text-xs text-muted-foreground">
              Számítás időpontja: {new Date(result.calculatedAt).toLocaleString('hu-HU')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>Fontos Információk</CardTitle>
          <CardDescription>
            Spanyol IVA szabályok alquileres szektorban
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>🏠 Alquiler de vivienda habitual:</strong> IVA mentes (0%) - tartós lakhatás céljára bérelt ingatlanok.
          </div>
          <div>
            <strong>🏖️ Alquiler turístico:</strong> IVA General (21%) - rövid távú, turisztikai célú bérlés.
          </div>
          <div>
            <strong>🔧 Servicios de mantenimiento:</strong> IVA General (21%) - javítás, karbantartás, felújítás.
          </div>
          <div>
            <strong>💡 Suministros básicos:</strong> IVA Reducido (10%) - víz, villany, gáz alapszolgáltatások.
          </div>
          <div>
            <strong>🛡️ Seguros:</strong> IVA mentes (0%) - ingatlan biztosítás.
          </div>
          <div className="text-muted-foreground">
            <strong>Megjegyzés:</strong> Ez egy tájékoztató kalkulátor. Konkrét esetekben konzultáljon adószakértővel.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}