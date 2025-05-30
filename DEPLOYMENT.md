# Deployment Útmutató - Molino RENTAL CRM

## Előfeltételek

### Minimum rendszerkövetelmények
- Node.js 18.17 vagy újabb
- PostgreSQL 13 vagy újabb
- NPM 8 vagy újabb

### Környezeti változók
Hozza létre a `.env.local` fájlt a következő változókkal:

```bash
# Adatbázis kapcsolat
DATABASE_URL="postgresql://username:password@localhost:5432/molino_rental"

# NextAuth konfiguráció
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3333"

# Fejlesztési konfiguráció
NODE_ENV=development
PORT=3333
```

## Helyi fejlesztési környezet

### 1. Projekt klónozása és telepítés
```bash
git clone <repository-url>
cd molino-rental-crm
npm install
```

### 2. Adatbázis beállítása
```bash
# PostgreSQL adatbázis létrehozása
createdb molino_rental

# Prisma migrációk futtatása
npx prisma db push
npx prisma generate

# Admin felhasználó létrehozása (opcionális)
npm run create-admin
```

### 3. Fejlesztési szerver indítása
```bash
# Automatikus indítás scripttel
./scripts/dev-server.sh

# Vagy manuálisan
npm run dev
```

Az alkalmazás elérhető: http://localhost:3333

### Bejelentkezési adatok
- **Email**: admin@molino.com
- **Jelszó**: admin123

## Production Deployment

### Vercel Deployment (Ajánlott)

1. **Projekt feltöltése Vercel-re**
```bash
npm install -g vercel
vercel
```

2. **Környezeti változók beállítása Vercel-ben**
   - Keresse fel a Vercel Dashboard-ot
   - Adja hozzá a következő environment változókat:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`

3. **Adatbázis**
   - Használjon managed PostgreSQL szolgáltatást (pl. Supabase, PlanetScale)
   - Frissítse a `DATABASE_URL`-t a production adatbázissal

### Docker Deployment

1. **Dockerfile létrehozása** (már létezik a projektben)
2. **Docker image build**
```bash
docker build -t molino-rental-crm .
```

3. **Futtatás**
```bash
docker run -p 3333:3333 --env-file .env.local molino-rental-crm
```

### Hagyományos szerver

1. **Build készítése**
```bash
npm run build
```

2. **Production indítás**
```bash
npm start
```

## Adatbázis Migrációk

### Fejlesztési környezetben
```bash
npx prisma db push
```

### Production környezetben
```bash
npx prisma migrate deploy
```

## Monitorozás és Logolás

### Ajánlott eszközök
- **APM**: Vercel Analytics, New Relic
- **Error Tracking**: Sentry
- **Logging**: Vercel Functions Logs, Winston

### Health Check endpoint
Az alkalmazás biztosít egy health check endpointot: `/api/health`

## Biztonság

### Környezeti változók védelme
- Soha ne commit-olja a `.env` fájlokat
- Használjon erős `NEXTAUTH_SECRET` kulcsot
- Rendszeresen frissítse a függőségeket

### HTTPS
- Production környezetben mindig használjon HTTPS-t
- Vercel automatikusan biztosítja

## Teljesítmény optimalizálás

### Next.js optimalizálások
- Image optimization engedélyezve
- Automatic code splitting
- Server-side rendering

### Adatbázis optimalizálás
- Indexek használata gyakori lekérdezésekhez
- Connection pooling (prisma által automatikusan kezelve)

## Backup Stratégia

### Adatbázis backup
```bash
# PostgreSQL dump
pg_dump molino_rental > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql molino_rental < backup_file.sql
```

### Automated backup
- Használjon cloud provider backup szolgáltatásokat
- Napi automatikus backup ajánlott

## Troubleshooting

### Gyakori problémák

1. **Port konfliktus**
   - Használja a `./scripts/dev-server.sh` scriptet
   - Manuálisan: `lsof -i :3333` és `kill -9 <PID>`

2. **Adatbázis kapcsolati problémák**
   - Ellenőrizze a `DATABASE_URL` formátumát
   - Győződjön meg róla, hogy a PostgreSQL szolgáltatás fut

3. **Build hibák**
   - Futassa `npm run build` lokálisan a hibák ellenőrzéséhez
   - Ellenőrizze a TypeScript hibákat: `npx tsc --noEmit`

### Logok elérése

**Vercel**:
```bash
vercel logs
```

**Docker**:
```bash
docker logs <container-id>
```

## Támogatás

### Dokumentáció
- [DEVELOPMENT_DOCS.md](./DEVELOPMENT_DOCS.md) - Fejlesztői dokumentáció
- [PROGRESS.md](./PROGRESS.md) - Fejlesztési előrehaladás
- [QUICK_START.md](./QUICK_START.md) - Gyors indítás

### Hasznos parancsok
```bash
# Adatbázis resetelése (fejlesztési környezet)
npx prisma migrate reset

# Prisma Studio indítása
npx prisma studio

# TypeScript ellenőrzés
npx tsc --noEmit

# Lint futtatása
npm run lint

# Tesztek futtatása (amikor implementálva)
npm test
```

## Konfigurációs lehetőségek

### Customization
Az alkalmazás konfigurálható a következő fájlokon keresztül:
- `prisma/schema.prisma` - Adatbázis séma
- `tailwind.config.ts` - UI stílusok
- `next.config.ts` - Next.js beállítások
- `components.json` - shadcn/ui konfiguráció

### Feature Flags
Jövőbeli funkciók kapcsolgatására használható környezeti változók:
- `ENABLE_EMAIL_NOTIFICATIONS`
- `ENABLE_FILE_UPLOAD`
- `ENABLE_MULTI_LANGUAGE`

---

**Megjegyzés**: Ez egy átfogó útmutató a jelenlegi fejlesztési állapot alapján. A projekt fejlődésével ez a dokumentum is frissül.# Force deployment Fri May 30 14:27:45 CEST 2025
