# 🚀 TELJES DEPLOYMENT ÚTMUTATÓ - Lépésről Lépésre

## 📋 ELŐKÉSZÜLETEK (5 perc)

### 1. Belépési adatok előkészítése
Győződj meg róla, hogy megvannak a következő belépési adatok:

#### GitHub:
- **Felhasználónév**: ghollosi
- **Platform**: GitHub.com

#### Vercel:
- **Belépés**: GitHub-al (ghollosi)
- **URL**: https://vercel.com

#### Supabase:
- **Belépés**: GitHub-al (ghollosi)  
- **Jelszó**: Gabo123kekw
- **Project URL**: https://app.supabase.com/project/wymltaiembzuugxnaqzz

#### Cloudflare:
- **Belépés**: Google-al (gabhol@gmail.com)
- **Dashboard**: https://dash.cloudflare.com/cd381d9453ab9baed52c917bb535aae2

#### Resend:
- **Belépés**: GitHub-al (ghollosi)
- **Dashboard**: https://resend.com

### 2. VS Code előkészítése
```bash
# Navigálj a projektbe
cd /Users/hollosigabor/molino-rental-crm

# VS Code megnyitása
code .

# Terminal megnyitása VS Code-ban (Cmd + J)
```

## 🏗️ AUTOMATIKUS DEPLOYMENT (10 perc)

### OPCIÓ A: Teljes Automatikus Deployment

Ha minden automatikusan menjen, használd ezt a scriptet:

```bash
# 1. Script futtathatóvá tétele
chmod +x scripts/deploy-production.sh

# 2. Teljes deployment indítása
./scripts/deploy-production.sh
```

**MIT CSINÁL EZ A SCRIPT?**
- ✅ Ellenőrzi a környezetet (Node.js, npm, Vercel CLI)
- ✅ TypeScript hibák ellenőrzése
- ✅ Production build teszt
- ✅ Supabase adatbázis setup
- ✅ Admin user és test adatok létrehozása
- ✅ Git push
- ✅ Vercel deployment
- ✅ Production teszt

**FIGYELEM**: A script megáll és kérdez, hogy beállítottad-e a Vercel environment változókat!

---

## 🎯 MANUÁLIS DEPLOYMENT (25 perc)

Ha kontrollt akarsz tartani minden lépés felett:

### 1. LÉPÉS: Projekt ellenőrzése (3 perc)

```bash
# Git státusz ellenőrzése
git status

# Ha vannak uncommitted changes:
git add .
git commit -m "Pre-deployment commit - $(date +%Y-%m-%d_%H:%M:%S)"

# TypeScript ellenőrzés
npx tsc --noEmit

# Build teszt
npm run build
```

Ha valamelyik hiba, NE folytasd! Javítsd a hibákat előbb.

### 2. LÉPÉS: Supabase adatbázis setup (5 perc)

```bash
# Prisma schema push Supabase-hez
DATABASE_URL="postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres" npx prisma db push

# Admin user és test adatok létrehozása
npx tsx scripts/supabase-production-setup.ts
```

**VÁRHATÓ KIMENET:**
```
🚀 SUPABASE PRODUCTION SETUP STARTED
=====================================
1️⃣  Adatbázis kapcsolat tesztelése...
   ✅ Kapcsolat sikeres!
3️⃣  Admin user létrehozása...
   ✅ Admin user kész!
4️⃣  Company rekord létrehozása...
   ✅ Company rekord létrehozva!
5️⃣  Test userek létrehozása...
   ✅ 5 Owner user létrehozva!
   ✅ 5 Tenant user létrehozva!
   ✅ 5 Provider user létrehozva!
🎉 SUPABASE PRODUCTION SETUP KÉSZ!
```

### 3. LÉPÉS: Vercel Environment Variables (7 perc)

#### A) Vercel Dashboard megnyitása:
1. Menj: https://vercel.com
2. Jelentkezz be GitHub-al (ghollosi)
3. Válaszd a `molino-rental-crm` projektet
4. Menj: Settings → Environment Variables
5. URL: https://vercel.com/ghollosi/molino-rental-crm/settings/environment-variables

#### B) Összes meglévő változó törlése:
⚠️ **FONTOS**: Törölj ki mindent! Kattints minden változó mellett a "Delete" gombra.

#### C) Új változók hozzáadása:
**Copy-paste ezeket PONTOSAN:**

```
DATABASE_URL
postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres
```

```
NEXTAUTH_URL
https://molino-rental-crm.vercel.app
```

```
NEXTAUTH_SECRET
molino-rental-crm-super-secret-key-2025
```

```
RESEND_API_KEY
<RESEND_API_KEY – revoked 2026-10-24, set in hosting env>
```

```
R2_ACCESS_KEY_ID
062db13eb2d227445539332b737c5c41
```

```
R2_SECRET_ACCESS_KEY
27b5077b94cc85ab79adb43495af8edb78fd40a85d7b3770c21a36d9e9c5a2b2
```

```
R2_BUCKET
molino-rental-uploads
```

```
R2_ENDPOINT
https://cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com
```

```
NEXT_PUBLIC_APP_URL
https://molino-rental-crm.vercel.app
```

```
NODE_ENV
production
```

```
PORT
3333
```

**⚠️ KRITIKUS**: Ellenőrizd hogy nincsenek szóközök a hosszú sorokban! A Vercel hajlamos berakni szóközöket!

#### D) Environment Variables mentése:
Minden változónál kattints a "Save" gombra.

### 4. LÉPÉS: Git push és Vercel deployment (5 perc)

```bash
# Git push
git push origin main

# Vercel CLI telepítése (ha nincs)
npm install -g vercel

# Vercel login (ha kell)
vercel login

# Production deployment
vercel --prod
```

**VÁRHATÓ KIMENET:**
```
🔍  Inspect: https://vercel.com/ghollosi/molino-rental-crm/xxx
✅  Production: https://molino-rental-crm.vercel.app
```

### 5. LÉPÉS: Deployment tesztelése (5 perc)

```bash
# Várakozás (30 másodperc)
sleep 30

# Automatikus teszt futtatása
npx tsx scripts/test-production.ts
```

**VÁRHATÓ KIMENET:**
```
🧪 MOLINO RENTAL CRM - PRODUCTION TESZT
   Testing Main Page Load... ✅ (245ms)
   Testing Login Page... ✅ (186ms)
   Testing API Health Check... ✅ (123ms)
   Testing Bypass Login... ✅ (167ms)
   Testing Force Login... ✅ (203ms)
   Testing Test Login API... ✅ (334ms)
   Testing Direct Login Page... ✅ (198ms)

🔍 ADATBÁZIS KAPCSOLAT TESZTELÉSE...
   ✅ Adatbázis kapcsolat működik
   ✅ Admin user létezik és elérhető

🎉 PRODUCTION ENVIRONMENT: TÖKÉLETESEN MŰKÖDIK!
```

---

## 🧪 MANUÁLIS TESZTELÉS (10 perc)

### 1. Normál bejelentkezés tesztelése:

#### A) Main URL megnyitása:
- URL: https://molino-rental-crm.vercel.app
- Várható: Redirect a login oldalra

#### B) Bejelentkezés:
- **Email**: admin@molino.com
- **Jelszó**: admin123
- Kattints a "Sign In" gombra
- Várható: Redirect a dashboard-ra

#### C) Dashboard ellenőrzése:
- Várható: Dashboard betöltődik
- Várható: Statisztikák megjelennek
- Várható: Menü működik

### 2. Bypass módszerek tesztelése (ha a normál nem megy):

#### A) Bypass Login:
- URL: https://molino-rental-crm.vercel.app/api/bypass-login
- Várható: Automatikus redirect a dashboard-ra

#### B) Force Login:
- URL: https://molino-rental-crm.vercel.app/api/force-login
- Várható: Automatikus redirect a dashboard-ra

#### C) Direct Login:
- URL: https://molino-rental-crm.vercel.app/direct-login
- Kattints a "Login as Admin" gombra
- Várható: Redirect a dashboard-ra

### 3. Funkcionális tesztelés:

#### A) Entitások ellenőrzése:
- **Owners**: Menj az Owners oldalra, látnod kell 5 test ownert
- **Tenants**: Menj a Tenants oldalra, látnod kell 5 test tenantet
- **Providers**: Menj a Providers oldalra, látnod kell 5 test providert
- **Properties**: Menj a Properties oldalra, látnod kell 1 sample propertyt

#### B) CRUD teszt:
- Próbálj létrehozni egy új Owner-t
- Próbálj szerkeszteni egy meglévő Tenant-et
- Ellenőrizd hogy mentés működik

#### C) File upload teszt:
- Menj: Settings → Company
- Próbálj feltölteni egy company logót
- Ellenőrizd hogy feltöltés működik

---

## 🚨 HIBAELHÁRÍTÁS

### Ha a Main Page nem tölthető be:

#### 1. Vercel Deployment ellenőrzése:
- Menj: https://vercel.com/ghollosi/molino-rental-crm
- Nézd meg a "Deployments" tabot
- Legutóbbi deployment státusza "Ready"?

#### 2. Vercel Function Logs:
- Vercel Dashboard → Functions → Logs
- Keress hibaüzeneteket

#### 3. Environment Variables újra:
- Settings → Environment Variables
- Ellenőrizd hogy minden változó jól van-e beállítva
- Különös figyelmet a DATABASE_URL-re!

### Ha bejelentkezés nem működik:

#### 1. Database kapcsolat teszt:
```bash
# Manual connection test
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres'
    }
  }
});
prisma.user.findUnique({where: {email: 'admin@molino.com'}}).then(console.log).finally(() => prisma.\$disconnect());
"
```

Várható kimenet: admin user objektum

#### 2. Admin user újralétrehozása:
```bash
npx tsx scripts/supabase-production-setup.ts
```

#### 3. Bypass módszerek használata:
- https://molino-rental-crm.vercel.app/api/bypass-login
- https://molino-rental-crm.vercel.app/api/force-login
- https://molino-rental-crm.vercel.app/direct-login

### Ha adatok nem jelennek meg:

#### 1. Database tartalom ellenőrzése:
- Menj: https://app.supabase.com/project/wymltaiembzuugxnaqzz
- SQL Editor
- Futtasd: `SELECT * FROM "User" LIMIT 10;`
- Látnod kell admin + test usereket

#### 2. API endpoint teszt:
- Browser Network tab (F12)
- Nézd meg hogy milyen API hívások mennek
- Vannak-e 500-as hibák?

### Ha semmi sem működik - ROLLBACK:

```bash
# Gyors Vercel rollback az előző stabil verzióra
vercel ls --scope=ghollosi

# Válassz egy korábbi, működő deployment URL-t
vercel promote <DEPLOYMENT_URL> --scope=ghollosi
```

Vagy használd a `ROLLBACK_PLAN.md` útmutatót!

---

## ✅ SIKERES DEPLOYMENT ELLENŐRZŐ LISTA

### 🎯 Kötelező tesztek:
- [ ] Main page betöltődik: https://molino-rental-crm.vercel.app
- [ ] Login működik: admin@molino.com / admin123
- [ ] Dashboard betöltődik és statisztikák megjelennek
- [ ] Owners lista (5 test owner)
- [ ] Tenants lista (5 test tenant)
- [ ] Providers lista (5 test provider)
- [ ] Properties lista (1 sample property)
- [ ] Új rekord létrehozása működik
- [ ] Meglévő rekord szerkesztése működik
- [ ] Company settings file upload működik

### 🚀 Opcionális tesztek:
- [ ] Issues funkció
- [ ] Offers funkció
- [ ] Settings oldalak
- [ ] Export funkciók
- [ ] Multi-language switching

### 📊 Automatikus teszt:
- [ ] `npx tsx scripts/test-production.ts` sikeresen lefut
- [ ] Összes teszt zöld

---

## 🎉 SIKERES DEPLOYMENT UTÁN

### Production URL-ek:
- **Main App**: https://molino-rental-crm.vercel.app
- **Bypass Login**: https://molino-rental-crm.vercel.app/api/bypass-login
- **Force Login**: https://molino-rental-crm.vercel.app/api/force-login
- **Direct Login**: https://molino-rental-crm.vercel.app/direct-login
- **Health Check**: https://molino-rental-crm.vercel.app/api/health-check

### Bejelentkezési adatok:
- **Admin**: admin@molino.com / admin123
- **Test Owners**: owner1-5@example.com / user123
- **Test Tenants**: tenant1-5@example.com / user123
- **Test Providers**: provider1-5@example.com / user123

### Management Dashboard-ok:
- **Vercel**: https://vercel.com/ghollosi/molino-rental-crm
- **Supabase**: https://app.supabase.com/project/wymltaiembzuugxnaqzz
- **Cloudflare**: https://dash.cloudflare.com/cd381d9453ab9baed52c917bb535aae2
- **Resend**: https://resend.com

### Hasznos scriptek:
```bash
# Production tesztelése
npx tsx scripts/test-production.ts

# Database újrasetup (ha kell)
npx tsx scripts/supabase-production-setup.ts

# Gyors rollback (vészhelyzet)
vercel ls --scope=ghollosi && vercel promote <URL> --scope=ghollosi
```

---

## 📞 TÁMOGATÁS

Ha bármi probléma van, használd a `ROLLBACK_PLAN.md` útmutatót vagy a következő contact-okat:

- **Vercel Support**: https://vercel.com/help
- **Supabase Support**: https://supabase.com/support
- **GitHub Support**: https://support.github.com

---

**🎯 EZ AZ ÚTMUTATÓ MINDENT TARTALMAZ AMIT TUDNOD KELL A SIKERES DEPLOYMENT-HEZ!**