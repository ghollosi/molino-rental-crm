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

## Új funkciók (2025-05-28 - Frissítve)

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

### Profil kezelés 👤
- **Valós profil frissítás**: TRPC user.update endpoint működő adatbázis mentéssel
- **Dashboard név megjelenítés**: Dinamikus session alapú üdvözlés
- **NextAuth session kezelés**: JWT callback automatikus adatbázis szinkronizáció
- **Form állapot kezelés**: Controlled inputs megfelelő state management-tel
- **Session cache megoldás**: Automatikus page reload session frissítéshez

### Dashboard Quick Wins 🚀 ÚJ!
- **Pénzügyi összesítő widget**: Havi/éves bevétel, kintlévőségek, kihasználtság
- **Lejáró szerződések widget**: Következő 60 napban lejáró szerződések listája
- **Email notification templates**: Fizetési emlékeztetők és szerződés lejárat értesítések
- **Scheduled tasks**: Automatikus email küldés cron job-okkal
- **Valós adatok**: Minden widget az adatbázisból származó valós adatokat jelenít meg
- **TRPC analytics API**: Új végpontok dashboard statisztikákhoz
- **Responsive layout**: 2x2 grid elrendezés optimális megjelenítéshez

### Új szolgáltatások
- `/src/lib/email.ts` - Email küldés Resend-del
- `/src/lib/excel.ts` - Excel export ExcelJS-sel
- `/src/lib/pdf-simple.ts` - PDF generálás HTML template-tel
- `/src/components/export-toolbar.tsx` - Export gombok komponens
- `/src/lib/workflow.ts` - Workflow automation engine
- `/src/components/dashboard/dashboard-charts.tsx` - Analytics diagramok
- `/app/api/cron/workflow/route.ts` - Cron job API
- `/app/dashboard/settings/workflow/page.tsx` - Workflow admin felület
- `/app/api/reports/generate/route.ts` - Jelentés generálás API
- `/src/server/routers/user.ts` - User.update endpoint profil kezeléshez
- `/src/components/ui/toast.tsx` - Toast notification rendszer
- `/src/scripts/check-user-data.ts` - Adatbázis debug script
- `/public/sw.js` - Service Worker offline támogatással
- `/src/components/dashboard/financial-summary.tsx` - **ÚJ!** Pénzügyi összesítő widget
- `/src/components/dashboard/expiring-contracts.tsx` - **ÚJ!** Lejáró szerződések widget
- `/src/lib/scheduled-tasks.ts` - **ÚJ!** Automatikus feladat végrehajtás
- `/app/api/cron/notifications/route.ts` - **ÚJ!** Notification cron job API
- `/src/components/ui/skeleton.tsx` - **ÚJ!** Loading skeleton komponens

## Tesztelési végpontok

- **Email teszt**: Settings → Email teszt oldal
- **PDF teszt**: Settings → PDF teszt oldal
- **PWA teszt**: Settings → PWA beállítások
- **Workflow teszt**: Settings → Workflow → Admin felület
- **Jelentések teszt**: Dashboard → Jelentések → PDF/Excel letöltés
- **Profil teszt**: Settings → Profil → Név módosítás és mentés
- **Dashboard widgets teszt**: `/dashboard/test-widgets` - Widget teszt oldal (frissített layout)
- **Health check**: `/api/health-check`
- **Workflow cron**: `/api/cron/workflow` (GET/POST)
- **Notification cron**: `/api/cron/notifications` (GET/POST)
- **Reports API**: `/api/reports/generate` (POST)
- **Debug script**: `npx tsx src/scripts/check-user-data.ts`
- **Analytics debug**: `npx tsx scripts/check-all-dashboard-data.ts`
- **Issues debug**: `npx tsx scripts/check-issues-data.ts`
- **Email system test**: `npx tsx scripts/test-email-system.ts` - **ÚJ!**
- **Scheduled tasks test**: `npx tsx scripts/test-scheduled-tasks.ts` - **ÚJ!**
- **Payment data check**: `npx tsx scripts/test-outstanding-payments.ts` - **ÚJ!**
- **Cron logic test**: `npx tsx scripts/test-cron-logic.ts` - **ÚJ!**

## FIGYELEM!

⚠️ SOHA ne változtass kódot anélkül, hogy előtte lefuttatnád a tesztelő scriptet!
⚠️ A szerver a 3333-as porton fut, NEM a 3000-en!
⚠️ PWA cache törléséhez: Settings → PWA → Cache törlése

## Legutóbbi fejlesztések (2025-05-28 Este/Éjjel)

### MOBIL OPTIMALIZÁCIÓ TELJES ✅ **ÚJ!**
- **Hamburger Navigation**: Működő mobil menü overlay-vel és smooth animációkkal
- **Responsive Layout**: Stack layout mobilon, 2-column tablet+, grid desktop
- **Touch-friendly UI**: 44px+ touch target-ek, megfelelő spacing
- **Typography scaling**: `text-xs md:text-sm` progressive enhancement
- **Mobile-first approach**: Minden widget optimalizált kis képernyőkre
- **Cross-device testing**: iPhone SE (375px) → Desktop (1200px+) teljes kompatibilitás

### Dashboard Quick Wins TELJES implementáció ✅
- **3 fő widget**: Pénzügyi összesítő, Lejáró szerződések, Kintlévőségek követése
- **Email notification rendszer**: Production ready Resend integráció
- **Scheduled tasks**: Automatikus értesítések cron job-okkal
- **Valós adatok**: 530K Ft bevétel, 2 kintlévőség, 1 lejáró szerződés

### Dashboard UI/UX javítások ✅
- **Layout problémák megoldva**: Kilógó gombok, összecsúszott szövegek javítva
- **2+1 oszlopos elrendezés**: Pénzügyi + Szerződések (2 oszlop), Kintlévőségek (teljes szélesség)
- **Színes widget design**: Zöld, kék, narancs, lila témák jobb vizuális hierarchiáért
- **Responsive optimalizáció**: Jobb mobil előkészítés

### Email rendszer production ready ✅
- **Payment reminder templates**: Sürgősségi szintekkel és HTML stílussal
- **Contract expiry notifications**: Automatikus lejárat értesítések
- **Dev mode console logging**: Valós API kulcs nélkül is tesztelhető
- **Scheduled task automation**: Cron job API és logika teljes

### Valós adatok validáció ✅
- **4 ingatlan**: 2 elérhető, 2 bérelt (50% kihasználtság)
- **530,000 Ft/hó bevétel**: DRAFT szerződésekből számolva
- **2 kintlévőség**: Szabó Péter (180K, 23 nap) + Tóth Anna (350K, 27 nap)
- **1 lejáró szerződés**: Tóth Anna szerződése 3 nap múlva lejár

### Mobil specifikus komponensek **ÚJ!**
- `/src/contexts/sidebar-context.tsx` - Mobil navigation state management
- `/src/components/layouts/header.tsx` - Hamburger menu integration  
- `/src/components/layouts/sidebar.tsx` - Overlay mobile sidebar
- `/scripts/mobile-test-guide.md` - Comprehensive mobile testing guide
- `/scripts/mobile-test-automated.js` - Browser console testing utilities
- `/scripts/mobile-test-report.md` - Full mobile optimization test results