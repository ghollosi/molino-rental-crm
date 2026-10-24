# 🚨 VERCEL DEPLOYMENT JAVÍTÁS - 2025.01.06

## 🔴 AZONOSÍTOTT PROBLÉMA
A production deployment nem működik, mert:
1. Rossz Supabase connection string van használva
2. A környezeti változók nincsenek megfelelően beállítva a Vercelen

## ✅ MEGOLDÁS LÉPÉSEI

### 1. Jelentkezz be a Vercel Dashboard-ba
- URL: https://vercel.com
- Bejelentkezés: GitHub fiókkal (ghollosi)

### 2. Navigálj a projekt beállításaihoz
- Projekt: `molino-rental-crm`
- Menj a Settings → Environment Variables oldalra
- URL: https://vercel.com/ghollosi/molino-rental-crm/settings/environment-variables

### 3. TÖRÖLD az összes jelenlegi környezeti változót
⚠️ FONTOS: Először töröld ki az összes meglévő változót, hogy tiszta lappal indulhass!

### 4. Add hozzá a következő környezeti változókat PONTOSAN
```
DATABASE_URL=postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres

NEXTAUTH_URL=https://molino-rental-crm.vercel.app

NEXTAUTH_SECRET=molino-rental-crm-super-secret-key-2025

RESEND_API_KEY=<RESEND_API_KEY – revoked 2026-10-24, set in hosting env>

R2_ACCESS_KEY_ID=062db13eb2d227445539332b737c5c41

R2_SECRET_ACCESS_KEY=27b5077b94cc85ab79adb43495af8edb78fd40a85d7b3770c21a36d9e9c5a2b2

R2_BUCKET=molino-rental-uploads

R2_ENDPOINT=https://cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com

NEXT_PUBLIC_APP_URL=https://molino-rental-crm.vercel.app

NODE_ENV=production

PORT=3333
```

### 5. ⚠️ KRITIKUS: Ellenőrizd a hosszú sorok tördelését!
A Vercel gyakran beszúr szóközöket a hosszú sorokba. KÜLÖNÖSEN figyelj:
- DATABASE_URL - ne legyen benne szóköz!
- R2_SECRET_ACCESS_KEY - ne legyen benne szóköz!

### 6. Mentés és újratelepítés
1. Kattints a "Save" gombra minden változónál
2. Menj a Deployments oldalra
3. Kattints a legutóbbi deployment melletti három pontra (...)
4. Válaszd a "Redeploy" opciót
5. NE pipáld be a "Use existing Build Cache" opciót!

### 7. Várd meg a deployment befejezését
- Általában 2-3 percet vesz igénybe
- Figyeld a build logokat hibák esetén

## 🧪 TESZTELÉS

### 1. Production URL-ek:
- Fő URL: https://molino-rental-crm.vercel.app
- Alternatív: https://molino-rental-crm-production.vercel.app

### 2. Teszteld a belépést:
- Email: admin@molino.com
- Jelszó: admin123

### 3. Ha még mindig nem működik, ellenőrizd:
1. Build logok a Vercelen (van-e hiba?)
2. Function logok a Vercelen (runtime hibák)
3. Browser Console (F12) - van-e JavaScript hiba?

## 🔧 ALTERNATÍV MEGOLDÁS - .env fájl feltöltés

Ha a manuális beállítás nem működik:

1. Hozz létre egy `.env.production` fájlt lokálisan:
```bash
DATABASE_URL=postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres
NEXTAUTH_URL=https://molino-rental-crm.vercel.app
NEXTAUTH_SECRET=molino-rental-crm-super-secret-key-2025
RESEND_API_KEY=<RESEND_API_KEY – revoked 2026-10-24, set in hosting env>
R2_ACCESS_KEY_ID=062db13eb2d227445539332b737c5c41
R2_SECRET_ACCESS_KEY=27b5077b94cc85ab79adb43495af8edb78fd40a85d7b3770c21a36d9e9c5a2b2
R2_BUCKET=molino-rental-uploads
R2_ENDPOINT=https://cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com
NEXT_PUBLIC_APP_URL=https://molino-rental-crm.vercel.app
NODE_ENV=production
PORT=3333
```

2. A Vercel Dashboard-ban:
   - Settings → Environment Variables
   - Kattints az "Upload .env file" gombra
   - Válaszd ki a `.env.production` fájlt

## 🐛 HIBAELHÁRÍTÁS

### "Invalid credentials" hiba
- Ellenőrizd, hogy a DATABASE_URL helyes-e
- Nézd meg, hogy létezik-e az admin user a Supabase-ben

### "Internal server error"
- Ellenőrizd a Function logokat a Vercelen
- Valószínűleg hiányzó környezeti változó

### Adatok nem jelennek meg
- Ellenőrizd a Supabase Dashboard-on, hogy vannak-e adatok
- Nézd meg a Network tabot (F12), hogy milyen API hívások mennek

## 📞 KAPCSOLAT
Ha továbbra is problémák vannak:
1. Küldj screenshotot a Vercel build logokról
2. Küldj screenshotot a browser console-ról
3. Ellenőrizd a Supabase státuszát: https://status.supabase.com/

## ✅ SIKERES DEPLOYMENT JELEI
- Bejelentkezés működik
- Dashboard betöltődik
- Adatok megjelennek
- Nincs hiba a console-ban

---

**FONTOS**: Ez a fájl a 2025.01.06-i állapotot tükrözi. A helyes Supabase projekt: `wymltaiembzuugxnaqzz`