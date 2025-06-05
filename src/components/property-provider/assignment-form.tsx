'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const assignmentFormSchema = z.object({
  // Alapadatok
  assignmentType: z.enum(['ONE_TIME', 'RECURRING', 'PERMANENT']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  description: z.string().optional(),
  notes: z.string().optional(),
  isPrimary: z.boolean().default(false),
  
  // Kategóriák
  categories: z.array(z.string()).min(1, 'Legalább egy kategória szükséges'),
  
  // Egyedi hozzárendelések
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  
  // Rendszeres hozzárendelések
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringDays: z.array(z.number()).optional(),
  recurringTime: z.string().optional(),
  recurringInterval: z.number().min(1).default(1),
  recurringStartDate: z.date().optional(),
  recurringEndDate: z.date().optional(),
})

type AssignmentFormData = z.infer<typeof assignmentFormSchema>

interface AssignmentFormProps {
  onSubmit: (data: AssignmentFormData) => Promise<void>
  loading?: boolean
  mode: 'property-to-provider' | 'provider-to-property'
  propertyName?: string
  providerName?: string
  initialData?: Partial<AssignmentFormData>
}

const ISSUE_CATEGORIES = [
  'PLUMBING',
  'ELECTRICAL',
  'HVAC',
  'STRUCTURAL',
  'OTHER'
]

const CATEGORY_LABELS = {
  PLUMBING: 'Vízvezeték',
  ELECTRICAL: 'Elektromos',
  HVAC: 'Fűtés/Klíma',
  STRUCTURAL: 'Építkezés',
  OTHER: 'Egyéb'
}

const WEEKDAYS = [
  { value: 1, label: 'Hétfő' },
  { value: 2, label: 'Kedd' },
  { value: 3, label: 'Szerda' },
  { value: 4, label: 'Csütörtök' },
  { value: 5, label: 'Péntek' },
  { value: 6, label: 'Szombat' },
  { value: 7, label: 'Vasárnap' },
]

export function AssignmentForm({ onSubmit, loading, mode, propertyName, providerName, initialData }: AssignmentFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || [])
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(initialData?.recurringDays || [])
  
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      assignmentType: 'ONE_TIME',
      priority: 'NORMAL',
      isPrimary: false,
      isRecurring: false,
      recurringInterval: 1,
      categories: [],
      recurringDays: [],
      ...initialData,
    },
  })

  const assignmentType = form.watch('assignmentType')
  const isRecurring = form.watch('isRecurring')

  const handleSubmit = async (data: AssignmentFormData) => {
    const formData = {
      ...data,
      categories: selectedCategories,
      recurringDays: assignmentType === 'RECURRING' ? selectedWeekdays : undefined,
      isRecurring: assignmentType === 'RECURRING',
    }
    await onSubmit(formData)
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'property-to-provider' 
            ? `Szolgáltató hozzárendelése ${propertyName ? `- ${propertyName}` : ''}`
            : `Ingatlan hozzárendelése ${providerName ? `- ${providerName}` : ''}`
          }
        </CardTitle>
        <CardDescription>
          {mode === 'property-to-provider' 
            ? 'Szolgáltató hozzárendelése az ingatlanhoz egyedi vagy rendszeres feladatokhoz'
            : 'Ingatlan hozzárendelése a szolgáltatóhoz egyedi vagy rendszeres feladatokhoz'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Hozzárendelés típusa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hozzárendelés típusa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Válasszon típust" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONE_TIME">Egyedi</SelectItem>
                        <SelectItem value="RECURRING">Rendszeres</SelectItem>
                        <SelectItem value="PERMANENT">Állandó</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Egyedi: Egyszeri feladat, Rendszeres: Ismétlődő feladat, Állandó: Folyamatos hozzáférés
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritás</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Válasszon prioritást" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Alacsony</SelectItem>
                        <SelectItem value="NORMAL">Normál</SelectItem>
                        <SelectItem value="HIGH">Magas</SelectItem>
                        <SelectItem value="URGENT">Sürgős</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Szolgáltatási kategóriák */}
            <div className="space-y-3">
              <FormLabel>Szolgáltatási kategóriák</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ISSUE_CATEGORIES.map((category) => (
                  <div
                    key={category}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors",
                      selectedCategories.includes(category) 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "hover:bg-accent"
                    )}
                    onClick={() => toggleCategory(category)}
                  >
                    <Checkbox 
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    <span className="text-sm">{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}</span>
                  </div>
                ))}
              </div>
              {selectedCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">Legalább egy kategória kiválasztása szükséges</p>
              )}
            </div>

            {/* Elsődleges szolgáltató */}
            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Elsődleges szolgáltató</FormLabel>
                    <FormDescription>
                      Az elsődleges szolgáltató elsőbbséget élvez a feladatok kiosztásánál
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Egyedi hozzárendelés dátumai */}
            {(assignmentType === 'ONE_TIME' || assignmentType === 'RECURRING') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Kezdő dátum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: hu })
                              ) : (
                                <span>Válasszon dátumot</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Befejező dátum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: hu })
                              ) : (
                                <span>Válasszon dátumot</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Rendszeres hozzárendelés beállítások */}
            {assignmentType === 'RECURRING' && (
              <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
                <h4 className="text-sm font-medium">Rendszeres hozzárendelés beállítások</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="recurringType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ismétlődés típusa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Válasszon típust" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Napi</SelectItem>
                            <SelectItem value="weekly">Heti</SelectItem>
                            <SelectItem value="monthly">Havi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurringInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gyakoriság</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Minden X napon/héten/hónapban</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurringTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Időpont</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>Feladat időpontja</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Hétköznapok kiválasztása */}
                <div className="space-y-2">
                  <FormLabel>Hétköznapok</FormLabel>
                  <div className="grid grid-cols-7 gap-2">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day.value}
                        className={cn(
                          "flex items-center justify-center p-2 rounded-md border cursor-pointer transition-colors text-xs",
                          selectedWeekdays.includes(day.value) 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "hover:bg-accent"
                        )}
                        onClick={() => toggleWeekday(day.value)}
                      >
                        {day.label.slice(0, 3)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Leírás és megjegyzések */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leírás</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="pl. Téli karbantartás, Vészhelyzeti javítás..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Hozzárendelés rövid leírása</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Megjegyzések</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="További információk, speciális utasítások..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Belső megjegyzések és útmutatók</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Kiválasztott kategóriák megjelenítése */}
            {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Kiválasztott kategóriák:</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleCategory(category)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Form gombok */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || selectedCategories.length === 0}>
                {loading ? 'Mentés...' : 'Hozzárendelés létrehozása'}
              </Button>
              <Button type="button" variant="outline" disabled={loading}>
                Mégse
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}