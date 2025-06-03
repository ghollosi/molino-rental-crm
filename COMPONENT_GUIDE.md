# 🧩 MOLINO RENTAL CRM - KOMPONENS ÚTMUTATÓ

## 📱 UI KOMPONENS KÖNYVTÁR

### 🎨 Base UI Components (Shadcn/ui)

#### Button
**Helyszín:** `src/components/ui/button.tsx`  
**Használat:**
```typescript
import { Button } from '@/components/ui/button'

<Button variant="default" size="sm" onClick={handleClick}>
  Mentés
</Button>

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

#### Card
**Helyszín:** `src/components/ui/card.tsx`  
**Használat:**
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Ingatlan részletek</CardTitle>
    <CardDescription>Alapinformációk</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Tartalom */}
  </CardContent>
</Card>
```

#### Form
**Helyszín:** `src/components/ui/form.tsx`  
**Használat:**
```typescript
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm({
  resolver: zodResolver(schema)
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Mező neve</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

#### Dialog
**Helyszín:** `src/components/ui/dialog.tsx`  
**Használat:**
```typescript
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Megnyitás</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog címe</DialogTitle>
      <DialogDescription>Leírás</DialogDescription>
    </DialogHeader>
    {/* Dialog tartalom */}
  </DialogContent>
</Dialog>
```

#### Input
**Helyszín:** `src/components/ui/input.tsx`  
**Használat:**
```typescript
import { Input } from '@/components/ui/input'

<Input 
  type="text" 
  placeholder="Placeholder szöveg"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### Select
**Helyszín:** `src/components/ui/select.tsx`  
**Használat:**
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Válasszon..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opció 1</SelectItem>
    <SelectItem value="option2">Opció 2</SelectItem>
  </SelectContent>
</Select>
```

#### Badge
**Helyszín:** `src/components/ui/badge.tsx`  
**Használat:**
```typescript
import { Badge } from '@/components/ui/badge'

<Badge variant="default">Státusz</Badge>
<Badge variant="destructive">Sürgős</Badge>
<Badge variant="outline">Lezárva</Badge>
<Badge variant="secondary">Folyamatban</Badge>
```

#### Tabs
**Helyszín:** `src/components/ui/tabs.tsx`  
**Használat:**
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Tab 1 tartalom
  </TabsContent>
  <TabsContent value="tab2">
    Tab 2 tartalom
  </TabsContent>
</Tabs>
```

---

## 🏢 Speciális komponensek

### 📅 SimplePropertyCalendar ✅
**Helyszín:** `src/components/property/simple-property-calendar.tsx`  
**Cél:** Ingatlan naptár eseményekkel (működő verzió)  
**Props:**
```typescript
interface SimplePropertyCalendarProps {
  propertyId: string
}
```

**Használat:**
```typescript
import { SimplePropertyCalendar } from '@/components/property/simple-property-calendar'

<SimplePropertyCalendar propertyId="property-id" />
```

**Funkciók:**
- ✅ Kattintható dátumok
- ✅ Esemény megjelenítés (bérlés, hibabejelentés)
- ✅ Magyar lokalizáció
- ✅ Színkódolt események
- ✅ Esemény részletek panel
- ✅ Havi navigáció

**Típusok:**
```typescript
interface SimpleCalendarEvent {
  id: string
  title: string
  date: Date
  type: 'rental' | 'issue' | 'other'
  priority?: string
  status?: string
  propertyId?: string
  tenantId?: string
}
```

### 📅 PropertyCalendar ❌ (DEPRECATED)
**Helyszín:** `src/components/property/property-calendar.tsx`  
**Probléma:** Click events nem működnek  
**Státusz:** NE HASZNÁLD - SimplePropertyCalendar használandó

### 🖼️ ImageUpload
**Helyszín:** `src/components/ui/image-upload.tsx`  
**Cél:** Fájlfeltöltés R2 cloud storage-ba  
**Props:**
```typescript
interface ImageUploadProps {
  onUpload: (url: string) => void
  maxFiles?: number
  acceptedTypes?: string[]
}
```

**Használat:**
```typescript
import { ImageUpload } from '@/components/ui/image-upload'

<ImageUpload 
  onUpload={(url) => setPhotos([...photos, url])}
  maxFiles={5}
  acceptedTypes={['image/jpeg', 'image/png']}
/>
```

### 📊 Calendar Widget
**Helyszín:** `src/components/dashboard/calendar-widget.tsx`  
**Cél:** Dashboard mini naptár  
**Használat:**
```typescript
import { CalendarWidget } from '@/components/dashboard/calendar-widget'

<CalendarWidget />
```

---

## 📋 Form komponensek

### 🏠 Property Form Pattern
```typescript
// Példa property form implementáció
const PropertyForm = () => {
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: 'APARTMENT',
      status: 'AVAILABLE',
      currency: 'HUF'
    }
  })

  const createProperty = api.property.create.useMutation({
    onSuccess: () => {
      router.push('/dashboard/properties')
    }
  })

  const onSubmit = async (data: PropertyFormData) => {
    await createProperty.mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Form fields */}
        </div>
        <Button type="submit" disabled={createProperty.isPending}>
          {createProperty.isPending ? 'Mentés...' : 'Mentés'}
        </Button>
      </form>
    </Form>
  )
}
```

### 👤 Tenant Registration Form
**Helyszín:** `app/dashboard/tenants/new/page.tsx`  
**Funkciók:**
- ✅ User alapadatok (név, email, telefon)
- ✅ Ingatlan kiválasztás (opcionális)
- ✅ Bérlési időszak (opcionális)
- ✅ Automatikus szerződés létrehozás
- ✅ Albérlő támogatás

**Használat:**
```typescript
interface TenantFormData {
  email: string
  firstName: string
  lastName: string
  phone?: string
  propertyId?: string
  startDate?: string
  endDate?: string
  mainTenantId?: string
}
```

---

## 📊 Layout komponensek

### 🏠 Dashboard Layout
**Helyszín:** `app/dashboard/layout.tsx`  
**Funkciók:**
- ✅ Sidebar navigáció
- ✅ User avatar + logout
- ✅ Mobile responsive
- ✅ Route highlighting

### 📄 Page Header Pattern
```typescript
const PageHeader = ({ 
  title, 
  description, 
  action 
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {description && (
        <p className="text-gray-600">{description}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
)
```

---

## 🎨 Styling Patterns

### Tailwind CSS Conventions:
```css
/* Layout */
.container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
.grid-responsive: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
.space-y-content: space-y-6

/* Cards */
.card-padding: p-6
.card-border: border border-gray-200 rounded-lg

/* Buttons */
.btn-primary: bg-blue-600 hover:bg-blue-700 text-white
.btn-secondary: bg-gray-200 hover:bg-gray-300 text-gray-900
.btn-danger: bg-red-600 hover:bg-red-700 text-white

/* Forms */
.form-spacing: space-y-4
.form-grid: grid grid-cols-1 md:grid-cols-2 gap-4

/* Status colors */
.status-available: bg-green-100 text-green-800
.status-rented: bg-blue-100 text-blue-800  
.status-maintenance: bg-red-100 text-red-800
.priority-urgent: bg-red-500
.priority-high: bg-orange-500
.priority-medium: bg-yellow-500
.priority-low: bg-blue-500
```

### Component Naming Convention:
```
PascalCase for components: PropertyList, TenantForm
camelCase for props: propertyId, onSubmit
kebab-case for CSS classes: property-card, tenant-list
```

---

## 🔄 State Management Patterns

### 1. Form State (React Hook Form)
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {}
})

// Field registration
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

### 2. Server State (tRPC)
```typescript
// Query
const { data, isLoading, error } = api.entity.list.useQuery(params)

// Mutation
const mutation = api.entity.create.useMutation({
  onSuccess: () => {
    // Invalidate queries
    utils.entity.list.invalidate()
  }
})
```

### 3. Local State (useState)
```typescript
const [selectedItem, setSelectedItem] = useState<Item | null>(null)
const [isOpen, setIsOpen] = useState(false)
```

---

## 🎯 Performance Optimalizáció

### 1. React.memo for expensive components:
```typescript
const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Component logic
})
```

### 2. useMemo for computed values:
```typescript
const filteredData = useMemo(() => {
  return data.filter(item => item.status === 'active')
}, [data])
```

### 3. useCallback for event handlers:
```typescript
const handleClick = useCallback((id: string) => {
  setSelectedId(id)
}, [])
```

### 4. Dynamic imports for large components:
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Betöltés...</div>
})
```

---

## 🚨 Error Handling Patterns

### 1. Error Boundaries:
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div>Hiba történt!</div>
    }
    return this.props.children
  }
}
```

### 2. tRPC Error Handling:
```typescript
const mutation = api.entity.create.useMutation({
  onError: (error) => {
    toast.error(error.message)
  }
})
```

### 3. Loading States:
```typescript
if (isLoading) return <div>Betöltés...</div>
if (error) return <div>Hiba: {error.message}</div>
if (!data) return <div>Nincs adat</div>
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind):
```css
sm: 640px   /* Tablets */
md: 768px   /* Small laptops */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Responsive Grid Pattern:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

### Mobile-first approach:
```css
/* Base: Mobile */
.element { width: 100% }

/* Tablet and up */
@media (min-width: 768px) {
  .element { width: 50% }
}

/* Desktop and up */  
@media (min-width: 1024px) {
  .element { width: 33.333% }
}
```

---

## 🎯 Best Practices

### 1. Component Structure:
```typescript
// 1. Imports
import React from 'react'
import { api } from '@/lib/trpc'

// 2. Types/Interfaces
interface ComponentProps {
  id: string
}

// 3. Component
export function Component({ id }: ComponentProps) {
  // 4. Hooks
  const { data } = api.entity.getById.useQuery(id)
  
  // 5. Event handlers
  const handleClick = () => {}
  
  // 6. Render
  return <div></div>
}
```

### 2. File naming:
```
Components: PascalCase.tsx
Pages: lowercase/kebab-case
Utilities: camelCase.ts
Types: types.ts or [module].types.ts
```

### 3. Import organization:
```typescript
// 1. React
import React from 'react'
import { useState } from 'react'

// 2. Next.js
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 3. External libraries
import { zodResolver } from '@hookform/resolvers/zod'

// 4. Internal utilities
import { api } from '@/lib/trpc'

// 5. Internal components
import { Button } from '@/components/ui/button'

// 6. Types
import type { ComponentProps } from './types'
```

---

**🔗 Kapcsolódó dokumentumok:**
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)