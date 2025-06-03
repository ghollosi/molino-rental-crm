# 📡 MOLINO RENTAL CRM - API DOKUMENTÁCIÓ

## 🔧 tRPC API ENDPOINTS

### 🏠 PROPERTY API (`property.*`)

#### `property.list`
**Cél:** Ingatlanok listázása szűrőkkel  
**Input:**
```typescript
{
  page: number = 1
  limit: number = 10
  search?: string           // Keresés cím/város alapján
  type?: PropertyType       // APARTMENT | HOUSE | OFFICE | COMMERCIAL
  status?: PropertyStatus   // AVAILABLE | RENTED | MAINTENANCE
}
```
**Output:**
```typescript
{
  properties: Property[]
  totalCount: number
  totalPages: number
  currentPage: number
}
```

#### `property.getById`
**Cél:** Egy ingatlan részletes adatai  
**Input:** `string` (property ID)  
**Output:**
```typescript
Property & {
  owner: Owner & { user: User }
  contracts: Contract[]
  issues: Issue[]
  offers: Offer[]
  tenants: Tenant[]
  currentTenant?: Tenant & { user: User }
}
```

#### `property.create`
**Cél:** Új ingatlan létrehozása  
**Input:**
```typescript
{
  ownerId: string
  street: string
  city: string
  postalCode?: string
  country?: string
  type: PropertyType
  status: PropertyStatus
  size?: number
  rooms?: number
  floor?: number
  rentAmount?: number
  currency?: string = "HUF"
  photos?: string[]         // Image URLs
}
```

#### `property.update`
**Cél:** Ingatlan adatok frissítése  
**Input:**
```typescript
{
  id: string
  data: Partial<CreatePropertyData>
}
```

#### `property.delete`
**Cél:** Ingatlan törlése  
**Input:** `string` (property ID)

#### `property.uploadImage`
**Cél:** Kép feltöltése R2 storage-ba  
**Input:** `FormData` with file  
**Output:**
```typescript
{
  url: string              // CDN URL of uploaded image
  key: string              // Storage key for deletion
}
```

---

### 👤 TENANT API (`tenant.*`)

#### `tenant.list`
**Cél:** Bérlők listázása  
**Input:**
```typescript
{
  page: number = 1
  limit: number = 10  
  search?: string          // Keresés név/email alapján
}
```

#### `tenant.getById`
**Cél:** Bérlő részletes adatai  
**Input:** `string` (tenant ID)  
**Output:**
```typescript
Tenant & {
  user: User
  property?: Property
  contracts: Contract[]
  mainTenant?: Tenant & { user: User }
  subTenants: (Tenant & { user: User })[]
}
```

#### `tenant.create`
**Cél:** Új bérlő regisztrálása (+ automatikus szerződés)  
**Input:**
```typescript
{
  // User data
  email: string
  firstName: string
  lastName: string
  phone?: string
  
  // Property assignment (optional)
  propertyId?: string
  startDate?: string       // ISO date
  endDate?: string         // ISO date
  
  // Sub-tenant support  
  mainTenantId?: string
  
  // Additional tenant fields
  emergencyContact?: string
  employer?: string
  monthlyIncome?: number
}
```
**Speciális funkció:**
- Ha propertyId megadva → automatikus Contract létrehozás
- Property status → RENTED
- Bérleti díj és kaució automatikus számítás

#### `tenant.createWithProperty`
**Cél:** Bérlő létrehozása ingatlan-hozzárendeléssel  
**Input:** Ugyanaz mint `tenant.create` + kötelező property adatok

#### `tenant.update`
**Input:**
```typescript
{
  id: string
  data: Partial<CreateTenantData>
}
```

#### `tenant.delete`
**Input:** `string` (tenant ID)

---

### 👥 OWNER API (`owner.*`)

#### `owner.list`
**Input:**
```typescript
{
  page: number = 1
  limit: number = 10
  search?: string          // Keresés név/email alapján  
  isCompany?: boolean      // Szűrés magánszemély/cég
}
```

#### `owner.getById`
**Input:** `string` (owner ID)  
**Output:**
```typescript
Owner & {
  user: User
  properties: Property[]
}
```

#### `owner.create`
**Input:**
```typescript
{
  // User alapadatok
  email: string
  firstName?: string       // Ha magánszemély
  lastName?: string        // Ha magánszemély
  phone?: string
  
  // Owner specifikus
  isCompany: boolean
  companyName?: string     // Ha cég
  taxNumber?: string       // Ha cég
}
```

#### `owner.update`
**Input:**
```typescript
{
  id: string
  data: Partial<CreateOwnerData>
}
```

#### `owner.delete`
**Input:** `string` (owner ID)

---

### 📋 CONTRACT API (`contract.*`)

#### `contract.list`
**Input:**
```typescript
{
  page: number = 1
  limit: number = 10
  propertyId?: string      // Adott ingatlan szerződései
  tenantId?: string        // Adott bérlő szerződései  
  status?: ContractStatus  // DRAFT | ACTIVE | EXPIRED | TERMINATED
}
```

#### `contract.getById`
**Input:** `string` (contract ID)  
**Output:**
```typescript
Contract & {
  property: Property
  tenant: Tenant & { user: User }
}
```

#### `contract.create`
**Input:**
```typescript
{
  propertyId: string
  tenantId: string
  startDate: Date
  endDate: Date
  rentAmount: number
  deposit: number
  paymentDay: number = 1
  status: ContractStatus = "ACTIVE"
}
```

#### `contract.update`
**Input:**
```typescript
{
  id: string
  data: Partial<CreateContractData>
}
```

#### `contract.delete`
**Input:** `string` (contract ID)

---

### 🚨 ISSUE API (`issue.*`)

#### `issue.list`
**Input:**
```typescript
{
  page: number = 1
  limit: number = 10
  propertyId?: string      // Adott ingatlan hibái
  priority?: IssuePriority // LOW | MEDIUM | HIGH | URGENT
  status?: IssueStatus     // OPEN | IN_PROGRESS | RESOLVED | CLOSED
  category?: IssueCategory // MAINTENANCE | REPAIR | CLEANING | etc.
  sortBy?: string = "createdAt"
  sortOrder?: "asc" | "desc" = "desc"
}
```

#### `issue.getById` 
**Input:** `string` (issue ID)  
**Output:**
```typescript
Issue & {
  property: Property
}
```

#### `issue.create`
**Input:**
```typescript
{
  propertyId: string
  title: string
  description?: string
  priority: IssuePriority
  category: IssueCategory
  reportedBy?: string
  assignedTo?: string
}
```

#### `issue.update`
**Input:**
```typescript
{
  id: string
  data: Partial<CreateIssueData>
}
```

#### `issue.delete`
**Input:** `string` (issue ID)

---

### 📊 ANALYTICS API (`analytics.*`)

#### `analytics.dashboardStats`
**Cél:** Dashboard fő statisztikák  
**Input:** `null`  
**Output:**
```typescript
{
  totalProperties: number
  totalTenants: number
  totalOwners: number
  activeContracts: number
  totalRevenue: number
  openIssues: number
}
```

#### `analytics.getFinancialSummary`
**Cél:** Pénzügyi összesítés  
**Output:**
```typescript
{
  totalRentIncome: number
  totalDeposits: number  
  pendingPayments: number
  monthlyRecurring: number
}
```

#### `analytics.getOutstandingPayments`
**Cél:** Lejárt fizetések  
**Output:**
```typescript
{
  overduePayments: Array<{
    tenantName: string
    propertyAddress: string
    amount: number
    dueDate: Date
    daysOverdue: number
  }>
}
```

#### `analytics.issuesByMonth`
**Cél:** Hibák havi bontásban  
**Output:**
```typescript
Array<{
  month: string
  count: number
}>
```

#### `analytics.revenueByMonth`
**Cél:** Bevétel havi bontásban  
**Output:**
```typescript
Array<{
  month: string
  revenue: number
}>
```

#### `analytics.propertiesByStatus`
**Cél:** Ingatlanok státusz szerint  
**Output:**
```typescript
Array<{
  status: PropertyStatus
  count: number
}>
```

#### `analytics.issuesByCategory`
**Cél:** Hibák kategória szerint  
**Output:**
```typescript
Array<{
  category: IssueCategory
  count: number
}>
```

---

### 💼 OFFER API (`offer.*`)

#### `offer.list`
**Input:**
```typescript
{
  page: number = 1
  limit: number = 10
  propertyId?: string
  status?: OfferStatus
}
```

#### `offer.create`
**Input:**
```typescript
{
  propertyId: string
  offerNumber: string
  totalAmount: number
  currency: string = "HUF"
  description?: string
  validUntil?: Date
  status: OfferStatus = "DRAFT"
}
```

---

### 🔧 PROVIDER API (`provider.*`)

#### `provider.list`
**Input:**
```typescript
{
  page: number = 1
  limit: number = 10
  category?: ProviderCategory
}
```

#### `provider.create`
**Input:**
```typescript
{
  name: string
  category: ProviderCategory
  contactEmail?: string
  contactPhone?: string
  address?: string
  description?: string
}
```

---

### 👤 USER API (`user.*`)

#### `user.getCurrentUser`
**Cél:** Bejelentkezett felhasználó adatai  
**Input:** `null`  
**Output:**
```typescript
User & {
  owner?: Owner
  tenant?: Tenant
}
```

#### `user.updateProfile`
**Input:**
```typescript
{
  firstName?: string
  lastName?: string  
  phone?: string
}
```

---

### 🔐 AUTH API (`auth.*`)

#### `auth.register`
**Input:**
```typescript
{
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role = "TENANT"
}
```

#### `auth.changePassword`
**Input:**
```typescript
{
  currentPassword: string
  newPassword: string
}
```

---

## 🔄 HIBAKEZELÉS

### Error Response Format:
```typescript
{
  error: {
    code: TRPCErrorCode    // UNAUTHORIZED, BAD_REQUEST, etc.
    message: string        // Felhasználóbarát hibaüzenet
    data?: {
      field?: string       // Validációs hibánál
      originalError?: any  // Development környezetben
    }
  }
}
```

### Gyakori hibakódok:
- `UNAUTHORIZED`: Nincs bejelentkezve
- `FORBIDDEN`: Nincs jogosultság  
- `BAD_REQUEST`: Hibás input validáció
- `NOT_FOUND`: Nem található erőforrás
- `INTERNAL_SERVER_ERROR`: Szerver hiba

---

## 📝 VALIDÁCIÓS SÉMÁK (Zod)

### Property Schema:
```typescript
const createPropertySchema = z.object({
  ownerId: z.string().cuid(),
  street: z.string().min(1, "Utca megadása kötelező"),
  city: z.string().min(1, "Város megadása kötelező"),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(["APARTMENT", "HOUSE", "OFFICE", "COMMERCIAL"]),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE"]),
  size: z.number().positive().optional(),
  rooms: z.number().int().positive().optional(),
  floor: z.number().int().optional(),
  rentAmount: z.number().positive().optional(),
  currency: z.string().default("HUF"),
  photos: z.array(z.string().url()).optional()
})
```

### Tenant Schema:
```typescript
const createTenantSchema = z.object({
  email: z.string().email("Érvényes email címet adjon meg"),
  firstName: z.string().min(1, "Keresztnév kötelező"),
  lastName: z.string().min(1, "Vezetéknév kötelező"),
  phone: z.string().optional(),
  propertyId: z.string().cuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  mainTenantId: z.string().cuid().optional(),
  emergencyContact: z.string().optional(),
  employer: z.string().optional(),
  monthlyIncome: z.number().positive().optional()
})
```

---

## 🔗 API HASZNÁLATI PÉLDÁK

### Frontend tRPC Client:
```typescript
// Ingatlanok lekérdezése
const { data: properties } = api.property.list.useQuery({
  page: 1,
  limit: 10,
  status: "AVAILABLE"
})

// Új bérlő létrehozása ingatlan-hozzárendeléssel
const createTenant = api.tenant.create.useMutation({
  onSuccess: () => {
    router.push('/dashboard/tenants')
  }
})

await createTenant.mutateAsync({
  email: "tenant@example.com",
  firstName: "Teszt",
  lastName: "Bérlő",
  propertyId: "property123",
  startDate: "2025-01-01",
  endDate: "2025-12-31"
})
```

### Server-side tRPC:
```typescript
// Router implementáció példa
export const propertyRouter = createTRPCRouter({
  list: publicProcedure
    .input(listPropertiesSchema)
    .query(async ({ input, ctx }) => {
      const { page, limit, search, type, status } = input
      
      const where = {
        ...(search && {
          OR: [
            { street: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(type && { type }),
        ...(status && { status })
      }
      
      const [properties, totalCount] = await Promise.all([
        ctx.db.property.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            owner: { include: { user: true } },
            currentTenant: { include: { user: true } }
          }
        }),
        ctx.db.property.count({ where })
      ])
      
      return {
        properties,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      }
    })
})
```

---

**🔗 Kapcsolódó dokumentumok:**
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Component Guide](./COMPONENT_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)