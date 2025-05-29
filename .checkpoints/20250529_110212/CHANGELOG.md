# Változásnapló

## [1.13.0] - 2025.05.29

### Hozzáadva
- Production deployment előkészítés teljes implementáció
  - Environment változók dokumentáció (.env.production.example)
  - Database connection pooling optimalizáció
  - Security headers és rate limiting middleware
  - Sentry error monitoring integráció
  - Production deployment checklist
  - Docker support (Dockerfile és .dockerignore)
- Next.js production optimalizációk
  - Image optimization
  - Console log eltávolítás production-ben
  - Security headers
  - Build optimalizációk

### Módosítva
- Prisma client production optimalizációkkal
- Next.js konfiguráció production beállításokkal
- Middleware security headers és rate limiting

## [1.12.0] - 2025.05.29

### Hozzáadva
- Duplicate file cleanup és szervezés
- Backup mappa létrehozása duplikált fájloknak
- CLEANUP_SUMMARY.md dokumentáció

### Módosítva
- Projekt struktúra tisztítása és egyszerűsítése

### Eltávolítva
- /src/app/ mappa (duplikált, régi verzió)
- Régi log fájlok (backup-ba helyezve)
- postcss.config.js (postcss.config.mjs használata)
- Régi dashboard-stats.tsx komponens
- Régi SESSION_LOG és CHECKPOINT fájlok

## [1.11.0] - 2025.05.29

### Hozzáadva
- Admin-only felhasználókezelés teljes implementáció
  - User management API (CRUD műveletek)
  - Automatikus jelszó generálás (12 karakter, erős)
  - Welcome email sablonok új felhasználóknak
  - Admin notification rendszer új admin létrehozáskor
  - Settings/Users oldal felhasználók kezelésére
  - CreateUserForm és CreateAdminForm komponensek
  - Jelszó visszaállítás funkció
- Comprehensive seed adatok
  - 10 rekord minden entitáshoz (owner, tenant, provider, property, issue, offer)
  - 5 szerződéssablon (Standard, Üzleti, Diák, Szezonális, Albérlet)
  - 95 pénzügyi tranzakció (bevételek és kiadások)
- Transaction modell és tábla a pénzügyi adatokhoz
- Settings layout és navigáció

### Módosítva
- Analytics router frissítve valós Transaction adatok használatára
- Owner, Tenant, Provider router-ek frissítve új password/email funkciókkal
- Dashboard pénzügyi összesítő most valós adatokat mutat
- Import path-ok javítva (~/... helyett relatív path-ok)

### Javítva
- Pénzügyi összesítő 0 értékek hibája
- SQL oszlopnév hibák (date vs transactionDate)
- Module not found hibák a router-ekben

## [1.10.0] - 2025.05.28

### Hozzáadva
- Teljes mobil reszponzivitás
- PWA képességek (offline, telepíthető)
- Email értesítések (Resend integráció)
- PDF/Excel export funkciók

### Javítva
- 165 TypeScript hiba → 0 hiba
- Form hozzáférhetőségi problémák
- Mobil navigáció

## [1.0.0] - 2025.05.27

### Hozzáadva
- Projekt alapok
- NextAuth v5 autentikáció
- Teljes CRUD minden entitáshoz
- Dashboard analytics
- Szerződéskezelés
- Hibabejelentés workflow
- Ajánlatkezelés