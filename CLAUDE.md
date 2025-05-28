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

### Profil kezelés 👤 ÚJ!
- **Valós profil frissítés**: TRPC user.update endpoint működő adatbázis mentéssel
- **Dashboard név megjelenítés**: Dinamikus session alapú üdvözlés
- **NextAuth session kezelés**: JWT callback automatikus adatbázis szinkronizáció
- **Form állapot kezelés**: Controlled inputs megfelelő state management-tel
- **Session cache megoldás**: Automatikus page reload session frissítéshez

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

## Tesztelési végpontok

- **Email teszt**: Settings → Email teszt oldal
- **PDF teszt**: Settings → PDF teszt oldal
- **PWA teszt**: Settings → PWA beállítások
- **Workflow teszt**: Settings → Workflow → Admin felület
- **Jelentések teszt**: Dashboard → Jelentések → PDF/Excel letöltés
- **Profil teszt**: Settings → Profil → Név módosítás és mentés
- **Health check**: `/api/health-check`
- **Workflow cron**: `/api/cron/workflow` (GET/POST)
- **Reports API**: `/api/reports/generate` (POST)
- **Debug script**: `npx tsx src/scripts/check-user-data.ts`

## FIGYELEM!

⚠️ SOHA ne változtass kódot anélkül, hogy előtte lefuttatnád a tesztelő scriptet!
⚠️ A szerver a 3333-as porton fut, NEM a 3000-en!
⚠️ PWA cache törléséhez: Settings → PWA → Cache törlése

## Legutóbbi javítások (2025-05-28 Délután)

### Képfeltöltés javítás ✅
- **Probléma**: Blob URL-ek validációs hibát okoztak
- **Megoldás**: Valós fájl mentés `/public/uploads` mappába
- **Érintett**: Property creation form

### Form validáció javítás ✅
- **Probléma**: Number vs String típus eltérések
- **Megoldás**: Zod union típusok használata
- **Schema**: Elfogadja mind string, mind number inputokat

### Session cache probléma ✅
- **Probléma**: NextAuth nem frissíti automatikusan a session adatokat
- **Megoldás**: Kijelentkezés + újra bejelentkezés szükséges
- **Debug**: `/api/debug-session` endpoint elérhető

### Contract Templates rendszer ✅
- **Új funkció**: Teljes szerződés sablon kezelés
- **UI**: Templates admin, generálás, digitális aláírás
- **API**: Contracts tRPC router