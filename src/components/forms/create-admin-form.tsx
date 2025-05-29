'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc'

const CreateAdminSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  email: z.string().email('Érvényes email cím szükséges'),
  role: z.enum(['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN']).default('ADMIN'),
  phone: z.string().optional(),
  language: z.enum(['HU', 'EN', 'ES']).default('HU'),
})

type CreateAdminFormData = z.infer<typeof CreateAdminSchema>

interface CreateAdminFormProps {
  onSuccess?: () => void
}

export function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(CreateAdminSchema),
    defaultValues: {
      role: 'ADMIN',
      language: 'HU',
    },
  })

  const createAdminMutation = trpc.user.createAdmin.useMutation({
    onSuccess: () => {
      toast({
        title: 'Rendszergazda létrehozva',
        description: 'Az új rendszergazda sikeresen létrehozva. Minden admin értesítést kapott.',
      })
      reset()
      onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Hiba történt',
        description: error.message,
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = (data: CreateAdminFormData) => {
    setIsSubmitting(true)
    createAdminMutation.mutate(data)
  }

  const roleOptions = [
    { value: 'ADMIN', label: 'Fő Rendszergazda', description: 'Teljes hozzáférés minden funkcióhoz' },
    { value: 'EDITOR_ADMIN', label: 'Szerkesztő Admin', description: 'Tartalom szerkesztési jogosultságok' },
    { value: 'OFFICE_ADMIN', label: 'Irodai Admin', description: 'Alapvető adminisztrációs jogosultságok' },
  ]

  const languageOptions = [
    { value: 'HU', label: 'Magyar' },
    { value: 'EN', label: 'English' },
    { value: 'ES', label: 'Español' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Név *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Teljes név"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email cím *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="admin@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Admin szint *</Label>
        <Select 
          defaultValue="ADMIN" 
          onValueChange={(value) => setValue('role', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefonszám</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+36 20 123 4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Nyelv</Label>
          <Select 
            defaultValue="HU" 
            onValueChange={(value) => setValue('language', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
        <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center">
          🔐 Biztonsági figyelmeztetés
        </h4>
        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
          <li>• Az új admin teljes hozzáférést kap a rendszerhez</li>
          <li>• Minden meglévő admin értesítést kap az új admin létrehozásáról</li>
          <li>• Az admin jogosultságokat csak fő rendszergazda adhat</li>
          <li>• Az új admin automatikusan generált jelszót kap email-ben</li>
        </ul>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          📧 Email értesítések
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Üdvözlő email az új adminnak belépési adatokkal</li>
          <li>• Biztonsági értesítő email minden meglévő adminnak</li>
          <li>• Az emailek automatikusan kiküldésre kerülnek</li>
        </ul>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          Mégsem
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Létrehozás...' : 'Rendszergazda létrehozása'}
        </Button>
      </div>
    </form>
  )
}