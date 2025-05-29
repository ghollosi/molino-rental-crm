'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/trpc'

const quickOwnerSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  email: z.string().email('Érvényes email cím szükséges'),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
})

type QuickOwnerFormData = z.infer<typeof quickOwnerSchema>

interface NewOwnerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOwnerCreated: (ownerId: string) => void
}

export function NewOwnerModal({ open, onOpenChange, onOwnerCreated }: NewOwnerModalProps) {
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuickOwnerFormData>({
    resolver: zodResolver(quickOwnerSchema),
  })

  const createOwnerMutation = api.owner.quickCreate.useMutation({
    onSuccess: (data) => {
      onOwnerCreated(data.id)
      reset()
      onOpenChange(false)
    },
    onError: (error) => {
      setError(error.message || 'Hiba történt a tulajdonos létrehozása során')
    },
  })

  const onSubmit = (data: QuickOwnerFormData) => {
    setError('')
    createOwnerMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Új tulajdonos létrehozása</DialogTitle>
          <DialogDescription>
            Adja meg az új tulajdonos alapvető adatait. A részletes adatokat később is megadhatja.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Név*</Label>
            <Input
              id="name"
              placeholder="pl. Kovács János"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email*</Label>
            <Input
              id="email"
              type="email"
              placeholder="pl. kovacs.janos@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefonszám</Label>
            <Input
              id="phone"
              placeholder="pl. +36 30 123 4567"
              {...register('phone')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="taxNumber">Adószám</Label>
            <Input
              id="taxNumber"
              placeholder="pl. 12345678-1-42"
              {...register('taxNumber')}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Mégse
            </Button>
            <Button type="submit" disabled={createOwnerMutation.isPending}>
              {createOwnerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Létrehozás
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}