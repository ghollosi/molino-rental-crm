# 🏢 MOLINO RENTAL CRM

> **Teljes funkcionalitású ingatlan bérlés menedzsment rendszer**

Modern, Next.js alapú CRM alkalmazás ingatlan tulajdonosok, bérlők és szerződések kezelésére. TypeScript, Prisma ORM és tRPC technológiákkal építve.

## 🚀 GYORS INDÍTÁS

### Telepítés
```bash
git clone [repository-url]
cd molino-rental-crm
npm install
```

### Environment Setup
```bash
cp .env.example .env.local
# Konfiguráld az environment változókat
```

### Adatbázis Setup
```bash
npx prisma migrate dev
npx prisma db seed
```

### Fejlesztés indítása
```bash
npm run dev
```

🌐 **Alkalmazás elérése:** [http://localhost:3333](http://localhost:3333)

---

## ✨ FUNKCIÓK

### 🏠 Ingatlan Kezelés
- ✅ Teljes CRUD műveletek
- ✅ Képfeltöltés (R2 cloud storage)
- ✅ Státusz kezelés (Elérhető/Bérelt/Karbantartás)
- ✅ Típus kategorizálás (Lakás/Ház/Iroda/Üzlet)
- ✅ Részletes ingatlan profil oldal

### 👤 Bérlő Menedzsment
- ✅ Bérlő regisztráció property hozzárendeléssel
- ✅ Automatikus szerződés létrehozás
- ✅ Albérlő támogatás (fő- és albérlő kapcsolat)
- ✅ Bérlési időszak kezelés
- ✅ Kontakt információk

### 👥 Tulajdonos Kezelés
- ✅ Magánszemély és cég támogatás
- ✅ Több ingatlan kezelése
- ✅ Adószám és céginformációk
- ✅ Kapcsolattartási adatok

### 📋 Szerződés Kezelés
- ✅ Automatikus szerződés generálás
- ✅ Bérleti díj és kaució kezelés
- ✅ Fizetési napok beállítása
- ✅ Szerződés státuszok (Aktív/Lejárt/Felmondott)

### 🚨 Hibabejelentés Rendszer
- ✅ Prioritás alapú hibakezelés (Alacsony/Közepes/Magas/Sürgős)
- ✅ Kategória szerinti csoportosítás
- ✅ Státusz követés (Nyitott/Folyamatban/Megoldva/Lezárva)
- ✅ Hibabejelentés ingatlanhoz rendelés

### 📅 Ingatlan Naptár ⭐ **ÚJ**
- ✅ Interaktív naptár SimplePropertyCalendar komponenssel
- ✅ Bérlési események megjelenítése
- ✅ Hibabejelentések naptárban
- ✅ Magyar lokalizáció
- ✅ Esemény részletek panel

### 📊 Dashboard & Analytics
- ✅ Főoldal dashboard widget-ekkel
- ✅ Statisztikák (ingatlanok, bérlők, bevételek)
- ✅ Pénzügyi összesítők
- ✅ Közeljövőbeli események

### ☁️ Felhő Integráció
- ✅ Cloudflare R2 storage képfeltöltéshez
- ✅ CDN optimalizált képkiszolgálás
- ✅ Biztonságos fájlkezelés

---

## 🛠️ TECHNOLÓGIAI STACK

### Frontend
- **Next.js 15+** - App Router, Server Components
- **React 18+** - Hooks, Suspense
- **TypeScript** - Strict type safety
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern UI component library

### Backend
- **tRPC** - Type-safe API
- **Prisma ORM** - Database management
- **NextAuth.js** - Authentication
- **Zod** - Runtime validation
- **PostgreSQL** - Production database

### Infrastructure
- **Vercel** - Hosting & deployment
- **Cloudflare R2** - File storage
- **Prisma Cloud** - Database hosting

---

## 📁 PROJEKT STRUKTÚRA

```
molino-rental-crm/
├── app/                          # Next.js App Router
│   ├── dashboard/                # Protected dashboard
│   │   ├── properties/           # Ingatlan kezelés
│   │   ├── tenants/              # Bérlő kezelés  
│   │   ├── owners/               # Tulajdonos kezelés
│   │   ├── contracts/            # Szerződések
│   │   ├── issues/               # Hibabejelentések
│   │   └── settings/             # Beállítások
│   └── api/                      # API endpoints
├── src/
│   ├── components/               # React komponensek
│   │   ├── ui/                   # Base UI (Shadcn)
│   │   ├── forms/                # Form komponensek
│   │   ├── dashboard/            # Dashboard widgetek
│   │   └── property/             # Ingatlan komponensek
│   ├── lib/                      # Utility könyvtárak
│   └── server/                   # tRPC routers
├── prisma/                       # Database schema
└── docs/                         # Dokumentáció
```

---

## 📚 DOKUMENTÁCIÓ

### 🔍 Részletes útmutatók
- **[📸 Teljes Rendszer Snapshot](./BACKUP_SNAPSHOT_2025.md)** - Jelenlegi állapot és visszaállítási pontok
- **[🏗️ Rendszer Architektúra](./SYSTEM_ARCHITECTURE.md)** - Technológiai overview és struktúra
- **[📡 API Dokumentáció](./API_DOCUMENTATION.md)** - tRPC endpoint-ok és használat  
- **[🧩 Komponens Útmutató](./COMPONENT_GUIDE.md)** - UI komponensek és patterns
- **[🛠️ Hibaelhárítás](./TROUBLESHOOTING.md)** - Gyakori hibák és megoldások
- **[🔄 Visszaállítási Eljárások](./RECOVERY_PROCEDURES.md)** - Emergency recovery guide

### 🎯 Gyors hivatkozások
- **Stabil commit:** `43b1091` - USER MODEL FIX
- **Functioning Calendar:** `SimplePropertyCalendar` ✅
- **Working Features:** Tenant registration + Property calendar
- **Emergency Reset:** `git reset --hard 43b1091`

---

## 🚀 DEPLOYMENT

### Development
```bash
npm run dev          # Development server (port 3333)
npm run build        # Production build
npm run start        # Production server
npm run type-check   # TypeScript validation
```

### Database
```bash
npx prisma studio         # Database GUI
npx prisma migrate dev     # Apply migrations  
npx prisma db seed        # Seed test data
npx prisma generate       # Generate client
```

### Production (Vercel)
- **Auto-deployment** main branch push-ra
- **Environment variables** Vercel dashboard-ban
- **Database migrations** automatikusan futnak

---

## 🔧 ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication  
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3333"

# Cloudflare R2 Storage
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET_NAME="..."
CLOUDFLARE_R2_ENDPOINT="..."
```

---

## 🎯 HASZNÁLAT

### 1. Tulajdonos létrehozása
```typescript
// Magánszemély tulajdonos
{
  email: "owner@example.com",
  firstName: "János",
  lastName: "Kovács", 
  isCompany: false
}

// Cég tulajdonos
{
  email: "company@example.com",
  isCompany: true,
  companyName: "Ingatlan Kft.",
  taxNumber: "12345678-1-23"
}
```

### 2. Ingatlan hozzáadása
```typescript
{
  ownerId: "owner-id",
  street: "Fő utca 123",
  city: "Budapest",
  type: "APARTMENT", 
  status: "AVAILABLE",
  rentAmount: 150000,
  rooms: 2,
  size: 65
}
```

### 3. Bérlő regisztráció ingatlannal
```typescript
{
  email: "tenant@example.com",
  firstName: "Anna",
  lastName: "Nagy",
  propertyId: "property-id",      // Opcionális
  startDate: "2025-01-01",        // Opcionális
  endDate: "2025-12-31"           // Opcionális
}
// → Automatikus Contract létrehozás!
```

### 4. Naptár használata
```typescript
import { SimplePropertyCalendar } from '@/components/property/simple-property-calendar'

<SimplePropertyCalendar propertyId="property-id" />
```

---

## ⚠️ ISMERT PROBLÉMÁK ÉS MEGOLDÁSOK

### 🔴 PropertyCalendar komponens
**Probléma:** Click events nem működnek  
**Megoldás:** SimplePropertyCalendar használata ✅

### 🟡 Next.js 15 Params Issue  
**Probléma:** `params.id` Promise error  
**Megoldás:** `use(params)` hook használata ✅

### 🟢 Duplicate Key Warning
**Probléma:** React key conflicts calendar-ban  
**Megoldás:** Unique key generation ✅

---

## 📊 STÁTUSZ

### ✅ Működő funkciók
- Ingatlan CRUD + képfeltöltés
- Bérlő regisztráció + property assignment  
- Tulajdonos kezelés (egyéni/cég)
- Automatikus szerződés létrehozás
- Hibabejelentés rendszer
- **SimplePropertyCalendar** ⭐
- Dashboard analytics
- R2 cloud storage

### 🔄 Fejlesztés alatt
- Unit tesztek
- Email notifikációk  
- Advanced reporting
- Mobile app support

### ❌ Deprecated
- PropertyCalendar (click events broken)
- MultiStepTenantForm (too complex, removed)

---

## 🔒 BIZTONSÁG

- **Authentication:** NextAuth.js session-based
- **Authorization:** Role-based access (ADMIN/OWNER/TENANT)
- **Validation:** Zod schemas minden input-ra
- **File Upload:** Type és size validáció
- **Database:** Prisma prepared statements
- **Environment:** Sensitive data .env-ben

---

## 🤝 KÖZREMŰKÖDÉS

### Development Workflow
1. **Feature branch:** `git checkout -b feature/new-feature`
2. **Development:** Implementáció + tesztelés
3. **Testing:** `npm run build && npm run type-check`
4. **Pull Request:** Code review
5. **Merge:** Main branch-re

### Code Standards
- **TypeScript strict mode** minden fájlban
- **ESLint + Prettier** kód formázás
- **Conventional commits** üzenet formátum
- **Component-first** architektúra

---

## 📞 TÁMOGATÁS

### Hibák jelentése
- **GitHub Issues:** Bug reports és feature requests
- **Email:** developer@molino.hu
- **Documentation:** Részletes docs minden funkcióhoz

### Emergency Recovery
```bash
# Gyors javítás
npm run dev -- --port 3334

# Teljes reset  
git reset --hard 43b1091
npm install && npm run dev

# Database reset
npx prisma migrate reset
```

---

## 📈 ROADMAP

### 2025 Q1
- [ ] Mobile responsive optimization
- [ ] Advanced search & filtering
- [ ] Bulk operations
- [ ] Performance monitoring

### 2025 Q2  
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Document management
- [ ] Advanced analytics

### 2025 Q3
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Advanced permissions
- [ ] Integration API

---

## 📄 LICENC

**MIT License** - Lásd [LICENSE](./LICENSE) fájl

---

## 🙏 KÖSZÖNETNYILVÁNÍTÁS

- **Next.js Team** - Modern React framework
- **Prisma Team** - Database toolkit  
- **Shadcn** - UI component library
- **Vercel** - Hosting platform
- **Cloudflare** - R2 storage

---

**🌟 Star us on GitHub if you find this project useful!**

**⚡ Quick Links:**
- [🚀 Live Demo](https://molino-rental-crm.vercel.app)
- [📖 Full Documentation](./BACKUP_SNAPSHOT_2025.md)
- [🛠️ Troubleshooting](./TROUBLESHOOTING.md)
- [🔄 Recovery Guide](./RECOVERY_PROCEDURES.md)