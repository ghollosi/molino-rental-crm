# Változásnapló - Molino RENTAL CRM

Minden jelentős változás dokumentálva van ebben a fájlban.

A formátum a [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) alapján készült,
és a projekt követi a [Semantic Versioning](https://semver.org/spec/v2.0.0.html) szabványt.

## [Unreleased]

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
- Működő bejelentkezési folyamat
- Admin felhasználó létrehozó script

### Módosítva - 2025-05-27
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