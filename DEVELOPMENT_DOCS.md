# Molino RENTAL CRM - Teljes Fejlesztési Dokumentáció v2.2

## Tartalomjegyzék
1. Projekt Összefoglalás
2. Technológiai Stack
3. Könyvtárstruktúra
4. Adatmodell Specifikáció
5. API Végpontok Specifikáció
6. Frontend Komponensek
7. Biztonsági követelmények
8. PWA Követelmények
9. Környezeti változók
10. Fejlesztési lépések
11. Tesztelési terv
12. Dokumentáció
13. Értékesítési megfontolások
14. Fejlesztési Folyamat és Dokumentálás
15. Claude Code Specifikus Utasítások
16. Projekt Struktúra Ellenőrző Lista
17. Fejlesztési Parancsok Gyűjteménye
18. Fejlesztési és Tesztelési Környezet
19. Fejlesztési Folytonosság Biztosítása
20. VS Code Fejlesztési Környezet

## 1. Projekt Összefoglalás

**Név:** Molino RENTAL CRM  
**Típus:** Ingatlankezelő és karbantartási rendszer  
**Fejlesztési mappa:** /Users/hollosigabor/molino-rental-crm  

**Célplatformok:**
- Web alkalmazás (böngészőben futó)
- Progresszív Web App (PWA) mobileszközökre (Android, iOS)
- Személyes használatra és értékesítésre (szoftveráruházakban)

**Fő funkciók:**
- Ingatlanok, tulajdonosok, bérlők kezelése
- Hibabejelentés és karbantartás követése
- Ajánlatok készítése és kezelése
- Többnyelvű felület (magyar, angol, spanyol)
- Szerepkör-alapú hozzáférés kezelés
- Teljes testreszabhatóság (színek, betűtípusok, cégadatok)
- Pénznem és ÁFA kezelés

## 2. Technológiai Stack

### Frontend & Backend (Monorepo)
- Next.js 14+ (App Router)
- TypeScript 5+
- React 18+
- Tailwind CSS 3+
- shadcn/ui komponens könyvtár

### Adatbázis
- PostgreSQL 15+
- Prisma ORM 5+

### State Management & API
- TanStack Query (React Query)
- Zustand (client state)
- tRPC (type-safe API)

### Autentikáció
- NextAuth.js v5
- JWT tokenek
- bcrypt jelszótitkosítás

### Többnyelvűség
- next-i18next

### Form kezelés
- React Hook Form
- Zod validáció

### PWA támogatás
- next-pwa
- Web Push API

### File Storage
- Cloudflare R2 vagy AWS S3
- uploadthing file upload

### Email
- Resend vagy SendGrid

### Export
- jsPDF (PDF generálás)
- ExcelJS (Excel export)

### Fejlesztési környezet
- VS Code (kötelező)
- VS Code Integrated Terminal (ajánlott)

## 3. Könyvtárstruktúra

```
/Users/hollosigabor/molino-rental-crm/
├── DEVELOPMENT_DOCS.md     # Ez a dokumentáció (KÖTELEZŐ!)
├── PROGRESS.md            # Fejlesztési előrehaladás napló
├── CHANGELOG.md           # Változások naplója
├── .session-state.json    # Aktuális munkamenet állapota
├── .checkpoints/          # Állapot checkpointok
│   └── [timestamp]/       # Checkpoint mappák
│
├── .husky/                # Git hooks
│   └── pre-commit         # Automatikus mentés commit előtt
│
├── .vscode/               # VS Code beállítások
│   ├── settings.json      # Workspace beállítások
│   ├── tasks.json         # Automatikus taskok
│   ├── extensions.json    # Ajánlott extension-ök
│   └── launch.json        # Debug konfiguráció
│
├── prisma/
│   ├── schema.prisma      # Adatbázis séma
│   └── migrations/        # Migrációk
│
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── icons/            # PWA ikonok
│   └── locales/          # Fordítási fájlok
│
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/      # Autentikációs oldalak
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/ # Védett oldalak
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── owners/
│   │   │   ├── properties/
│   │   │   ├── tenants/
│   │   │   ├── providers/
│   │   │   ├── issues/
│   │   │   ├── offers/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── api/         # API Routes
│   │   │   ├── auth/
│   │   │   ├── trpc/
│   │   │   └── uploadthing/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/       # React komponensek
│   │   ├── ui/          # shadcn/ui komponensek
│   │   ├── forms/       # Form komponensek
│   │   ├── layouts/     # Layout komponensek
│   │   └── shared/      # Közös komponensek
│   │
│   ├── lib/             # Utility függvények
│   │   ├── auth.ts      # Auth config
│   │   ├── db.ts        # Prisma client
│   │   ├── email.ts     # Email szolgáltatás
│   │   ├── storage.ts   # File storage
│   │   └── utils.ts     # Segédfüggvények
│   │
│   ├── server/          # Server-side kód
│   │   ├── routers/     # tRPC routers
│   │   └── services/    # Üzleti logika
│   │
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript típusok
│   ├── styles/          # Globális stílusok
│   └── scripts/         # Fejlesztési scriptek
│       ├── session-recovery.ts    # Session mentés/visszaállítás
│       ├── checkpoint.sh          # Checkpoint kezelés
│       ├── project-status.ts      # Projekt státusz
│       └── dev-helper.ts          # Fejlesztési segédletek
│
├── tests/               # Tesztek
├── docs/                # Generált dokumentáció
├── start-session.sh     # Munkamenet indító script
├── .env.local          # Környezeti változók
├── next.config.js      # Next.js konfiguráció
├── tailwind.config.ts  # Tailwind konfiguráció
├── tsconfig.json       # TypeScript konfiguráció
└── package.json
```

## 4. Adatmodell Specifikáció

### 4.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  EDITOR_ADMIN
  OFFICE_ADMIN
  OWNER
  SERVICE_MANAGER
  PROVIDER
  TENANT
}

enum Language {
  HU
  EN
  ES
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

enum IssueCategory {
  PLUMBING
  ELECTRICAL
  HVAC
  STRUCTURAL
  OTHER
}

enum IssuePriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum IssueStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CLOSED
}

enum OfferStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          UserRole
  language      Language  @default(HU)
  phone         String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  owner         Owner?
  tenant        Tenant?
  provider      Provider?
  reportedIssues Issue[]  @relation("ReportedBy")
  managedIssues  Issue[]  @relation("ManagedBy")
  offers        Offer[]
  statusChanges IssueTimeline[]
}

model Company {
  id            String    @id @default(cuid())
  name          String
  taxNumber     String?
  bankAccount   String?
  
  // Address
  street        String?
  city          String?
  postalCode    String?
  country       String?
  
  // Settings stored as JSON
  settings      Json      @default("{}")
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Owner {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  
  // Personal Info
  taxNumber     String?
  bankAccount   String?
  
  // Billing Address
  billingStreet     String?
  billingCity       String?
  billingPostalCode String?
  billingCountry    String?
  
  properties    Property[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Property {
  id            String    @id @default(cuid())
  
  // Address
  street        String
  city          String
  postalCode    String?
  country       String?
  
  // Coordinates
  latitude      Float?
  longitude     Float?
  
  // Relations
  ownerId       String
  owner         Owner     @relation(fields: [ownerId], references: [id])
  currentTenantId String?
  currentTenant  Tenant?   @relation(fields: [currentTenantId], references: [id])
  
  // Details
  type          PropertyType
  size          Float?    // m²
  rooms         Int?
  floor         Int?
  rentAmount    Decimal?
  currency      String    @default("EUR")
  
  photos        String[]  // Array of URLs
  status        PropertyStatus @default(AVAILABLE)
  
  issues        Issue[]
  offers        Offer[]
  contracts     Contract[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Tenant {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  
  // Emergency Contact
  emergencyName  String?
  emergencyPhone String?
  
  isActive      Boolean   @default(true)
  
  properties    Property[]
  contracts     Contract[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Contract {
  id            String    @id @default(cuid())
  
  propertyId    String
  property      Property  @relation(fields: [propertyId], references: [id])
  
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  
  startDate     DateTime
  endDate       DateTime
  rentAmount    Decimal
  deposit       Decimal?
  paymentDay    Int       // 1-31
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Provider {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  
  businessName  String
  specialty     String[]  // Array of specialties
  hourlyRate    Decimal?
  currency      String    @default("EUR")
  
  // Availability stored as JSON
  availability  Json      @default("{}")
  
  rating        Float?    @default(0)
  
  assignedIssues Issue[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Issue {
  id            String    @id @default(cuid())
  ticketNumber  String    @unique @default(cuid())
  
  propertyId    String
  property      Property  @relation(fields: [propertyId], references: [id])
  
  reportedById  String
  reportedBy    User      @relation("ReportedBy", fields: [reportedById], references: [id])
  
  assignedToId  String?
  assignedTo    Provider? @relation(fields: [assignedToId], references: [id])
  
  managedById   String?
  managedBy     User?     @relation("ManagedBy", fields: [managedById], references: [id])
  
  title         String
  description   String
  category      IssueCategory
  priority      IssuePriority @default(MEDIUM)
  photos        String[]
  
  status        IssueStatus @default(OPEN)
  
  scheduledDate DateTime?
  completedDate DateTime?
  
  timeline      IssueTimeline[]
  offers        Offer[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model IssueTimeline {
  id            String    @id @default(cuid())
  
  issueId       String
  issue         Issue     @relation(fields: [issueId], references: [id])
  
  status        IssueStatus
  changedById   String
  changedBy     User      @relation(fields: [changedById], references: [id])
  notes         String?
  
  timestamp     DateTime  @default(now())
}

model Offer {
  id            String    @id @default(cuid())
  offerNumber   String    @unique @default(cuid())
  
  issueId       String?
  issue         Issue?    @relation(fields: [issueId], references: [id])
  
  propertyId    String
  property      Property  @relation(fields: [propertyId], references: [id])
  
  createdById   String
  createdBy     User      @relation(fields: [createdById], references: [id])
  
  items         Json      // Array of items
  laborCost     Decimal?
  materialCost  Decimal?
  totalAmount   Decimal
  currency      String    @default("EUR")
  
  validUntil    DateTime
  status        OfferStatus @default(DRAFT)
  notes         String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## 5. API Végpontok Specifikáció

### 5.1 tRPC Router struktúra

```typescript
// src/server/routers/_app.ts
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  owner: ownerRouter,
  property: propertyRouter,
  tenant: tenantRouter,
  provider: providerRouter,
  issue: issueRouter,
  offer: offerRouter,
  dashboard: dashboardRouter,
  report: reportRouter,
  settings: settingsRouter,
  export: exportRouter,
});
```

### 5.2 Példa router implementáció

```typescript
// src/server/routers/property.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

const PropertyCreateSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  ownerId: z.string(),
  type: z.enum(['APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL']),
  size: z.number().optional(),
  rooms: z.number().optional(),
  floor: z.number().optional(),
  rentAmount: z.number().optional(),
  currency: z.string().default('EUR'),
});

export const propertyRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
      status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE']).optional(),
      ownerId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, ownerId } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { street: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(status && { status }),
        ...(ownerId && { ownerId }),
      };

      const [properties, total] = await Promise.all([
        ctx.db.property.findMany({
          where,
          skip,
          take: limit,
          include: {
            owner: { include: { user: true } },
            currentTenant: { include: { user: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.property.count({ where }),
      ]);

      return {
        properties,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
    
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const property = await ctx.db.property.findUnique({
        where: { id: input },
        include: {
          owner: { include: { user: true } },
          currentTenant: { include: { user: true } },
          issues: { orderBy: { createdAt: 'desc' }, take: 5 },
          contracts: { orderBy: { startDate: 'desc' } },
        },
      });

      if (!property) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Property not found',
        });
      }

      return property;
    }),
    
  create: protectedProcedure
    .input(PropertyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        });
      }

      const property = await ctx.db.property.create({
        data: input,
      });

      return property;
    }),
    
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: PropertyCreateSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (!['ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN'].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        });
      }

      const property = await ctx.db.property.update({
        where: { id: input.id },
        data: input.data,
      });

      return property;
    }),
    
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      if (ctx.session.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete properties',
        });
      }

      await ctx.db.property.delete({
        where: { id: input },
      });

      return { success: true };
    }),

  uploadPhotos: protectedProcedure
    .input(z.object({
      propertyId: z.string(),
      photos: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const property = await ctx.db.property.update({
        where: { id: input.propertyId },
        data: {
          photos: { push: input.photos },
        },
      });

      return property;
    }),
});
```