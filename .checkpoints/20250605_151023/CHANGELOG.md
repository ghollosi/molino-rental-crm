# Változásnapló - Molino RENTAL CRM

Minden jelentős változás dokumentálva van ebben a fájlban.

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) alapján készült,
és a projekt követi a [Semantic Versioning](https://semver.org/spec/v2.0.0.html) szabványt.

## [Unreleased]

### Hozzáadva - 2025-06-05
- **Ingatlan férőhelyek száma (capacity) funkció:**
  - Új capacity mező az ingatlan adatmodellben (opcionális pozitív integer)
  - Capacity input mező az új ingatlan létrehozó formban
  - Capacity szerkesztési lehetőség a meglévő ingatlan módosító formban
  - "Férőhelyek" oszlop az ingatlan lista táblázatban ("X fő" formátum)
  - Capacity megjelenítés az ingatlan részletek oldalon ("Férőhelyek száma: X fő")
  - Automatikus validáció pozitív egész számokra
  - Üres értékek ("-") kezelése minden megjelenítési helyen
  
### Módosítva - 2025-06-05
- Prisma schema kiterjesztése capacity mezővel
- Property API router frissítése capacity validációval
- Property form komponensek grid layout optimalizálása (lg:grid-cols-4)
- tRPC PropertyCreateSchema frissítése capacity támogatással

### Hozzáadva - 2025-05-28 (Este)
- PWA (Progressive Web App) támogatás:
  - manifest.json konfigurációs fájl
  - Service Worker offline támogatással
  - Offline.html fallback oldal
  - App ikonok generálása (SVG formátumban)
  - PWA meta tagek a layout-ban
  - Telepítési prompt komponens
  - PWA beállítások admin oldal
  - Health-check API végpont
- Cache stratégia implementálása:
  - Network-first megközelítés
  - Statikus asset-ek cache-elése
  - API hívások kizárása a cache-ből
- PWA funkciók:
  - Offline működés alapvető funkciókkal
  - Telepíthetőség asztali és mobil eszközökön
  - Automatikus frissítés a háttérben
  - Push értesítések előkészítése

### Hozzáadva - 2025-05-28 (Délután)
- PDF és Excel export funkció minden entitás listához:
  - Ingatlanok lista export (PDF/Excel)
  - Tulajdonosok lista export (PDF/Excel)
  - Bérlők lista export (PDF/Excel)
  - Hibabejelentések lista export (PDF/Excel)
  - Ajánlatok lista export (PDF/Excel)
  - Szolgáltatók lista export (PDF/Excel)
- Újrahasználható ExportToolbar komponens
- Excel export szolgáltatás ExcelJS könyvtárral
- PDF lista export HTML alapú megoldással
- Sonner toast könyvtár hibaüzenetekhez

### Javítva - 2025-05-28 (Délután)
- API végpontok GET metódus támogatása hozzáadva export funkciókhoz
- Hibaüzenetek magyarra fordítva az export funkcióknál
- Részletesebb hibakezelés az export műveletekhez

### Hozzáadva - 2025-05-28 (Délelőtt)
- Email értesítési rendszer Resend szolgáltatással
- Automatikus email küldés új hibabejelentésekhez
- Email tesztküldési felület a beállításokban
- HTML email sablonok modern, reszponzív dizájnnal
- PDF export funkció ajánlatokhoz (HTML alapú, böngésző print dialógus)
- PDF teszt oldal a beállításokban

### Javítva - 2025-05-28 (Délelőtt)
- Radix UI Select komponens üres érték hiba - az üres stringek 'all' értékre cserélve
- Prisma Decimal típus konverziós hiba javítva (toNumber() helyett Number())

### Hozzáadva - 2025-05-28 (Reggel)
- Összecsukható oldalsáv Context API-val
- Képfeltöltési funkció ingatlanokhoz és hibabejelentésekhez
- Gyors tulajdonos létrehozás modal az ingatlan formoknál
- Keresés és szűrés az ingatlanok listájában (típus és státusz szerint)
- Keresés és szűrés a hibabejelentések listájában (státusz és prioritás szerint)

### Hozzáadva - 2025-05-27
- NextAuth.js v5 konfiguráció bcryptjs támogatással
- Prisma client inicializálása és adatbázis kapcsolat
- tRPC teljes implementáció 8 routerrel:
  - auth: regisztráció, session kezelés, profil frissítés
  - user: felhasználók listázása és kezelése
  - property: ingatlanok CRUD műveletek
  - owner: tulajdonosok kezelése
  - tenant: bérlők kezelése
  - provider: szolgáltatók kezelése
  - issue: hibabejelentések kezelése
  - offer: ajánlatok kezelése
- Middleware auth védelem
- Dashboard layout és navigáció
- shadcn/ui komponensek (9 db):
  - Button, Input, Label, Card, Alert
  - Select, Dropdown Menu, Avatar, Badge
- Dashboard komponensek:
  - Statisztikák, Gyors műveletek
  - Legutóbbi hibabejelentések
  - Ingatlan áttekintő
- Ingatlanok teljes CRUD funkciók (lista, létrehozás, részletek)
- Tulajdonosok teljes CRUD funkciók
- Bérlők teljes CRUD funkciók
- Dashboard valós adatok integrálása
- tRPC client konfiguráció
- Fejlesztői környezet stabilizálása (dev-server.sh)
- QUICK_START.md dokumentáció
- Működő bejelentkezési folyamat
- Admin felhasználó létrehozó script

### Módosítva - 2025-05-27
- Sidebar navigációs linkek frissítve a helyes útvonalakra
- Package.json beállítva a fix 3333-as portra
- .env.local frissítve a 3333-as port használatára

### Javítva - 2025-05-27
- tRPC auth import hiba ideiglenesen megoldva
- NextAuth konfiguráció egyszerűsítve a stabilitás érdekében
- Port konfliktusok automatikus kezelése
- Tailwind CSS v4-ről v3-ra downgrade (shadcn/ui kompatibilitás)
- Route struktúra egyszerűsítése
- Auth middleware ideiglenes egyszerűsítése

### Hozzáadva - 2025-05-26
- Alapvető routing struktúra
- Login és Register oldalak
- Magyar nyelvű UI

### Hozzáadva - 2025-01-26
- Projekt inicializálás Next.js 14+ alapokkal
- TypeScript és Tailwind CSS konfiguráció
- Alapvető dokumentáció struktúra (DEVELOPMENT_DOCS.md, PROGRESS.md, CHANGELOG.md)
- Prisma schema definíció
- VS Code workspace konfiguráció
- Session recovery scriptek

### Következő lépések
- CRUD oldalak implementálása
- Valós adatok megjelenítése
- Képfeltöltés
- Többnyelvűség
- Email integráció