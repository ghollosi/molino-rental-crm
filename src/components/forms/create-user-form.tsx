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

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  email: z.string().email('Érvényes email cím szükséges'),
  role: z.enum(['OWNER', 'TENANT', 'PROVIDER', 'EDITOR_ADMIN', 'OFFICE_ADMIN'], {
    required_error: 'Szerepkör megadása kötelező'
  }),
  phone: z.string().optional(),
  language: z.enum(['HU', 'EN', 'ES']).default('HU'),
})

type CreateUserFormData = z.infer<typeof CreateUserSchema>

interface CreateUserFormProps {
  onSuccess?: () => void
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      language: 'HU',
    },
  })

  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Felhasználó létrehozva',
        description: 'Az új felhasználó sikeresen létrehozva. Üdvözlő email elküldve.',
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

  const onSubmit = (data: CreateUserFormData) => {
    setIsSubmitting(true)
    createUserMutation.mutate(data)
  }

  const roleOptions = [
    { value: 'OWNER', label: 'Tulajdonos' },
    { value: 'TENANT', label: 'Bérlő' },
    { value: 'PROVIDER', label: 'Szolgáltató' },
    { value: 'EDITOR_ADMIN', label: 'Szerkesztő Admin' },
    { value: 'OFFICE_ADMIN', label: 'Irodai Admin' },
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
            placeholder="email@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Szerepkör *</Label>
          <Select onValueChange={(value) => setValue('role', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Válasszon szerepkört" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-red-600">{errors.role.message}</p>
          )}
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

      <div className="space-y-2">
        <Label htmlFor="phone">Telefonszám</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="+36 20 123 4567"
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          ℹ️ Fontos tudnivalók
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• A felhasználó automatikusan generált jelszót kap email-ben</li>
          <li>• Első bejelentkezéskor kötelező megváltoztatni a jelszót</li>
          <li>• A szerepkör meghatározza a hozzáférési jogosultságokat</li>
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
          {isSubmitting ? 'Létrehozás...' : 'Felhasználó létrehozása'}
        </Button>
      </div>
    </form>
  )
}