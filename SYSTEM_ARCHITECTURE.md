# 🏗️ MOLINO RENTAL CRM - RENDSZER ARCHITEKTÚRA

## 📊 TECHNOLÓGIAI STACK

### Frontend:
```typescript
- Next.js 15+ (App Router)
- React 18+ (Server Components + Client Components)
- TypeScript (Strict mode)
- Tailwind CSS (Styling)
- Shadcn/ui (Component library)
- React Hook Form (Form management)
- date-fns (Date manipulation)
```

### Backend:
```typescript
- tRPC (Type-safe API)
- Prisma (ORM + Database)
- NextAuth.js (Authentication)
- Zod (Validation)
- PostgreSQL (Database)
```

### Infrastructure:
```typescript
- Vercel (Hosting)
- Cloudflare R2 (File storage)
- Prisma Cloud (Database hosting)
```

## 🗂️ PROJEKT STRUKTÚRA

```
molino-rental-crm/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── trpc/                 # tRPC handler
│   │   ├── upload/               # File upload
│   │   └── cloud-storage/        # R2 storage
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── properties/           # Property management
│   │   ├── tenants/              # Tenant management
│   │   ├── owners/               # Owner management
│   │   ├── contracts/            # Contract management
│   │   ├── issues/               # Issue tracking
│   │   └── settings/             # App settings
│   ├── login/                    # Authentication
│   └── globals.css               # Global styles
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Base UI components (shadcn)
│   │   ├── forms/                # Form components
│   │   ├── dashboard/            # Dashboard widgets
│   │   └── property/             # Property-specific components
│   ├── lib/                      # Utility libraries
│   │   ├── trpc/                 # tRPC configuration
│   │   ├── auth/                 # Auth configuration
│   │   └── cloud-storage.ts      # R2 storage utilities
│   └── server/                   # Server-side code
│       ├── routers/              # tRPC routers
│       ├── db.ts                 # Database connection
│       └── context.ts            # tRPC context
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Database seeding
└── public/                       # Static assets
    └── uploads/                  # Local file uploads (development)
```

## 🔌 API ARCHITEKTÚRA (tRPC)

### Router Struktúra:
```typescript
src/server/routers/
├── user.ts          # User management
├── auth.ts          # Authentication
├── owner.ts         # Property owners
├── property.ts      # Property CRUD
├── tenant.ts        # Tenant management  
├── contract.ts      # Rental contracts
├── issue.ts         # Issue tracking
├── offer.ts         # Property offers
├── provider.ts      # Service providers
└── analytics.ts     # Dashboard analytics
```

### API Endpoints Pattern:
```typescript
// Minden router tartalmazza:
- list: { page, limit, search?, filters? }
- getById: string (ID)
- create: CreateSchema
- update: { id: string, data: UpdateSchema }
- delete: string (ID)

// Speciális endpoints:
- tenant.createWithProperty: Auto contract creation
- property.uploadImage: R2 cloud storage
- analytics.dashboardStats: Aggregated data
```

## 🗃️ ADATBÁZIS SÉMA

### Core Entities:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String?  # Added in latest version
  lastName  String?  # Added in latest version
  phone     String?
  role      Role     @default(TENANT)
  owner     Owner?
  tenant    Tenant?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Owner {
  id         String      @id @default(cuid())
  userId     String      @unique
  user       User        @relation(fields: [userId], references: [id])
  isCompany  Boolean     @default(false)
  companyName String?
  taxNumber  String?
  properties Property[]
}

model Property {
  id          String     @id @default(cuid())
  ownerId     String
  owner       Owner      @relation(fields: [ownerId], references: [id])
  street      String
  city        String
  postalCode  String?
  country     String?
  type        PropertyType
  status      PropertyStatus
  size        Float?
  rooms       Int?
  floor       Int?
  rentAmount  Decimal?
  currency    String     @default("HUF")
  photos      String[]   # JSON array of image URLs
  contracts   Contract[]
  issues      Issue[]
  offers      Offer[]
  tenants     Tenant[]
}

model Tenant {
  id           String     @id @default(cuid())
  userId       String     @unique
  user         User       @relation(fields: [userId], references: [id])
  propertyId   String?
  property     Property?  @relation(fields: [propertyId], references: [id])
  mainTenantId String?
  mainTenant   Tenant?    @relation("SubTenants", fields: [mainTenantId], references: [id])
  subTenants   Tenant[]   @relation("SubTenants")
  contracts    Contract[]
}

model Contract {
  id          String   @id @default(cuid())
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id])
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  startDate   DateTime
  endDate     DateTime
  rentAmount  Decimal
  deposit     Decimal
  paymentDay  Int      @default(1)
  status      ContractStatus @default(ACTIVE)
}

model Issue {
  id          String      @id @default(cuid())
  propertyId  String
  property    Property    @relation(fields: [propertyId], references: [id])
  title       String
  description String?
  priority    IssuePriority
  status      IssueStatus @default(OPEN)
  category    IssueCategory
  reportedBy  String?
  assignedTo  String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

### Enums:
```prisma
enum Role {
  ADMIN
  OWNER  
  TENANT
}

enum PropertyType {
  APARTMENT
  HOUSE
  OFFICE
  COMMERCIAL
}

enum PropertyStatus {
  AVAILABLE
  RENTED
  MAINTENANCE
}

enum ContractStatus {
  DRAFT
  ACTIVE
  EXPIRED
  TERMINATED
}

enum IssuePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum IssueStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum IssueCategory {
  MAINTENANCE
  REPAIR
  CLEANING
  UTILITIES
  SECURITY
  OTHER
}
```

## 🧩 KOMPONENS ARCHITEKTÚRA

### UI Komponens Hierarchia:
```
Page Components (app/dashboard/*)
├── Layout Components
│   ├── DashboardLayout
│   ├── PageHeader
│   └── Sidebar
├── Feature Components  
│   ├── PropertyList
│   ├── TenantForm
│   ├── ContractDetails
│   └── SimplePropertyCalendar ✅
├── Form Components
│   ├── PropertyForm
│   ├── TenantRegistrationForm
│   └── IssueReportForm
└── Base UI Components (shadcn/ui)
    ├── Button
    ├── Card
    ├── Dialog
    ├── Form
    ├── Input
    ├── Select
    └── Calendar
```

### Component Design Patterns:

#### 1. Server Components (Default):
```typescript
// app/dashboard/properties/page.tsx
export default async function PropertiesPage() {
  // Server-side data fetching
  return <PropertyList />
}
```

#### 2. Client Components (Interactive):
```typescript
// src/components/property/simple-property-calendar.tsx
'use client'
export function SimplePropertyCalendar({ propertyId }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  // Interactive calendar logic
}
```

#### 3. Form Components:
```typescript
// src/components/forms/tenant-form.tsx
export function TenantForm() {
  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema)
  })
  // Form handling with validation
}
```

## 🔐 AUTENTIKÁCIÓ ÉS JOGOSULTSÁG

### NextAuth.js Konfiguráció:
```typescript
// src/lib/auth/config.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Email/password authentication
    })
  ],
  callbacks: {
    session: ({ session, token }) => {
      // User role injection
    }
  }
}
```

### Middleware Protection:
```typescript
// middleware.ts
export default withAuth(
  function middleware(req) {
    // Route protection logic
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)
```

### Role-based Access:
```typescript
// Protected routes by role:
ADMIN:    All routes + settings
OWNER:    Properties, tenants, contracts, issues
TENANT:   Limited view, own contracts/issues
```

## 📁 FÁJLKEZELÉS ÉS TÁROLÁS

### Cloudflare R2 Integration:
```typescript
// src/lib/cloud-storage.ts
export class CloudStorage {
  async uploadFile(file: File, key: string): Promise<string>
  async deleteFile(key: string): Promise<void>
  async getSignedUrl(key: string): Promise<string>
}
```

### Upload Flow:
```
1. Client: File selection in ImageUpload component
2. Server: /api/upload endpoint receives file
3. Cloud: File uploaded to R2 bucket
4. Database: URL stored in property.photos array
5. UI: Image displayed with CDN URL
```

## 🎯 STATE MANAGEMENT

### Client State:
```typescript
- React useState: Local component state
- React Hook Form: Form state management
- tRPC cache: Server state caching
```

### Server State:
```typescript
- tRPC queries: Data fetching with cache
- Prisma: Database state management
- NextAuth session: Authentication state
```

### Data Flow Pattern:
```
UI Component → tRPC Query → Server Router → Prisma → Database
     ↓
   Cache Update ← Response ← Business Logic ← Data Layer
```

## 🔄 DEPLOYIMENT ÉS CI/CD

### Vercel Deployment:
```bash
# Automatic deployment on main branch push
1. Build Next.js application
2. Run Prisma migrations
3. Upload static assets
4. Deploy to production URL
```

### Environment Variables:
```env
# Production environment
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_ENDPOINT=...
```

### Build Process:
```bash
npm run build     # Next.js production build
npm run start     # Start production server
npm run db:push   # Apply schema changes
npm run db:seed   # Seed database
```

## ⚡ PERFORMANCE OPTIMALIZÁCIÓ

### Next.js Optimizations:
- Server Components: Reduced client-side JavaScript
- Image Optimization: next/image component
- Font Optimization: next/font
- Bundle Splitting: Automatic code splitting

### Database Optimizations:
- Prisma Relations: Efficient eager loading
- Indexes: On frequently queried fields
- Connection Pooling: Managed by Prisma

### Caching Strategy:
- tRPC Cache: Client-side query caching
- Static Generation: For non-dynamic pages
- CDN Caching: Cloudflare for static assets

## 🛡️ BIZTONSÁG

### Authentication Security:
- JWT tokens with NextAuth.js
- Secure session management
- Role-based access control
- CSRF protection built-in

### Database Security:
- Prisma prepared statements (SQL injection protection)
- Environment variable secrets
- Database connection encryption

### File Upload Security:
- File type validation
- Size limits enforcement
- Sanitized file names
- Cloud storage permissions

## 📈 MONITORING ÉS LOGGING

### Error Handling:
```typescript
// Structured error handling
try {
  await operation()
} catch (error) {
  console.error('Operation failed:', error)
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Friendly error message'
  })
}
```

### Development Logging:
- Console logs for debugging
- tRPC query logging
- Dev server request logging

### Production Monitoring:
- Vercel Analytics
- Database query monitoring
- Error tracking (manual)

---

**🔗 Kapcsolódó Dokumentumok:**
- [Backup Snapshot](./BACKUP_SNAPSHOT_2025.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Component Guide](./COMPONENT_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)