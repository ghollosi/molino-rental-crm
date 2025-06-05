'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const forgotPasswordSchema = z.object({
  email: z.string().email('Érvényes email címet adjon meg'),
})

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const forgotPasswordMutation = api.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true)
    },
    onError: (error) => {
      toast({
        title: 'Hiba',
        description: error.message || 'Hiba történt a jelszó visszaállítás során',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    forgotPasswordMutation.mutate(values)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email elküldve!</CardTitle>
            <CardDescription className="mt-2">
              Ha a megadott email cím szerepel a rendszerünkben, küldtünk egy levelet a jelszó visszaállításához szükséges utasításokkal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Ellenőrizze az email fiókját és kövesse a levélben található utasításokat. A link 1 óráig érvényes.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Vissza a bejelentkezéshez
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Elfelejtett jelszó</CardTitle>
          <CardDescription className="text-center">
            Adja meg az email címét és küldünk egy levelet a jelszó visszaállításához
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email cím</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="pelda@email.com" 
                        type="email"
                        autoComplete="email"
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
                disabled={forgotPasswordMutation.isLoading}
              >
                {forgotPasswordMutation.isLoading ? (
                  'Küldés...'
                ) : (
                  'Jelszó visszaállítása'
                )}
              </Button>

              <div className="text-center text-sm">
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Vissza a bejelentkezéshez
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}