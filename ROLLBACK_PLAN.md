# 🔄 ROLLBACK TERV - Molino Rental CRM

## 🚨 MIKOR HASZNÁLD A ROLLBACK-ET?

### Azonnali rollback szükséges:
- ❌ A production app nem tölthető be
- ❌ Bejelentkezés teljesen sikertelen (minden módszer)
- ❌ Kritikus funkciók nem működnek (CRUD műveletek)
- ❌ Adatvesztés történt
- ❌ Biztonsági rés észlelhető

### Rollback mérlegelhető:
- ⚠️ Lassú betöltés (>5 másodperc)
- ⚠️ Egyes funkciók hibásak
- ⚠️ UI hibák
- ⚠️ Performancia problémák

## 🎯 ROLLBACK STRATÉGIÁK

### 1. VERCEL DEPLOYMENT ROLLBACK (5 perc)

#### A) Vercel Dashboard-on keresztül:
1. **Menj a Vercel Dashboard-ra**:
   - URL: https://vercel.com/ghollosi/molino-rental-crm
   - Bejelentkezés GitHub-al

2. **Deployments tab megnyitása**:
   - Kattints a "Deployments" fülre
   - Látod az összes korábbi deployment-et

3. **Stabil verzió kiválasztása**:
   - Keress egy korábbi, működő deployment-et
   - Preferáltan "Ready" státuszú deployment
   - Kattints a deployment-re

4. **Promote to Production**:
   - Kattints a "..." (három pont) gombra
   - Válaszd a "Promote to Production" opciót
   - Erősítsd meg a műveletet

5. **Ellenőrzés**:
   - Várd meg a deployment befejezését (2-3 perc)
   - Teszteld: https://molino-rental-crm.vercel.app

#### B) Vercel CLI-n keresztül:
```bash
# Vercel CLI telepítése (ha nincs)
npm install -g vercel

# Login
vercel login

# Projekt switchelése
cd /Users/hollosigabor/molino-rental-crm

# Deployments listázása
vercel ls

# Konkrét deployment promote-olása
vercel promote <DEPLOYMENT_URL> --scope=ghollosi

# Például:
# vercel promote https://molino-rental-crm-git-main-ghollosi.vercel.app --scope=ghollosi
```

### 2. GIT ROLLBACK (10 perc)

#### A) Last working commit-ra visszaállás:
```bash
# Stabil commit megkeresése
git log --oneline -10

# Stabil commit kiválasztása (pl: abc1234)
git reset --hard abc1234

# Force push (VESZÉLYES! Csak ha biztos vagy benne!)
git push origin main --force

# Vercel automatikusan re-deploy-olja
```

#### B) Revert commit (biztonságosabb):
```bash
# Hibás commit megkeresése
git log --oneline -5

# Hibás commit revert-je (pl: def5678)
git revert def5678

# Commit és push
git commit -m "Revert: problematic deployment"
git push origin main
```

### 3. DATABASE ROLLBACK (15 perc)

#### A) Supabase Dashboard Rollback:
1. **Supabase Dashboard**:
   - URL: https://app.supabase.com/project/wymltaiembzuugxnaqzz
   - Bejelentkezés GitHub-al

2. **Database backups**:
   - Menj a "Database" → "Backups" menübe
   - Válassz egy korábbi backup-ot
   - Kattints a "Restore" gombra

3. **Adatok újra-seedelése**:
   ```bash
   # Ha szükséges, futtasd újra:
   npx tsx scripts/supabase-production-setup.ts
   ```

#### B) Manual Database Reset:
```bash
# FIGYELEM: Ez törli az összes adatot!

# 1. Új Prisma push
DATABASE_URL="postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres" npx prisma db push --force-reset

# 2. Admin user és test adatok újra-létrehozása
npx tsx scripts/supabase-production-setup.ts
```

### 4. ENVIRONMENT VARIABLES ROLLBACK (5 perc)

#### Vercel Environment Variables visszaállítása:
1. **Vercel Dashboard**:
   - URL: https://vercel.com/ghollosi/molino-rental-crm/settings/environment-variables

2. **Stabil változók**:
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
   ```

3. **Redeploy**:
   - Kattints a "Redeploy" gombra
   - NE használj cache-t!

## 🛠️ ROLLBACK SCRIPTÖK

### Gyors Vercel Rollback Script:
```bash
#!/bin/bash
# scripts/quick-rollback.sh

echo "🔄 GYORS VERCEL ROLLBACK"
echo "======================"

# Lista az utolsó 5 deployment
echo "Utolsó deployments:"
vercel ls --scope=ghollosi | head -6

echo ""
read -p "Add meg a deployment URL-t rollback-hez: " DEPLOYMENT_URL

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "Rollback indítása..."
    vercel promote "$DEPLOYMENT_URL" --scope=ghollosi
    echo "✅ Rollback kész!"
else
    echo "❌ Nem adtál meg deployment URL-t"
fi
```

### Database Reset Script:
```bash
#!/bin/bash
# scripts/reset-database.sh

echo "🗄️  DATABASE RESET"
echo "=================="
echo "⚠️  FIGYELEM: Ez törli az összes production adatot!"
read -p "Biztosan folytatod? (yes/no): " CONFIRM

if [ "$CONFIRM" = "yes" ]; then
    echo "Database reset..."
    DATABASE_URL="postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres" npx prisma db push --force-reset
    
    echo "Admin user és test adatok létrehozása..."
    npx tsx scripts/supabase-production-setup.ts
    
    echo "✅ Database reset kész!"
else
    echo "❌ Database reset visszavonva"
fi
```

## 📞 VÉSZHELYZETI KONTAKTOK

### Ha minden rollback sikertelen:

1. **Vercel Support**:
   - URL: https://vercel.com/help
   - Email: support@vercel.com

2. **Supabase Support**:
   - URL: https://supabase.com/support
   - Discord: https://discord.supabase.com

3. **GitHub Support** (ha git probléma):
   - URL: https://support.github.com

## 🔍 ROLLBACK UTÁNI ELLENŐRZŐ LISTA

### ✅ Kötelező ellenőrzések:
- [ ] Main page betöltődik: https://molino-rental-crm.vercel.app
- [ ] Login működik: admin@molino.com / admin123
- [ ] Dashboard betöltődik és adatok megjelennek
- [ ] Bypass login működik: /api/bypass-login
- [ ] Force login működik: /api/force-login
- [ ] Health check működik: /api/health-check

### ✅ Funkcionális tesztek:
- [ ] Owners lista betöltődik
- [ ] Properties lista betöltődik
- [ ] Tenants lista betöltődik
- [ ] Providers lista betöltődik
- [ ] Issues lista betöltődik
- [ ] Új rekord létrehozása működik
- [ ] Meglévő rekord szerkesztése működik
- [ ] File upload működik (Company settings)

### ✅ Automatikus teszt futtatása:
```bash
# Production teszt script futtatása
npx tsx scripts/test-production.ts
```

## 📊 ROLLBACK MONITORING

### Vercel Metrics ellenőrzése:
1. Vercel Dashboard → Analytics
2. Ellenőrizd:
   - Response time
   - Error rate
   - Uptime
   - Function executions

### Supabase Metrics ellenőrzése:
1. Supabase Dashboard → Database → Monitoring
2. Ellenőrizd:
   - Connection count
   - Query performance
   - Database size

## 🎯 ROLLBACK MEGELŐZÉS

### Jövőbeli deployment-ek biztonságáért:

1. **Staging Environment** létrehozása:
   - Külön Vercel project a staging-hez
   - Külön Supabase database a teszteléshez

2. **Automated Testing**:
   - CI/CD pipeline GitHub Actions-el
   - Automated tests minden PR-nél

3. **Gradual Rollout**:
   - Feature flagek használata
   - A/B testing új funkciókhoz

4. **Monitoring & Alerts**:
   - Vercel alerts beállítása
   - Uptime monitoring (pl: Pingdom)

---

## 📝 ROLLBACK LOG TEMPLATE

```
ROLLBACK ESEMÉNY: [DÁTUM ÉS IDŐ]
================================

Probléma leírása:
- Mi történt?
- Mikor észlelted?
- Milyen hibák jelentkeztek?

Rollback módszer:
- [ ] Vercel deployment rollback
- [ ] Git commit rollback
- [ ] Database rollback
- [ ] Environment variables rollback

Rollback lépései:
1. [Első lépés]
2. [Második lépés]
3. [stb...]

Rollback eredménye:
- [ ] Sikeres
- [ ] Részben sikeres
- [ ] Sikertelen

Post-rollback státusz:
- Main page: [OK/HIBA]
- Login: [OK/HIBA]
- Dashboard: [OK/HIBA]
- CRUD műveletek: [OK/HIBA]

Tanulságok:
- Mit lehetett volna jobban csinálni?
- Milyen megelőző intézkedések szükségesek?

Következő lépések:
- [ ] Probléma elemzése
- [ ] Fix implementálása
- [ ] Testing fokozása
- [ ] Documentation frissítése
```

---

**FONTOS**: Ez a rollback terv egy biztonsági háló. Használd csak valódi vészhelyzetben, és mindig dokumentáld a rollback eseményeket!