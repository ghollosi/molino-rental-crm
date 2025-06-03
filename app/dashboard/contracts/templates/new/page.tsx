'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Variable } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import LoadingSpinner from '@/components/loading-spinner'

const formSchema = z.object({
  name: z.string().min(1, 'A név megadása kötelező'),
  type: z.enum(['RENTAL', 'MAINTENANCE', 'OPERATION', 'MEDIATION', 'CUSTOM'], {
    required_error: 'A típus megadása kötelező',
  }),
  description: z.string().optional(),
  content: z.string().min(1, 'A sablon tartalma kötelező'),
  variables: z.array(z.object({
    key: z.string().min(1, 'A kulcs megadása kötelező'),
    label: z.string().min(1, 'A címke megadása kötelező'),
    type: z.enum(['text', 'number', 'date', 'boolean']),
    required: z.boolean().default(true),
  })).default([]),
})

type FormData = z.infer<typeof formSchema>

export default function NewContractTemplatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'CUSTOM',
      description: '',
      content: '',
      variables: [],
    },
  })

  const createMutation = api.contractTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('Sablon sikeresen létrehozva')
      router.push('/dashboard/contracts/templates')
    },
    onError: (error) => {
      toast.error(error.message || 'Hiba történt a mentés során')
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    createMutation.mutate(data)
  }

  const addVariable = () => {
    const currentVariables = form.getValues('variables')
    form.setValue('variables', [
      ...currentVariables,
      { key: '', label: '', type: 'text', required: true }
    ])
  }

  const removeVariable = (index: number) => {
    const currentVariables = form.getValues('variables')
    form.setValue('variables', currentVariables.filter((_, i) => i !== index))
  }

  const insertVariable = (variableKey: string) => {
    const currentContent = form.getValues('content')
    const cursorPosition = (document.getElementById('content') as HTMLTextAreaElement)?.selectionStart || currentContent.length
    const newContent = 
      currentContent.slice(0, cursorPosition) + 
      `{{${variableKey}}}` + 
      currentContent.slice(cursorPosition)
    form.setValue('content', newContent)
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/contracts/templates')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Vissza
        </Button>
        <h1 className="text-3xl font-bold">Új szerződés sablon</h1>
        <p className="text-muted-foreground">Hozzon létre új szerződés sablont változókkal</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alapadatok</CardTitle>
              <CardDescription>A sablon alapvető információi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sablon neve</FormLabel>
                    <FormControl>
                      <Input placeholder="pl. Általános bérleti szerződés" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Típus</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Válasszon típust" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RENTAL">Bérleti</SelectItem>
                        <SelectItem value="MAINTENANCE">Karbantartási</SelectItem>
                        <SelectItem value="OPERATION">Üzemeltetési</SelectItem>
                        <SelectItem value="MEDIATION">Közvetítői</SelectItem>
                        <SelectItem value="CUSTOM">Egyéni</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leírás</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Rövid leírás a sablon használatáról"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Változók</CardTitle>
              <CardDescription>
                Definiálja a sablonban használt változókat. A változókat {{'{{'}{'{}'}} formátumban használhatja a szövegben.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch('variables').map((variable, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`variables.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kulcs</FormLabel>
                          <FormControl>
                            <Input placeholder="pl. berlo_nev" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`variables.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Címke</FormLabel>
                          <FormControl>
                            <Input placeholder="pl. Bérlő neve" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`variables.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Típus</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="text">Szöveg</SelectItem>
                              <SelectItem value="number">Szám</SelectItem>
                              <SelectItem value="date">Dátum</SelectItem>
                              <SelectItem value="boolean">Igen/Nem</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`variables.${index}.required`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Kötelező</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariable(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addVariable}>
                <Plus className="h-4 w-4 mr-2" />
                Változó hozzáadása
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sablon tartalma</CardTitle>
              <CardDescription>
                A szerződés szövege. Használja a fenti változókat {{'{{'}{'{}'}} formátumban.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch('variables').length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Használható változók:</span>
                  {form.watch('variables').map((variable) => (
                    variable.key && (
                      <Button
                        key={variable.key}
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => insertVariable(variable.key)}
                      >
                        <Variable className="h-3 w-3 mr-1" />
                        {variable.key}
                      </Button>
                    )
                  ))}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        id="content"
                        placeholder="Írja be a szerződés szövegét..."
                        className="min-h-[400px] font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/contracts/templates')}
            >
              Mégse
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Mentés...
                </>
              ) : (
                'Sablon létrehozása'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}