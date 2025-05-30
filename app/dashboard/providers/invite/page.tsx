'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, Send, Copy, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ProviderInviteData {
  businessName: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  specialty: string[]
  companyDetails?: string
  referenceSource?: string
}

export default function ProviderInvitePage() {
  const router = useRouter()
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<ProviderInviteData>({
    defaultValues: {
      specialty: []
    }
  })

  const createInvitation = api.provider.createInvitation.useMutation({
    onSuccess: (data) => {
      setInviteLink(data.inviteLink)
      toast.success('Meghívó sikeresen létrehozva!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const sendInvitation = api.provider.sendInvitation.useMutation({
    onSuccess: () => {
      toast.success('Meghívó email elküldve!')
      router.push('/dashboard/providers')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (data: ProviderInviteData) => {
    await createInvitation.mutateAsync(data)
  }

  const handleSendEmail = async () => {
    if (!inviteLink) return
    
    const email = watch('contactEmail')
    const name = watch('contactName')
    
    await sendInvitation.mutateAsync({
      email,
      name,
      inviteLink
    })
  }

  const copyToClipboard = async () => {
    if (!inviteLink) return
    
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Link vágólapra másolva!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Nem sikerült a másolás')
    }
  }

  const addSpecialty = (specialty: string) => {
    const currentSpecialties = watch('specialty') || []
    if (!currentSpecialties.includes(specialty)) {
      setValue('specialty', [...currentSpecialties, specialty])
    }
  }

  const removeSpecialty = (specialty: string) => {
    const currentSpecialties = watch('specialty') || []
    setValue('specialty', currentSpecialties.filter(s => s !== specialty))
  }

  const specialtyOptions = [
    'Vízvezeték', 'Elektromos', 'Fűtés', 'Légkondicionálás', 
    'Festés', 'Takarítás', 'Kertészet', 'Zárszolgálat',
    'Üvegezés', 'Burkolás', 'Asztalos', 'Egyéb'
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/providers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza
          </Link>
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Szolgáltató meghívása</CardTitle>
          </CardHeader>
          <CardContent>
            {!inviteLink ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Vállalkozás neve *</Label>
                    <Input
                      id="businessName"
                      {...register('businessName', { required: 'A vállalkozás neve kötelező' })}
                      placeholder="XY Kft."
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactName">Kapcsolattartó neve *</Label>
                    <Input
                      id="contactName"
                      {...register('contactName', { required: 'A kapcsolattartó neve kötelező' })}
                      placeholder="Nagy János"
                    />
                    {errors.contactName && (
                      <p className="text-sm text-red-500 mt-1">{errors.contactName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Email cím *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register('contactEmail', { 
                        required: 'Az email cím kötelező',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Érvénytelen email cím'
                        }
                      })}
                      placeholder="kapcsolat@xy.hu"
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Telefonszám</Label>
                    <Input
                      id="contactPhone"
                      {...register('contactPhone')}
                      placeholder="+36 20 123 4567"
                    />
                  </div>

                  <div>
                    <Label>Szakterületek *</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {specialtyOptions.map((specialty) => {
                        const isSelected = watch('specialty')?.includes(specialty)
                        return (
                          <Button
                            key={specialty}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => isSelected ? removeSpecialty(specialty) : addSpecialty(specialty)}
                          >
                            {specialty}
                          </Button>
                        )
                      })}
                    </div>
                    {watch('specialty')?.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">Legalább egy szakterület kiválasztása kötelező</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="companyDetails">Cég részletei</Label>
                    <Textarea
                      id="companyDetails"
                      {...register('companyDetails')}
                      placeholder="Adószám, székhely, egyéb fontos információk..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="referenceSource">Honnan ismered?</Label>
                    <Input
                      id="referenceSource"
                      {...register('referenceSource')}
                      placeholder="Ajánlás, weboldal, egyéb..."
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || (watch('specialty')?.length || 0) === 0}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Meghívó létrehozása...' : 'Meghívó létrehozása'}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    A meghívó sikeresen létrehozva! Küldd el a linket email-ben vagy másold a vágólapra.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Meghívó link</Label>
                  <div className="flex mt-2">
                    <Input 
                      value={inviteLink} 
                      readOnly 
                      className="mr-2"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={handleSendEmail}
                    disabled={sendInvitation.isPending}
                    className="flex-1"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendInvitation.isPending ? 'Küldés...' : 'Email küldése'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard/providers')}
                    className="flex-1"
                  >
                    Kész
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}