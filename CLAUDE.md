# CLAUDE.md - Fejlesztési útmutató

## FONTOS: Mindig teszteld változtatás előtt!

**KÖTELEZŐ minden változtatás előtt futtatni:**
```bash
./scripts/test-before-change.sh
```

Ez ellenőrzi:
- ✅ Fut-e a fejlesztői szerver
- ✅ TypeScript hibák
- ✅ Build hibák
- ✅ Főbb oldalak működnek-e

## Fejlesztői parancsok

### Szerver indítása
```bash
npm run dev
```
A szerver a http://localhost:3333 címen fut!

### TypeScript ellenőrzés
```bash
npm run typecheck
```

### Build ellenőrzés
```bash
npm run build
```

### Adatbázis műveletek
```bash
# Migrációk futtatása
npx prisma migrate dev

# Adatbázis szinkronizálás (gyors)
npx prisma db push

# Seed adatok betöltése
npm run db:seed
```

## Projekt struktúra

- `/app` - Next.js App Router oldalak
- `/src/components` - Újrahasználható komponensek
- `/src/server` - tRPC backend logika
- `/src/lib` - Szolgáltatások és segédfunkciók
- `/prisma` - Adatbázis séma és migrációk
- `/public` - Statikus fájlok (ikonok, manifest.json, sw.js)
- `/scripts` - Fejlesztői segédeszközök

## Hibakezelés

Ha "Internal server error" hibát kapsz:
1. Ellenőrizd a dev szervert: `npm run dev`
2. Nézd meg a konzol hibákat
3. Futtasd: `./scripts/test-before-change.sh`
4. Ellenőrizd a .env fájlt (PORT=3333)

## Új funkciók (2025-05-28)

### Email rendszer
- **Email tesztelés**: Settings → Email → Test Email
- **Szolgáltatás**: Resend (nem nodemailer)
- **Fejlesztői mód**: Emailek a konzolra kerülnek
- **Production**: Valós email küldés a Resend API-n keresztül

### Export funkciók
- **PDF export**: Minden lista oldal tartalmaz PDF/Excel export gombokat
- **Excel export**: Formázott .xlsx fájlok letöltése
- **API végpontok**: 
  - GET `/api/export/excel?type=properties`
  - GET `/api/export/html?type=properties&list=true`

### PWA támogatás
- **Telepíthetőség**: Az app telepíthető minden platformon
- **Offline működés**: Alapvető funkciók internet nélkül is
- **PWA beállítások**: Settings → PWA beállítások
- **Service Worker**: Automatikus cache kezelés
- **Manifest**: `/public/manifest.json`

### Dashboard Analytics
- **Recharts integráció**: Interaktív grafikonok és diagramok
- **Valós adatok**: Adatbázis alapú statisztikák
- **Analytics router**: tRPC végpontok statisztikákhoz
- **4 fő vizualizáció**: Oszlop, kör, terület és vízszintes diagramok

### Workflow Automatizáció ⚡
- **Automatikus hibabejelentés kezelés**: Státusz átmenetek, eszkaláció, SLA követés
- **Időalapú szabályok**: Automatikus eszkaláció prioritás szerint
- **SLA határidők**: URGENT (2h), HIGH (8h), MEDIUM (24h), LOW (72h)
- **Cron job API**: `/api/cron/workflow` - Scheduled task végrehajtáshoz
- **Admin felület**: Settings → Workflow → Teljes monitoring és statisztikák
- **Email értesítések**: Automatikus eszkaláció email-ek vezetőknek
- **Workflow triggerek**: Létrehozás, hozzárendelés, kép feltöltés

### Jelentések rendszer 📊
- **4 jelentés típus**: Havi bevétel, hibabejelentések, ingatlan teljesítmény, bérlői elégedettség
- **PDF/Excel export**: HTML alapú PDF és formázott Excel fájlok
- **Valós adatok**: TRPC analytics API-ból származó statisztikák
- **Toast értesítések**: Sikeres/sikertelen letöltések jelzése
- **API végpont**: `/api/reports/generate` - Jelentés generálás és letöltés

### Profil kezelés 👤 MŰKÖDIK! (2025-06-03)
- **Valós profil frissítés**: TRPC user.update endpoint működő adatbázis mentéssel
- **Dashboard név megjelenítés**: tRPC getCurrentUser használatával
- **NextAuth session probléma**: Megoldva - custom mezők nem jelennek meg a session-ben
- **Form állapot kezelés**: Controlled inputs megfelelő state management-tel
- **Megoldás**: tRPC getCurrentUser endpoint az adatbázisból olvassa a user adatokat

### Cloud Storage rendszer ☁️ **VISSZAÁLLÍTVA!**
- **Cloudflare R2 integráció**: Teljes S3 kompatibilis cloud storage
- **Hybrid upload system**: R2 prioritás, lokális fallback
- **Fájl kezelő UI**: Feltöltés, letöltés, törlés, statisztikák
- **AWS SDK S3 client**: @aws-sdk/client-s3 és @aws-sdk/s3-request-presigner
- **API végpontok**: 
  - `/api/cloud-storage` - R2 management (GET/POST/DELETE)
  - `/api/upload` - Hibrid upload (R2 → lokális fallback)
- **Settings integráció**: Cloud Storage tab a beállításokban
- **Fájl műveletek**: 50MB limit, minden fájltípus, signed URLs

### Bérlői és ingatlan kezelési rendszer 🏠 **VISSZAÁLLÍTVA!**
- **Tulajdonos képfeltöltés**: Profilkép support tulajdonos létrehozáskor
- **Multi-step bérlő regisztráció**: 5 lépéses form (alapadatok → kapcsolat → profil → albérlők → ingatlan)
- **Ingatlan hozzárendelés**: Bérlő létrehozáskor direktben hozzárendelhető ingatlan
- **Automatikus szerződés létrehozás**: Bérleti szerződés automatikus generálás
- **Társbérlő kezelés**: Teljes co-tenant/subtenant támogatás

### Naptár rendszer 📅 **VISSZAÁLLÍTVA!**
- **Dashboard naptár widget**: Bérlési események és hibák megjelenítése
- **Ingatlan specifikus szűrés**: Naptár szűrése ingatlan szerint
- **Bérleti időszak vizualizáció**: Szerződés kezdés/befejezés, bérleti díj esedékesség
- **Esemény típusok**: Bérlés, hibabejelentés, ellenőrzés, egyéb
- **Interaktív naptár**: Kattintható napok és események
- **Napi esemény részletek**: Oldalsó panel esemény listával

### Szerződés sablon rendszer 📄 **MŰKÖDIK!** (2025-06-03)
- **Beépített sablonok**: Bérleti, karbantartási, üzemeltetési, közvetítői szerződések
- **Egyedi sablonok**: Saját szerződés sablonok létrehozása és kezelése
- **Változó kezelés**: Dinamikus változók definiálása és használata {{változó}} formátumban
- **Sablon előnézet**: Valós idejű előnézet változók kitöltésével
- **Automatikus kitöltés**: Szerződés létrehozásakor automatikus adatkitöltés
- **PDF export**: Szerződések nyomtatása és letöltése PDF formátumban
- **Teljes CRUD**: Sablonok létrehozása, szerkesztése, törlése, aktiválás/inaktiválás
- **✅ JAVÍTVA**: tRPC kontextus probléma és import útvonalak

### Rate Limiting rendszer 🛡️ **MŰKÖDIK!** (2025-06-03)
- **Next.js middleware alapú**: Edge Runtime kompatibilis rate limiting
- **LRU Cache**: In-memory cache gyors eléréshez és automatikus cleanup
- **IP alapú korlátozás**: Egyedi limitek IP címenként
- **Útvonal specifikus limitek**: Különböző API végpontokhoz eltérő korlátozások
- **HTTP 429 válaszok**: Standard rate limit túllépés kezelés
- **Rate limit headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Adaptív konfiguráció**: Különböző limitek auth, upload, export, email útvonalakhoz
- **Settings integráció**: Rate Limit beállítások és tesztelés admin felületen
- **API végpontok védelme**: Minden `/api/*` útvonal automatikusan védett

**Konfiguráció:**
- **API Routes**: 10 req/perc (általános)
- **Auth Routes**: 30 req/perc (bejelentkezés, regisztráció)
- **Session Routes**: 100 req/perc (NextAuth session ellenőrzés)
- **Upload Routes**: 5 req/perc (fájlfeltöltés)
- **Export Routes**: 20 req/perc (PDF/Excel export)
- **Email Routes**: 3 req/perc (email küldés)
- **tRPC Routes**: 60 req/perc (adatbázis műveletek)
- **Cron Routes**: 1 req/perc (background tasks)

### Új szolgáltatások
- `/src/lib/email.ts` - Email küldés Resend-del
- `/src/lib/excel.ts` - Excel export ExcelJS-sel
- `/src/lib/pdf-simple.ts` - PDF generálás HTML template-tel
- `/src/components/export-toolbar.tsx` - Export gombok komponens
- `/src/lib/workflow.ts` - Workflow automation engine
- `/src/components/dashboard/dashboard-charts.tsx` - Analytics diagramok
- `/app/api/cron/workflow/route.ts` - Cron job API
- `/app/dashboard/settings/workflow/page.tsx` - Workflow admin felület
- `/app/api/reports/generate/route.ts` - **ÚJ!** Jelentés generálás API
- `/src/server/routers/user.ts` - **ÚJ!** User.update endpoint profil kezeléshez
- `/src/components/ui/toast.tsx` - **ÚJ!** Toast notification rendszer
- `/src/scripts/check-user-data.ts` - **ÚJ!** Adatbázis debug script
- `/public/sw.js` - Service Worker offline támogatással
- `/src/lib/cloud-storage.ts` - **VISSZAÁLLÍTVA!** Cloudflare R2 storage service
- `/app/api/cloud-storage/route.ts` - **VISSZAÁLLÍTVA!** R2 API management
- `/app/dashboard/settings/cloud-storage/page.tsx` - **VISSZAÁLLÍTVA!** R2 kezelő UI
- `/src/components/ui/calendar.tsx` - **VISSZAÁLLÍTVA!** Egyedi naptár komponens date-fns-szel
- `/src/components/dashboard/calendar-widget.tsx` - **VISSZAÁLLÍTVA!** Dashboard naptár widget
- `/src/components/forms/property-assignment-step.tsx` - **VISSZAÁLLÍTVA!** Ingatlan hozzárendelő lépés
- `/app/dashboard/owners/new/page.tsx` - **FRISSÍTVE!** Tulajdonos képfeltöltéssel
- `/src/server/routers/owner.ts` - **FRISSÍTVE!** createWithUser endpoint képpel
- `/src/server/routers/contractTemplate.ts` - **ÚJ!** Szerződés sablon CRUD router
- `/app/dashboard/contracts/templates/**` - **ÚJ!** Szerződés sablon kezelő UI
- `/src/components/ui/switch.tsx` - **ÚJ!** Switch komponens Radix UI-val
- `/src/lib/rate-limit.ts` - **ÚJ!** Rate limiting core logic LRU cache-szel
- `/src/lib/rate-limit-config.ts` - **ÚJ!** Útvonal specifikus rate limit konfigurációk
- `/app/dashboard/settings/rate-limit/page.tsx` - **ÚJ!** Rate limit teszt felület
- `/app/api/test-rate-limit/route.ts` - **ÚJ!** Rate limit teszt endpoint
- `/jest.config.js` - **ÚJ!** Jest tesztkeret konfiguráció
- `/jest.setup.js` - **ÚJ!** Teszt környezet beállítás
- `/__tests__/**` - **ÚJ!** 23 sikeres teszt (komponens, utility, API)

## Tesztelési végpontok

- **Email teszt**: Settings → Email teszt oldal
- **PDF teszt**: Settings → PDF teszt oldal
- **PWA teszt**: Settings → PWA beállítások
- **Workflow teszt**: Settings → Workflow → Admin felület
- **Jelentések teszt**: Dashboard → Jelentések → PDF/Excel letöltés
- **Profil teszt**: Settings → Profil → Név módosítás és mentés
- **Cloud Storage teszt**: Settings → Cloud Storage → R2 kezelő felület
- **Szerződés sablonok**: Dashboard → Szerződések → Sablonok
- **Sablon előnézet**: Szerződés sablon → Előnézet gomb
- **Health check**: `/api/health-check`
- **Workflow cron**: `/api/cron/workflow` (GET/POST)
- **Reports API**: `/api/reports/generate` (POST)
- **Cloud Storage API**: `/api/cloud-storage` (GET/POST/DELETE)
- **Upload API**: `/api/upload` (POST) - R2 fallback lokális tárolóra
- **Debug script**: `npx tsx src/scripts/check-user-data.ts`
- **Rate Limit teszt**: Settings → Rate Limit → Teszt felület
- **Rate Limit API**: `/api/test-rate-limit` (GET/POST)
- **Jest tesztek**: `npm test` - 23 sikeres teszt
- **Teszt kategóriák**: `npm run test:components`, `npm run test:utils`, `npm run test:api`
- **Coverage**: `npm run test:coverage`

## FIGYELEM!

⚠️ SOHA ne változtass kódot anélkül, hogy előtte lefuttatnád a tesztelő scriptet!
⚠️ A szerver a 3333-as porton fut, NEM a 3000-en!
⚠️ PWA cache törléséhez: Settings → PWA → Cache törlése

## LEGFRISSEBB JAVÍTÁSOK (2025-06-03)

### Profil kezelés fix
**Probléma:** NextAuth session nem adja át a custom mezőket (firstName, lastName, phone)
**Megoldás:** tRPC getCurrentUser endpoint használata

```typescript
// Dashboard
const { data: currentUser } = api.user.getCurrentUser.useQuery()
const displayName = currentUser 
  ? `${currentUser.firstName} ${currentUser.lastName}`.trim() 
  : session.user.email?.split('@')[0]

// Settings
const { data: currentUser } = api.user.getCurrentUser.useQuery()
useEffect(() => {
  if (currentUser && !isFormInitialized) {
    setProfileData({
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email || '',
      phone: currentUser.phone || ''
    })
  }
}, [currentUser, isFormInitialized])
```

### Szerződés sablon rendszer javítások ✅ (2025-06-03)
**Probléma:** "Cannot read properties of undefined (reading 'findMany')" hiba a contractTemplate routerben
**Okozó tényezők:**
- tRPC middleware nem továbbította a `db` kontextust
- Helytelen import útvonalak a template komponensekben

**Megoldás:**
1. **tRPC kontextus javítás** - `/src/server/trpc.ts`:
```typescript
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
      db: ctx.db, // ← EZ HIÁNYZOTT!
    },
  })
})
```

2. **Import útvonal javítások:**
```typescript
// Rossz útvonalak:
import { api } from '@/lib/trpc-client'
import LoadingSpinner from '@/src/components/loading-spinner'

// Helyes útvonalak:
import { api } from '@/lib/trpc/client'
import LoadingSpinner from '@/components/loading-spinner'
```

**Javított fájlok:**
- `/app/dashboard/contracts/templates/page.tsx`
- `/app/dashboard/contracts/templates/[id]/preview/page.tsx`
- `/app/dashboard/contracts/templates/new/page.tsx`
- `/app/dashboard/contracts/templates/[id]/edit/page.tsx`

**Eredmény:** ✅ Szerződés sablon rendszer teljes mértékben működőképes

### Szolgáltató regisztráció kibővítése ✅ (2025-06-03)
**Cél:** Részletes szolgáltató adatok gyűjtése ingatlan hozzárendeléshez
**Új mezők:**
- **Alapadatok**: Cégnév, képviselő neve, megszólítás
- **Kapcsolattartás**: Email, weboldal
- **Üzleti adatok**: Adószám, bankszámlaszám  
- **Cím**: Teljes postacím
- **Szolgáltatási díjak**: Óradíj, kiszállási díj km-enként
- **Képek**: Cég logó, képviselő fénykép URL
- **Bővített szakterületek**: Medence-, riasztó-, kamera karbantartás

**Változtatások:**
1. **Provider model kibővítése** - `/prisma/schema.prisma`:
```prisma
model Provider {
  // Új mezők:
  representativeName String?
  salutation    String?
  email         String?
  website       String?
  taxNumber     String?
  bankAccount   String?
  street        String?
  city          String?
  postalCode    String?
  country       String?
  companyLogo   String?
  profilePhoto  String?
  travelFee     Decimal?
}
```

2. **Provider router frissítés** - Eltávolítva userId kötelező mező
3. **Új regisztrációs űrlap** - 5 szekciós, részletes adatgyűjtés
4. **Frissített lista oldal** - Cégnév, képviselő, óradíj megjelenítése

**Eredmény:** ✅ Szolgáltató regisztráció teljes mértékben kibővítve

### Fájlfeltöltés szolgáltatókhoz ✅ (2025-06-03)
**Módosítás:** URL mezők helyett valódi fájlfeltöltés
**Új komponens:** FileUpload - Újrahasználható fájlfeltöltő komponens

**Implementáció:**
```typescript
// FileUpload komponens jellemzők:
- Drag & drop támogatás
- Kép előnézet
- Fájlméret validáció (5MB max)
- Fájltípus validáció 
- R2/lokális tárolás automatikus váltás
- Loading és error állapotok
- Magyar nyelvű üzenetek
```

**Használat a Provider űrlapban:**
```typescript
<FileUpload
  label="Cég logó"
  value={companyLogo}
  onChange={setCompanyLogo}
  accept="image/*"
  maxSize={5}
  description="Maximális méret: 5MB. Támogatott formátumok: JPG, PNG, GIF, WebP"
/>
```

**Eredmény:** ✅ Professzionális fájlfeltöltés megvalósítva

### Rate Limiting implementálása ✅ (2025-06-03)
**Cél:** API végpontok védelme túlzott használat és támadások ellen
**Technológia:** Next.js middleware + LRU Cache

**Implementáció:**
1. **Core rate limiting library** - `/src/lib/rate-limit.ts`:
```typescript
import { LRUCache } from 'lru-cache'

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  })
  
  return {
    check: async (request: Request, limit: number, token: string) => {
      // Rate limiting logic with IP-based tracking
    }
  }
}
```

2. **Middleware integráció** - `/middleware.ts`:
```typescript
// Rate limiting for API routes
if (req.nextUrl.pathname.startsWith("/api/")) {
  const config = getRateLimitForPath(req.nextUrl.pathname)
  const { isRateLimited, remaining, reset } = await limiter.check(
    req, config.max, ip
  )
  
  if (isRateLimited) {
    return new NextResponse(JSON.stringify({
      error: 'Too Many Requests',
      retryAfter: Math.floor((reset - Date.now()) / 1000),
    }), { status: 429 })
  }
}
```

3. **Teszt eredmények** (2025-06-03 12:38-12:45):
- ✅ API korlátozás működik: 1. kérés OK (200), 2-12. kérés korlátozva (429)
- ✅ Rate limit headers: X-RateLimit-Limit: 10, X-RateLimit-Remaining: 0
- ✅ Retry-After header: 60 másodperc várakozási idő
- ✅ IP alapú tracking: IPv6 (::1) helyi fejlesztésben
- ✅ NextAuth session fix: Auth endpoints 100 req/perc limittel működnek
- ✅ Kijelentkezés probléma megoldva: Session ellenőrzés nem blokkolt

**Eredmény:** ✅ Teljes rate limiting védelem implementálva és tesztelve

### Basic Tests implementálása ✅ (2025-06-03)
**Cél:** Alkalmazás minőség biztosítása automatizált tesztekkel
**Technológia:** Jest + Testing Library

**Implementáció:**
1. **Jest konfiguráció** - `/jest.config.js`:
```javascript
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

2. **Teszt környezet setup** - `/jest.setup.js`:
```javascript
import '@testing-library/jest-dom'

// Polyfills for Node.js environment
global.Request = class Request { /* ... */ }
global.Response = class Response { /* ... */ }
global.NextResponse = { json: (data) => /* ... */ }

// Mock Next.js and NextAuth
jest.mock('next/navigation', () => ({ /* ... */ }))
jest.doMock('next-auth/react', () => ({ /* ... */ }))
```

3. **Teszt eredmények** (2025-06-03 13:10):
- ✅ **23 sikeres teszt** - 100% pass rate
- ✅ **4 teszt suite** - Components, utils, API, pages
- ✅ **Rate limiting tesztek** - Core logic és konfiguráció
- ✅ **UI komponens tesztek** - Button, Card komponensek
- ✅ **API endpoint tesztek** - Health check, rate limit API

**Teszt kategóriák:**
- **Unit tesztek**: Utility funkciók (rate limiting, konfiguráció)
- **Component tesztek**: React komponensek (Button, Card)
- **API tesztek**: Endpoint logika (health check, rate limit)
- **Integration tesztek**: tRPC routerek (előkészítve)

**Eredmény:** ✅ Stabil tesztkeret kész, 23 működő teszt

## AKTUÁLIS RENDSZER ÁLLAPOT (2025-06-03 13:10)

### 🟢 STABIL ÉS MŰKÖDŐKÉPES
- **Szerver**: localhost:3333 - fut ✅
- **Adatbázis**: PostgreSQL - szinkronban ✅  
- **tRPC API**: összes endpoint működik ✅
- **Fájlfeltöltés**: R2 + lokális hibrid ✅
- **Rate Limiting**: Aktív és tesztelve ✅
- **Health Check**: OK ✅

### 📋 MA ELVÉGZETT MUNKA
1. **Szerződés sablonok javítás** - tRPC kontextus hiba megoldva
2. **Szolgáltató regisztráció kibővítése** - 15+ új mező hozzáadva
3. **Fájlfeltöltés implementáció** - FileUpload komponens létrehozva
4. **UI egységesítés** - Mind a 8 lista oldal műveletek oszlopa egységesítve (ikon alapú)
5. **Lista optimalizálás** - Felesleges oszlopok eltávolítva (Offers: készítette, Providers: képviselő)
6. **Users oldal egyszerűsítés** - Dropdown menü helyett ikon gombok
7. **🛡️ Rate Limiting implementáció** - API védelem túlzott használat ellen
8. **🧪 Rate Limiting tesztelés** - Sikeres teszt és validáció

### 📂 BACKUP ÉS DOKUMENTÁCIÓ
- **Server logs**: `logs/backups/dev-server-20250603_*`
- **Visszaállítási pont**: `docs/RECOVERY_POINT_20250603_1115.md`
- **UI dokumentáció**: `docs/UI_STANDARDIZATION_20250603.md`
- **Változásnapló**: `docs/CHANGELOG_20250603.md`
- **Rate Limiting dokumentáció**: CLAUDE.md frissítve
- **Részletes dokumentációk**: `docs/` mappában
- **Git állapot**: 45+ módosított fájl, rate limiting hozzáadva, tesztelve és működik

### ✅ BEFEJEZETT FEJLESZTÉSEK (hiányzó funkciók implementálva)
1. **🔐 Forgot password functionality** - KÉSZ ✅
2. **🏢 Company logo upload UI** - KÉSZ ✅
3. **🛡️ Rate limiting** - KÉSZ ✅
4. **📱 PWA install prompt** - KÉSZ ✅ (működött korábban is)
5. **🧪 Basic tests** - KÉSZ ✅ (Jest, 23 sikeres teszt)

### 🏁 PRODUCTION READY ÁLLAPOT ELÉRÉSE
**EGYETLEN funkció hiányzik a teljes production readiness-hez:**
1. **📊 Sentry error tracking** - Éles hibák monitorozása

### 🔧 OPCIONÁLIS FEJLESZTÉSI LEHETŐSÉGEK (nem kritikus)
1. Ingatlan-szolgáltató kapcsolatok
2. Automatikus árazási logika  
3. Szolgáltató értékelési rendszer
4. Ajánlatkérés funkció

### 🎯 KÖVETKEZŐ LÉPÉS: SENTRY ERROR TRACKING
A basic tests befejezése után a következő és UTOLSÓ hiányzó kritikus funkció a Sentry error tracking implementálása.