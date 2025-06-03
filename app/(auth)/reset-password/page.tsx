'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'A jelszó legalább 6 karakter hosszú legyen'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'A jelszavak nem egyeznek',
  path: ['confirmPassword'],
})

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)
  
  const token = searchParams.get('token')

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const resetPasswordMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    },
    onError: (error) => {
      if (error.message.includes('token')) {
        setIsValidToken(false)
      } else {
        toast({
          title: 'Hiba',
          description: error.message || 'Hiba történt a jelszó visszaállítás során',
          variant: 'destructive',
        })
      }
    },
  })

  useEffect(() => {
    if (!token) {
      setIsValidToken(false)
    }
  }, [token])

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!token) return
    
    resetPasswordMutation.mutate({
      token,
      password: values.password,
    })
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Érvénytelen vagy lejárt link</CardTitle>
            <CardDescription className="mt-2">
              A jelszó visszaállítási link érvénytelen vagy lejárt. Kérjen új linket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => router.push('/forgot-password')}
            >
              Új link kérése
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Jelszó sikeresen megváltoztatva!</CardTitle>
            <CardDescription className="mt-2">
              Az új jelszavával már bejelentkezhet. Átirányítjuk a bejelentkezési oldalra...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Új jelszó beállítása</CardTitle>
          <CardDescription className="text-center">
            Adja meg az új jelszavát
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Új jelszó</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="******"
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jelszó megerősítése</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="******"
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={resetPasswordMutation.isLoading}
              >
                {resetPasswordMutation.isLoading ? (
                  'Mentés...'
                ) : (
                  'Jelszó megváltoztatása'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}