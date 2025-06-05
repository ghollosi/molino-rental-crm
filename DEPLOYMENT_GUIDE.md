# MOLINO RENTAL CRM - Vercel Deployment Útmutató

## 🚀 **TELJES PRODUCTION DEPLOYMENT LÉPÉSEK**

### **Előfeltételek ✅**
- GitHub repo: `ghollosi/molino-rental-crm`
- Vercel account: GitHub bejelentkezéssel
- Minden szolgáltató regisztrálva és konfigurálva

---

## **1. LÉPÉS: Environment Variables Beállítása**

### **A. Hozd létre a .env.production fájlt:**
```bash
# Production Database (Supabase)
DATABASE_URL="postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres"

# NextAuth Configuration
NEXTAUTH_URL="https://molino-rental-crm.vercel.app"
NEXTAUTH_SECRET="molino_rental_crm_production_secret_2025_very_secure_key_for_jwt_tokens"

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID="062db13eb2d227445539332b737c5c41"
R2_SECRET_ACCESS_KEY="27b5077b94cc85ab79adb43495af8edb78fd40a85d7b3770c21a36d9e9c5a2b2"
R2_BUCKET_NAME="molino-rental"
R2_ENDPOINT="https://cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com"

# Email Service (Resend)
RESEND_API_KEY="re_YUHrniX6_PAbF5mXFSUqJK86DoYS8haeF"
EMAIL_FROM="noreply@molino-rental.com"

# App Configuration
NEXT_PUBLIC_APP_URL="https://molino-rental-crm.vercel.app"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Optional: Analytics & Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=""
SENTRY_DSN=""

# Spanish Market Integrations (Optional - add later)
ZOHO_CLIENT_ID=""
ZOHO_CLIENT_SECRET=""
CAIXABANK_CLIENT_ID=""
WHATSAPP_ACCESS_TOKEN=""
BOOKING_USERNAME=""
UPLISTING_API_KEY=""
```

---

## **2. LÉPÉS: Vercel Project Létrehozása**

### **A. GitHub Repository Ellenőrzése**
1. Menj a GitHub-ra: https://github.com/ghollosi
2. Ellenőrizd, hogy a `molino-rental-crm` repo létezik és up-to-date
3. Ha nincs, akkor push-old fel a jelenlegi állapotot

### **B. Vercel Dashboard**
1. Menj a Vercel-re: https://vercel.com/dashboard
2. Jelentkezz be GitHub fiókkal (`ghollosi`)
3. Kattints "New Project" gombra
4. Válaszd ki a `molino-rental-crm` repository-t
5. Konfiguráció:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./ (gyökér)
   - **Build Command:** `npm run build`
   - **Output Directory:** .next
   - **Install Command:** `npm install`

---

## **3. LÉPÉS: Environment Variables Feltöltése Vercel-be**

### **A. Bulk Environment Variables Import**
Vercel dashboard-ban a projekt beállításokban:

1. **Settings** → **Environment Variables**
2. Kattints **"Bulk Edit"** gombra
3. Másold be az alábbi konfigurációt:

```env
DATABASE_URL=postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
NEXTAUTH_URL=https://molino-rental-crm.vercel.app
NEXTAUTH_SECRET=molino_rental_crm_production_secret_2025_very_secure_key_for_jwt_tokens
R2_ACCESS_KEY_ID=062db13eb2d227445539332b737c5c41
R2_SECRET_ACCESS_KEY=27b5077b94cc85ab79adb43495af8edb78fd40a85d7b3770c21a36d9e9c5a2b2
R2_BUCKET_NAME=molino-rental
R2_ENDPOINT=https://cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com
RESEND_API_KEY=re_YUHrniX6_PAbF5mXFSUqJK86DoYS8haeF
EMAIL_FROM=noreply@molino-rental.com
NEXT_PUBLIC_APP_URL=https://molino-rental-crm.vercel.app
NEXT_PUBLIC_APP_VERSION=1.0.0
```

4. **Environment:** Production, Preview, Development (mindegyiket)
5. Kattints **"Save"**

---

## **4. LÉPÉS: Build Beállítások**

### **A. Vercel Build Commands**
```json
{
  "buildCommand": "prisma generate && npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### **B. Package.json Scripts Ellenőrzése**
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "start": "next start",
    "dev": "next dev -p 3333",
    "postinstall": "prisma generate"
  }
}
```

---

## **5. LÉPÉS: Domain Beállítás**

### **A. Vercel Domain**
1. **Settings** → **Domains**
2. Alapértelmezett domain: `molino-rental-crm.vercel.app`
3. Opcionális: Egyedi domain hozzáadása (pl. `molino-rental.com`)

### **B. NEXTAUTH_URL Frissítés**
- Győződj meg róla, hogy a `NEXTAUTH_URL` egyezik a final domain-nel

---

## **6. LÉPÉS: Database Migration Production-ben**

### **A. Prisma Deploy**
A deployment után automatikusan lefut a `prisma generate`, de ellenőrizni kell:

1. **Vercel Functions** → **Edge Runtime** disabled for Prisma
2. **Node.js Runtime** használata Prisma-hoz

### **B. Database Seed (Opcionális)**
A production-ben admin user létrehozásához:
```bash
# Lokálisan futtatva production DB-re
DATABASE_URL="postgresql://postgres.bwpuhldzbgxfjohjjnll:Kata_1979A@aws-0-eu-west-3.pooler.supabase.com:6543/postgres" npm run db:seed
```

---

## **7. LÉPÉS: Deployment Elindítása**

### **A. Automatic Deployment**
1. Vercel automatikusan elindítja a build-et
2. Kövesd a progress-t a **Deployments** tab-ban
3. Build time: ~3-5 perc

### **B. Manual Trigger (ha szükséges)**
```bash
# Local terminal-ban
npm run build  # Ellenőrzés lokálisan
git push origin main  # Vercel automatikusan deploy-ol
```

---

## **8. LÉPÉS: Post-Deployment Ellenőrzések**

### **A. Functionality Testing**
1. **Alapvető oldalak:**
   - https://molino-rental-crm.vercel.app
   - https://molino-rental-crm.vercel.app/dashboard
   - https://molino-rental-crm.vercel.app/login

2. **Admin bejelentkezés:**
   - Email: `admin@molino.com`
   - Jelszó: `admin123`

3. **Database kapcsolat:**
   - Properties, Tenants, Issues lista oldalak
   - CRUD műveletek tesztelése

4. **File upload:**
   - Kép feltöltés tesztelése
   - Cloudflare R2 storage működés

### **B. Performance Monitoring**
1. **Vercel Analytics** aktiválása
2. **Speed Insights** ellenőrzése
3. **Error logging** beállítása

---

## **🔧 TROUBLESHOOTING**

### **Gyakori Problémák és Megoldások**

#### **1. Build Errors**
```bash
Error: Prisma Client not generated
Megoldás: Győződj meg róla, hogy `prisma generate` fut a build előtt
```

#### **2. Database Connection**
```bash
Error: Connection refused
Megoldás: Ellenőrizd a DATABASE_URL-t és Supabase connection limits-et
```

#### **3. Environment Variables**
```bash
Error: NEXTAUTH_SECRET is required
Megoldás: Ellenőrizd, hogy minden env var be van állítva Production environment-ben
```

#### **4. File Upload Issues**
```bash
Error: R2 not configured
Megoldás: Ellenőrizd a Cloudflare R2 credentials-t
```

---

## **🚀 SUCCESS INDICATORS**

### **✅ Sikeres Deployment Jelei:**
1. **Build Status:** ✅ Success
2. **URL Accessible:** https://molino-rental-crm.vercel.app
3. **Login Working:** Admin bejelentkezés működik
4. **Database Connected:** Lista oldalak betöltődnek
5. **File Upload:** Képek feltölthetők és megjelennek
6. **Spanish Integrations:** API endpoints elérhetők

---

## **📋 POST-DEPLOYMENT CHECKLIST**

- [ ] Vercel project létrehozva és deploy-olva
- [ ] Minden environment variable beállítva
- [ ] Database kapcsolat működik
- [ ] Admin user bejelentkezés működik
- [ ] File upload és R2 storage működik
- [ ] Összes főoldal elérhető és hibamentes
- [ ] Mobile responsive design ellenőrizve
- [ ] Performance metrics elfogadhatók

---

## **🎯 KÖVETKEZŐ LÉPÉSEK**

1. **Domain Setup:** Egyedi domain konfigurálása (opcionális)
2. **Monitoring:** Sentry error tracking aktiválása
3. **Analytics:** Google Analytics vagy Vercel Analytics
4. **SSL Certificate:** Automatikus (Vercel biztosítja)
5. **CDN:** Automatikus (Vercel biztosítja)
6. **Spanish Integrations:** API kulcsok hozzáadása igény szerint

---

**🎉 Gratulálok! A Molino Rental CRM most már production-ban fut és kész az Alicante vakációs bérlet piacra! 🏖️🇪🇸**