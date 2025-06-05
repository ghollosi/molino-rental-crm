'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileUpload } from '@/components/ui/file-upload'
import { Building, AlertCircle, CheckCircle2, Image } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'

export function CompanySettings() {
  const { toast } = useToast()
  const [companyData, setCompanyData] = useState({
    name: '',
    taxNumber: '',
    bankAccount: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    email: '',
    phone: '',
    logo: ''
  })
  
  // Get company data
  const { data: company, isLoading } = api.company.get.useQuery()
  
  // Update company mutation
  const updateCompanyMutation = api.company.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Siker",
        description: "Cégadatok sikeresen frissítve!",
      })
      
      // Update local state with response
      if (data) {
        setCompanyData({
          name: data.name || '',
          taxNumber: data.taxNumber || '',
          bankAccount: data.bankAccount || '',
          street: data.street || '',
          city: data.city || '',
          postalCode: data.postalCode || '',
          country: data.country || '',
          email: data.email || '',
          phone: data.phone || '',
          logo: data.logo || ''
        })
      }
    },
    onError: (error) => {
      toast({
        title: "Hiba",
        description: error.message || "Hiba történt a cégadatok frissítése során",
        variant: "destructive"
      })
    }
  })

  // Initialize form with company data
  useEffect(() => {
    if (company) {
      setCompanyData({
        name: company.name || '',
        taxNumber: company.taxNumber || '',
        bankAccount: company.bankAccount || '',
        street: company.street || '',
        city: company.city || '',
        postalCode: company.postalCode || '',
        country: company.country || '',
        email: company.email || '',
        phone: company.phone || '',
        logo: company.logo || ''
      })
    }
  }, [company])

  const handleSave = async () => {
    console.log('Attempting to save company data:', companyData)
    
    // Filter out empty strings to avoid validation errors
    const filteredData = Object.fromEntries(
      Object.entries(companyData).filter(([key, value]) => {
        if (key === 'email' && value === '') return false // Skip empty email
        if (value === '') return false // Skip empty strings
        return true
      })
    )
    
    console.log('Filtered data for update:', filteredData)
    updateCompanyMutation.mutate(filteredData)
  }
  
  const handleLogoUpload = (url: string | undefined) => {
    setCompanyData(prev => ({ ...prev, logo: url || '' }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">Betöltés...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Cégadatok</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo upload section */}
        <div className="space-y-4">
          <Label>Cég logó</Label>
          <div className="flex items-start gap-6">
            {companyData.logo && (
              <div className="flex-shrink-0">
                <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                  <img 
                    src={companyData.logo} 
                    alt="Cég logó" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Jelenlegi logó</p>
              </div>
            )}
            <div className="flex-1">
              <FileUpload
                label="Új logó feltöltése"
                value={companyData.logo}
                onChange={handleLogoUpload}
                accept="image/*"
                maxSize={5}
                description="Ajánlott méret: 200x200px vagy nagyobb. Támogatott formátumok: PNG, JPG, SVG"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div>
            <Label htmlFor="companyName">Cégnév</Label>
            <Input 
              id="companyName" 
              value={companyData.name}
              onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Pl. Molino RENTAL Kft."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxNumber">Adószám</Label>
              <Input 
                id="taxNumber" 
                value={companyData.taxNumber}
                onChange={(e) => setCompanyData(prev => ({ ...prev, taxNumber: e.target.value }))}
                placeholder="12345678-1-42"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">Bankszámlaszám</Label>
              <Input 
                id="bankAccount" 
                value={companyData.bankAccount}
                onChange={(e) => setCompanyData(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="12345678-12345678-12345678"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Cím</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Utca, házszám</Label>
                <Input 
                  id="street" 
                  value={companyData.street}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Váci út 1."
                />
              </div>
              <div>
                <Label htmlFor="city">Város</Label>
                <Input 
                  id="city" 
                  value={companyData.city}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Budapest"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Irányítószám</Label>
                <Input 
                  id="postalCode" 
                  value={companyData.postalCode}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="1133"
                />
              </div>
              <div>
                <Label htmlFor="country">Ország</Label>
                <Input 
                  id="country" 
                  value={companyData.country}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Magyarország"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyEmail">E-mail</Label>
              <Input 
                id="companyEmail" 
                type="email" 
                value={companyData.email}
                onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@molino-rental.hu"
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Telefon</Label>
              <Input 
                id="companyPhone" 
                value={companyData.phone}
                onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+36 1 234 5678"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-4">
            <Button 
              onClick={handleSave}
              disabled={updateCompanyMutation.isLoading}
            >
              {updateCompanyMutation.isLoading ? 'Mentés...' : 'Változások mentése'}
            </Button>
            
            {updateCompanyMutation.isSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Sikeresen mentve!</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}