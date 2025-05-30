# 🚀 Molino Rental CRM - Deployment Útmutató

## ⚡ Gyors Deployment (TL;DR)
```bash
# Automatikus deployment script futtatása
./scripts/deploy-to-vercel.sh
```

## 📋 Tartalomjegyzék
1. [Előfeltételek](#előfeltételek)
2. [Vercel Beállítás](#vercel-beállítás)
3. [Environment Változók](#environment-változók)
4. [Deployment Folyamat](#deployment-folyamat)
5. [Hibakeresés](#hibakeresés)
6. [Rollback Eljárás](#rollback-eljárás)
7. [Monitoring](#monitoring)

## 🔧 Előfeltételek

### Szükséges eszközök:
- Node.js 18+ 
- Git
- Vercel account (https://vercel.com)
- PostgreSQL adatbázis (Supabase/Neon/Railway)

### Projekt ellenőrzés:
```bash
# TypeScript hibák ellenőrzése
npm run type-check

# Build teszt
npm run build

# Tesztek futtatása
npm test
```

## 🌐 Vercel Beállítás

### 1. Első deployment (új projekt)
```bash
# Vercel CLI telepítése (ha nincs)
npm i -g vercel

# Login
vercel login

# Projekt importálás
vercel

# Kövesse az utasításokat:
# - Válassza: Link to existing project
# - Project név: molino-rental-crm
# - Framework: Next.js
# - Build settings: alapértelmezett
```

### 2. Projekt összekapcsolás (meglévő)
```bash
vercel link
# Válassza ki: ghollosi/molino-rental-crm
```

## 🔐 Environment Változók

### Production környezeti változók (Vercel Dashboard):
```env
# Adatbázis
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://molino-rental-crm.vercel.app"
NEXTAUTH_SECRET="your-secret-key"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# Cloudflare R2 (opcionális)
R2_ENDPOINT="https://..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="molino-rental-files"

# Monitoring (opcionális)
SENTRY_DSN="https://..."
```

### Változók beállítása Vercelen:
1. Nyissa meg: https://vercel.com/dashboard
2. Válassza ki a projektet
3. Settings → Environment Variables
4. Adja hozzá az összes változót
5. Production, Preview, Development környezetekhez

## 📦 Deployment Folyamat

### Automatikus deployment (ajánlott):
```bash
# Futassa a deployment scriptet
./scripts/deploy-to-vercel.sh
```

### Manuális deployment:
```bash
# 1. Változtatások commitolása
git add .
git commit -m "feat: új funkció"

# 2. Push to GitHub (auto deploy)
git push origin main

# 3. VAGY manuális deploy
vercel --prod
```

### Deployment ellenőrzés:
1. Vercel Dashboard: https://vercel.com/ghollosi/molino-rental-crm
2. Ellenőrizze a build logokat
3. Deployment URL tesztelése
4. Production URL: https://molino-rental-crm.vercel.app

## 🐛 Hibakeresés

### Gyakori problémák:

#### 1. Build hiba
```bash
# Helyi build teszt
npm run build

# TypeScript hibák
npm run type-check

# Tiszta build
rm -rf .next node_modules
npm install
npm run build
```

#### 2. 500-as hiba production-ben
- Ellenőrizze az environment változókat
- Nézze meg a Function logokat Vercelen
- Adatbázis kapcsolat ellenőrzése

#### 3. Deployment nem frissül
```bash
# Cache törlés
rm -rf .next

# Force deployment
vercel --force

# Service Worker reset (ha van)
# Növelje a verzió számot: public/sw.js
```

## ⏮️ Rollback Eljárás

### Gyors rollback Vercelen:
1. Vercel Dashboard → Deployments
2. Keresse meg az utolsó működő verziót
3. Kattintson a "..." menüre → "Promote to Production"

### Git alapú rollback:
```bash
# Listázza a verziókat
git tag --list

# Visszaállás konkrét verzióra
git checkout v1.14.0

# Új branch létrehozása
git checkout -b hotfix/rollback-v1.14.0

# Deploy
git push origin hotfix/rollback-v1.14.0
vercel --prod
```

## 📊 Monitoring

### Build státusz ellenőrzés:
- GitHub: Zöld pipa ✅ = sikeres build
- Vercel Dashboard: Deployment státusz
- Email értesítések beállítása

### Alkalmazás monitoring:
```bash
# Health check
curl https://molino-rental-crm.vercel.app/api/health-check

# Logs megtekintése
vercel logs --prod
```

### Performance monitoring:
- Vercel Analytics (automatikus)
- Lighthouse audit futtatása
- Core Web Vitals követése

## 🛡️ Biztonság

### Pre-deployment checklist:
- [ ] Nincs szenzitív adat a kódban
- [ ] Environment változók helyesen vannak beállítva
- [ ] TypeScript hibák javítva (0 error)
- [ ] Build sikeresen lefut
- [ ] Tesztek átmennek

### Post-deployment:
- [ ] Production URL tesztelése
- [ ] Főbb funkciók ellenőrzése
- [ ] Mobile responsiveness teszt
- [ ] Console hibák ellenőrzése

## 🔄 Continuous Deployment

### GitHub Actions (automatikus):
Minden push a `main` branch-re automatikusan deployol.

### Branch védelem:
```bash
# Feature branch workflow
git checkout -b feature/new-feature
# ... fejlesztés ...
git push origin feature/new-feature
# Pull Request létrehozása
# Review és merge után auto-deploy
```

## 📝 Deployment Log

Minden deployment után frissítse:
```markdown
## Deployment History
- 2025-05-30 v1.14.0 - Owner creation fixes, stable production
- 2025-05-29 v1.13.0 - Working standalone API
- ...
```

## 🆘 Segítség

### Vercel Support:
- Docs: https://vercel.com/docs
- Status: https://vercel-status.com

### Projekt specifikus:
- GitHub Issues: https://github.com/ghollosi/molino-rental-crm/issues
- CLAUDE.md: Fejlesztői útmutató

---

**FONTOS**: Ez a dokumentum kritikus a production rendszer működéséhez. Minden változtatás után frissítse!