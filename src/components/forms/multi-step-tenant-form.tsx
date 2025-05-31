'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/ui/image-upload'
import { 
  User, 
  Users, 
  Upload, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react'

// Zod schema for validation
const tenantFormSchema = z.object({
  // Step 1: Basic Info
  firstName: z.string().min(2, 'Vezetéknév kötelező'),
  lastName: z.string().min(2, 'Keresztnév kötelező'),
  email: z.string().email('Érvényes email cím szükséges'),
  password: z.string().min(6, 'A jelszó legalább 6 karakter hosszú legyen'),
  phone: z.string().optional(),
  
  // Step 2: Address & Contact
  address: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  
  // Step 3: Profile & Documents
  profilePhoto: z.string().optional(),
  documents: z.array(z.string()).default([]),
  notes: z.string().optional(),
  
  // Step 4: Co-tenants
  coTenants: z.array(z.object({
    firstName: z.string().min(1, 'Vezetéknév kötelező'),
    lastName: z.string().min(1, 'Keresztnév kötelező'),
    email: z.string().email('Érvényes email cím szükséges'),
    phone: z.string().optional(),
  })).default([])
})

type TenantFormData = z.infer<typeof tenantFormSchema>

interface MultiStepTenantFormProps {
  onSubmit: (data: TenantFormData) => Promise<void>
  isSubmitting?: boolean
  error?: string | null
}

const STEPS = [
  { id: 1, title: 'Alapadatok', icon: User },
  { id: 2, title: 'Kapcsolat', icon: Phone },
  { id: 3, title: 'Profil & Dokumentumok', icon: Upload },
  { id: 4, title: 'Albérlők', icon: Users }
]

export function MultiStepTenantForm({ onSubmit, isSubmitting = false, error }: MultiStepTenantFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      emergencyName: '',
      emergencyPhone: '',
      profilePhoto: '',
      documents: [],
      notes: '',
      coTenants: []
    }
  })

  const { fields: coTenantFields, append: addCoTenant, remove: removeCoTenant } = useFieldArray({
    control: form.control,
    name: 'coTenants'
  })

  const nextStep = async () => {
    let fieldsToValidate: (keyof TenantFormData)[] = []
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['firstName', 'lastName', 'email', 'password']
        break
      case 2:
        // No required fields in step 2
        break
      case 3:
        // No required fields in step 3
        break
      case 4:
        // Validate co-tenants if any exist
        if (coTenantFields.length > 0) {
          const isValid = await form.trigger('coTenants')
          if (!isValid) return
        }
        break
    }
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate)
      if (!isValid) return
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (data: TenantFormData) => {
    await onSubmit(data)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors
                  ${isActive ? 'border-blue-500 bg-blue-500 text-white' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-gray-300 bg-white text-gray-400'}
                `}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-4 
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {STEPS.find(s => s.id === currentStep)?.title} - Új bérlő regisztrálása
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Vezetéknév *</Label>
                    <Input
                      id="firstName"
                      {...form.register('firstName')}
                      placeholder="Nagy"
                    />
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Keresztnév *</Label>
                    <Input
                      id="lastName"
                      {...form.register('lastName')}
                      placeholder="János"
                    />
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email cím *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="nagy.janos@example.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Jelszó *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register('password')}
                    placeholder="Legalább 6 karakter"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefonszám</Label>
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="+36 20 123 4567"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Address & Contact */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="address">Cím</Label>
                  <Input
                    id="address"
                    {...form.register('address')}
                    placeholder="1234 Budapest, Példa utca 12."
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Vészhelyzeti kapcsolattartó
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyName">Kapcsolattartó neve</Label>
                      <Input
                        id="emergencyName"
                        {...form.register('emergencyName')}
                        placeholder="Kapcsolattartó teljes neve"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyPhone">Telefonszám</Label>
                      <Input
                        id="emergencyPhone"
                        {...form.register('emergencyPhone')}
                        placeholder="+36 20 987 6543"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Profile & Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>Profilkép</Label>
                  <ImageUpload
                    value={form.watch('profilePhoto') ? [form.watch('profilePhoto')] : []}
                    onChange={(urls) => form.setValue('profilePhoto', urls[0] || '')}
                    maxFiles={1}
                  />
                </div>

                <div>
                  <Label>Dokumentumok (személyi, szerződések, stb.)</Label>
                  <ImageUpload
                    value={form.watch('documents')}
                    onChange={(urls) => form.setValue('documents', urls)}
                    maxFiles={10}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Belső megjegyzések</Label>
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    placeholder="Belső megjegyzések a bérlőről..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Co-tenants */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Albérlők / Társbérlők
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addCoTenant({ firstName: '', lastName: '', email: '', phone: '' })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Albérlő hozzáadása
                  </Button>
                </div>

                {coTenantFields.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Még nem adott hozzá albérlőket
                    </p>
                    <p className="text-xs text-gray-500">
                      Kattintson a "Albérlő hozzáadása" gombra társbérlők hozzáadásához
                    </p>
                  </div>
                )}

                {coTenantFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Albérlő #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCoTenant(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Vezetéknév *</Label>
                        <Input
                          {...form.register(`coTenants.${index}.firstName`)}
                          placeholder="Vezetéknév"
                        />
                        {form.formState.errors.coTenants?.[index]?.firstName && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.coTenants[index]?.firstName?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>Keresztnév *</Label>
                        <Input
                          {...form.register(`coTenants.${index}.lastName`)}
                          placeholder="Keresztnév"
                        />
                        {form.formState.errors.coTenants?.[index]?.lastName && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.coTenants[index]?.lastName?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          {...form.register(`coTenants.${index}.email`)}
                          placeholder="email@example.com"
                        />
                        {form.formState.errors.coTenants?.[index]?.email && (
                          <p className="text-sm text-red-500 mt-1">
                            {form.formState.errors.coTenants[index]?.email?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>Telefon</Label>
                        <Input
                          {...form.register(`coTenants.${index}.phone`)}
                          placeholder="+36 20 123 4567"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Előző
              </Button>

              <div className="flex gap-2">
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                  >
                    Következő
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Mentés...' : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Bérlő létrehozása
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}