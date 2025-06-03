# Szolgáltató Regisztráció Kibővítése

**Dátum:** 2025-06-03  
**Státusz:** ✅ BEFEJEZVE  
**Verzió:** v2.0 - Teljes újratervezés

## Probléma és Cél

Az eredeti szolgáltató regisztráció túl egyszerű volt:
- Felhasználó kiválasztás kötelező volt
- Kevés adat gyűjtése
- Nem alkalmas ingatlan-szolgáltató kapcsolatok kezelésére

**Új cél:** Részletes szolgáltató adatok gyűjtése a jövőbeli ingatlan hozzárendelésekhez.

## Új Mezők és Funkciók

### 1. Alapadatok Szekció
- **Cégnév / Vállalkozás neve** (kötelező)
- **Megszólítás** (Úr/Asszony/Dr./Mérnök)
- **Képviselő neve**

### 2. Kapcsolattartási Adatok
- **Email cím** (validált)
- **Weboldal** (URL validált)

### 3. Üzleti Adatok
- **Adószám**
- **Bankszámlaszám**

### 4. Postacím
- **Utca, házszám**
- **Város**
- **Irányítószám**
- **Ország** (alapértelmezett: Magyarország)

### 5. Szolgáltatási Díjak
- **Óradíj** (EUR/HUF/USD)
- **Kiszállási díj km-enként**
- **Pénznem választás**

### 6. Képek/Logók (Fájlfeltöltés)
- **Cég logó feltöltés** (5MB max, JPG/PNG/GIF/WebP)
- **Képviselő fénykép feltöltés** (5MB max, JPG/PNG/GIF/WebP)

### 7. Bővített Szakterületek
Új szakmák hozzáadva:
- Medence karbantartás
- Riasztó rendszer
- Kamerák telepítése
- Ablak tisztítás

## Technikai Implementáció

### Database Schema Változások
```prisma
model Provider {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  
  // Basic company info
  businessName  String
  representativeName String? // Képviselő neve
  salutation    String?    // Megszólítás (Mr./Ms./Dr.)
  
  // Contact details
  email         String?
  website       String?
  
  // Business details
  taxNumber     String?    // Adószám
  bankAccount   String?    // Bankszámlaszám
  
  // Address
  street        String?
  city          String?
  postalCode    String?
  country       String?
  
  // Photos/logo
  companyLogo   String?    // Cég logó URL
  profilePhoto  String?    // Képviselő fénykép URL
  
  // Service details
  specialty     String[]   // Array of specialties
  hourlyRate    Decimal?   // Óradíj
  travelFee     Decimal?   // Kiszállási díj per km
  currency      String     @default("EUR")
  
  // Availability stored as JSON
  availability  Json       @default("{}")
  
  rating        Float?     @default(0)
  
  assignedIssues Issue[]
  
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
```

### tRPC Router Módosítások

#### Create Input Schema
```typescript
.input(z.object({
  // Basic company info
  businessName: z.string().min(1, 'Cégnév megadása kötelező'),
  representativeName: z.string().optional(),
  salutation: z.string().optional(),
  
  // Contact details
  email: z.string().email('Érvényes email cím szükséges').optional(),
  website: z.string().url('Érvényes weboldal cím szükséges').optional(),
  
  // Business details
  taxNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  
  // Address
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  
  // Photos
  companyLogo: z.string().optional(),
  profilePhoto: z.string().optional(),
  
  // Service details
  specialty: z.array(z.string()).min(1, 'Legalább egy szakterület megadása kötelező'),
  hourlyRate: z.number().positive('Az óradíj pozitív szám kell legyen').optional(),
  travelFee: z.number().min(0, 'A kiszállási díj nem lehet negatív').optional(),
  currency: z.string().default('EUR'),
  availability: z.record(z.any()).optional(),
}))
```

#### Automatikus User Létrehozás
```typescript
// Create a new user for the provider (simplified approach)
const user = await ctx.db.user.create({
  data: {
    email: input.email || `provider-${Date.now()}@temp.local`,
    password: 'temp-password',
    firstName: input.representativeName || 'Szolgáltató',
    lastName: '',
    role: 'PROVIDER',
    isActive: true,
  },
})

const provider = await ctx.db.provider.create({
  data: {
    ...input,
    userId: user.id,
  },
})
```

### UI Komponens Változások

#### Új Űrlap Felépítés
5 jól elkülönített szekció:
1. **Alapadatok** - Building2 ikon
2. **Kapcsolattartás** - Globe ikon  
3. **Üzleti adatok** - CreditCard ikon
4. **Cím** - MapPin ikon
5. **Szolgáltatási adatok** - User ikon
6. **Képek** - Upload ikon

#### Responsive Design
- 1-4 oszlopos grid layout
- Mobilon összecsukva
- Tableten 2 oszlop
- Desktopon 3-4 oszlop

#### Form Validation
- React Hook Form + Zod
- Valós idejű validáció
- Magyar hibaüzenetek
- URL és email validáció

### Lista Oldal Frissítések

#### Új Oszlopok
| Régi | Új |
|------|-----|
| Név | Cégnév |
| Email | Képviselő |
| Telefon | Email |
| Szolgáltatások | Szolgáltatások |
| - | **Óradíj** |
| Értékelés | Értékelés |
| Státusz | Státusz |

#### Adatok Megjelenítése
```typescript
// Cégnév megjelenítése
{provider.businessName}

// Képviselő megjelenítése
{provider.representativeName ? (
  <>
    {provider.salutation && <span className="mr-1">{provider.salutation}</span>}
    {provider.representativeName}
  </>
) : (
  <span className="text-gray-400">-</span>
)}

// Óradíj megjelenítése
{provider.hourlyRate ? (
  <div className="font-medium">
    {provider.hourlyRate} {provider.currency}
  </div>
) : (
  <span className="text-gray-400">-</span>
)}
```

## Tesztelési Eredmények

### Functional Tests ✅
- ✅ Új szolgáltató regisztráció
- ✅ Űrlap validáció
- ✅ Adatbázis mentés
- ✅ Lista oldal megjelenítés
- ✅ Szakterület kezelés
- ✅ Pénznem váltás

### Database Tests ✅
- ✅ Prisma migráció sikerült
- ✅ Új mezők elérhetők
- ✅ Kapcsolatok működnek
- ✅ Automatikus user létrehozás

### API Tests ✅
- ✅ Provider create endpoint
- ✅ Provider list endpoint
- ✅ Validáció működik
- ✅ Hibakezelés megfelelő

## Jövőbeli Fejlesztések

### Property-Provider Kapcsolatok
A következő lépések a kibővített adatok felhasználásához:

1. **Ingatlan szinten szolgáltató hozzárendelés**
   - Rendszeres szolgáltatók (kertész, takarító)
   - Alkalmi szolgáltatók (villanyszerelő)

2. **Szolgáltató szinten ingatlan hozzárendelés**
   - Egy szolgáltató több ingatlant kezelhet
   - Ingatlan specifikus árazás

3. **Automatikus árazás**
   - Óradíj + kiszállási díj számítás
   - Távolság alapú díjszabás
   - Rendszeres szolgáltatásoknál havi átalány

4. **Értékelési rendszer**
   - Szolgáltatás minőségének követése
   - Automatikus ajánlás rendszer

## Fájlfeltöltés Implementáció

### FileUpload Komponens
**Létrehozott fájl:** `/src/components/ui/file-upload.tsx`

```typescript
interface FileUploadProps {
  label: string
  value?: string
  onChange: (url: string | undefined) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  description?: string
  disabled?: boolean
}
```

**Főbb jellemzők:**
- ✅ Fájlméret validáció (alapértelmezett: 5MB)
- ✅ Fájltípus validáció (image/* alapértelmezett)
- ✅ Kép előnézet megjelenítés
- ✅ Drag & drop támogatás
- ✅ Loading és error állapotok
- ✅ R2 cloud storage / lokális tárolás híbrид rendszer
- ✅ Magyar nyelvű hibaüzenetek
- ✅ Responsive design

**Integráció az API-val:**
- Használja a meglévő `/api/upload` végpontot
- Automatikus R2 → lokális fallback
- Biztonságos fájlfeltöltés

## Változtatott Fájlok

### Backend
- `/prisma/schema.prisma` - Provider model bővítése
- `/src/server/routers/provider.ts` - Create/Update logika

### Frontend  
- `/app/dashboard/providers/new/page.tsx` - Teljes újraírás FileUpload-dal
- `/app/dashboard/providers/page.tsx` - Lista frissítés
- `/src/components/ui/file-upload.tsx` - **ÚJ** Fájlfeltöltő komponens

### Documentation
- `/docs/PROVIDER_REGISTRATION_ENHANCEMENT.md` - Ez a dokumentum
- `/CLAUDE.md` - Frissített fejlesztői útmutató

## Visszaállítási Információk

Ha vissza kell állítani az eredeti állapotot:

1. **Database rollback:**
```bash
# Új mezők eltávolítása (VIGYÁZAT!)
npx prisma db push --force-reset
```

2. **Code rollback:**
- Provider router create logika
- Új űrlap komponens
- Lista oldal módosítások

**Backup location:** `logs/dev-server-20250603_*_provider_enhancement.log`

## Összefoglalás

✅ **Sikeresen kibővítettük a szolgáltató regisztrációt**
- Részletes adatgyűjtés
- Professzionális űrlap design
- Automatikus user kezelés
- Jövőbeli funkciókra felkészítés

A rendszer most készen áll a szolgáltató-ingatlan kapcsolatok kezelésére és a bővített díjszabási logikára.