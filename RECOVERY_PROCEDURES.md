# 🔄 MOLINO RENTAL CRM - VISSZAÁLLÍTÁSI ELJÁRÁSOK

## 🛡️ RENDSZER HELYREÁLLÍTÁSI ÚTMUTATÓ

### ⚡ GYORS HIVATKOZÁSOK
```bash
# Emergency Reset Commands
git reset --hard HEAD                    # Discard all changes
git checkout 43b1091                     # Last stable commit
npx prisma migrate reset                 # Reset database  
rm -rf node_modules && npm install      # Clean install
npm run dev -- --port 3334              # Different port
```

---

## 📋 VISSZAÁLLÍTÁSI SZINTEK

### 🟢 SZINT 1 - SOFT RESET (Kisebb hibák)
**Mikor használd:** TypeScript hibák, import problems, cache issues

```bash
# 1. Clear development cache
rm -rf .next

# 2. Restart development server
npm run dev

# 3. If port conflict
npm run dev -- --port 3334
```

**Elveszti:** Semmi  
**Időtartam:** 1-2 perc

---

### 🟡 SZINT 2 - DEPENDENCY RESET (Package hibák)
**Mikor használd:** npm/package hibák, dependency conflicts

```bash
# 1. Clean node modules
rm -rf node_modules package-lock.json

# 2. Fresh install
npm install

# 3. Rebuild
npm run build

# 4. Start development
npm run dev
```

**Elveszti:** Node modules cache  
**Időtartam:** 3-5 perc

---

### 🟠 SZINT 3 - CODE RESET (Fejlesztési hibák)
**Mikor használd:** Működő kódot elrontottál, konflik git merge

```bash
# 1. Save current work (optional)
git stash

# 2. Reset to last commit
git reset --hard HEAD

# 3. Clean untracked files
git clean -fd

# 4. Apply saved work if needed
git stash pop
```

**Elveszti:** Uncommitted changes  
**Időtartam:** 1-2 perc

---

### 🔴 SZINT 4 - DATABASE RESET (Adatbázis hibák)
**Mikor használd:** Schema conflicts, data corruption, migration hibák

```bash
# 1. Backup current data (if valuable)
npx prisma db pull > schema_backup.sql

# 2. Reset database
npx prisma migrate reset

# 3. Push current schema
npx prisma db push

# 4. Seed with test data
npx prisma db seed
```

**Elveszti:** Minden adatbázis adat  
**Időtartam:** 2-3 perc

---

### 🟣 SZINT 5 - NUCLEAR RESET (Teljes visszaállítás)
**Mikor használd:** Minden más megoldás sikertelen

```bash
# 1. Kill all Node processes
pkill -f "node"
pkill -f "next"

# 2. Complete cleanup
rm -rf node_modules
rm -rf .next
rm -rf package-lock.json
rm -rf public/uploads/*

# 3. Git reset to stable commit
git reset --hard 43b1091

# 4. Fresh install
npm install

# 5. Database reset
npx prisma migrate reset
npx prisma db push
npx prisma db seed

# 6. Start fresh
npm run dev
```

**Elveszti:** Minden uncommitted változás + adatok  
**Időtartam:** 5-10 perc

---

## 🎯 COMMIT-SPECIFIKUS VISSZAÁLLÍTÁSOK

### 📌 Stabil visszaállítási pontok:

#### 1. Legfrissebb stabil állapot
```bash
git checkout 43b1091
# USER MODEL FIX: firstName/lastName mezők hozzáadása
# ✅ Tenant registration working
# ✅ Property calendar working  
# ✅ R2 cloud storage working
```

#### 2. Calendar implementáció előtti állapot
```bash
git checkout 5058e3f
# FEJLETT BÉRLŐ ŰRLAP - Többlépéses regisztráció
# ✅ Multi-step tenant form
# ❌ No calendar yet
```

#### 3. Prisma schema javítások
```bash
git checkout 6cf675d
# PRISMA SCHEMA FIX: Contract és Tenant modellek javítása
# ✅ Database schema stable
# ❌ Limited features
```

#### 4. Analytics router előtti állapot
```bash  
git checkout 9ab2a5a
# ANALYTICS ROUTER FIX
# ✅ Basic CRUD operations
# ❌ No dashboard analytics
```

---

## 🗄️ ADATBÁZIS VISSZAÁLLÍTÁSI STRATÉGIÁK

### 1. Schema Rollback (Biztonságos)
```bash
# Check current migrations
npx prisma migrate status

# Rollback specific migration
npx prisma migrate rollback

# Or reset to specific migration
npx prisma migrate reset --to 20240101120000_migration_name
```

### 2. Data Backup & Restore
```bash
# Create backup before changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_20250106_120000.sql
```

### 3. Seed Data Recreation
```bash
# Custom seed for specific scenarios
npx tsx prisma/seed.ts

# Or manual SQL insert
psql $DATABASE_URL -f manual_seed.sql
```

---

## 📁 FÁJL RENDSZER VISSZAÁLLÍTÁS

### 1. Komponens fájlok visszaállítása
```bash
# Specific file restore
git checkout HEAD -- src/components/property/simple-property-calendar.tsx

# Directory restore
git checkout HEAD -- src/components/property/
```

### 2. Upload fájlok kezelése
```bash
# Clear local uploads (development)
rm -rf public/uploads/*

# R2 cloud storage cleanup (production)
# Use Cloudflare dashboard or AWS CLI
```

### 3. Config fájlok visszaállítása
```bash
# Restore critical config files
git checkout HEAD -- package.json
git checkout HEAD -- prisma/schema.prisma
git checkout HEAD -- tsconfig.json
git checkout HEAD -- tailwind.config.js
```

---

## 🔧 ENVIRONMENT RECOVERY

### 1. Environment Variables Reset
```bash
# Copy from template
cp .env.example .env.local

# Restore production values
# DATABASE_URL=...
# NEXTAUTH_SECRET=...
# CLOUDFLARE_R2_*=...
```

### 2. Package.json Recovery
```bash
# If package.json corrupted
git checkout HEAD -- package.json

# Verify critical dependencies
npm list @prisma/client
npm list next
npm list react
```

### 3. TypeScript Configuration
```bash
# Reset tsconfig
git checkout HEAD -- tsconfig.json

# Regenerate type definitions
npx prisma generate
npm run type-check
```

---

## 🚀 DEPLOYMENT RECOVERY

### 1. Vercel Deployment Rollback
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or promote preview to production
vercel promote [deployment-url]
```

### 2. Database Migration on Production
```bash
# Check production migration status
npx prisma migrate status --schema=./prisma/schema.prisma

# Deploy pending migrations
npx prisma migrate deploy
```

### 3. Environment Variables on Vercel
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Verify all required variables present
3. Redeploy after changes

---

## 🔄 AUTOMATED RECOVERY SCRIPTS

### 1. Quick Recovery Script
```bash
#!/bin/bash
# quick-recovery.sh

echo "🔄 Starting Quick Recovery..."

# Kill processes
pkill -f "next" || true

# Clear cache
rm -rf .next

# Restart dev server
npm run dev -- --port 3334

echo "✅ Quick Recovery Complete!"
```

### 2. Full Recovery Script
```bash
#!/bin/bash
# full-recovery.sh

echo "🔄 Starting Full Recovery..."

# Kill all processes
pkill -f "node" || true
pkill -f "next" || true

# Clean everything
rm -rf node_modules package-lock.json .next

# Git reset
git reset --hard HEAD
git clean -fd

# Fresh install
npm install

# Database reset
npx prisma migrate reset --force
npx prisma db push
npx prisma db seed

# Start development
npm run dev

echo "✅ Full Recovery Complete!"
```

### 3. Database Recovery Script
```bash
#!/bin/bash
# db-recovery.sh

echo "🗄️ Database Recovery..."

# Backup current state
echo "Creating backup..."
npx prisma db pull > "backup_$(date +%Y%m%d_%H%M%S).prisma"

# Reset database
echo "Resetting database..."
npx prisma migrate reset --force

# Apply latest schema
echo "Applying schema..."
npx prisma db push

# Seed data
echo "Seeding data..."
npx prisma db seed

echo "✅ Database Recovery Complete!"
```

---

## 📊 RECOVERY VERIFICATION

### 1. Post-Recovery Checklist
```bash
# ✅ Server starts without errors
npm run dev

# ✅ Database connection works
npx prisma studio

# ✅ Build completes successfully
npm run build

# ✅ TypeScript compiles
npm run type-check

# ✅ All pages load
curl http://localhost:3333/dashboard

# ✅ API endpoints respond
curl http://localhost:3333/api/trpc/property.list
```

### 2. Function Testing
```bash
# Test major features:
# 1. User login ✅
# 2. Property creation ✅
# 3. Tenant registration ✅
# 4. Calendar display ✅
# 5. File upload ✅
# 6. Database queries ✅
```

### 3. Data Integrity Check
```sql
-- Verify database structure
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check record counts
SELECT 
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "Property") as properties,
  (SELECT COUNT(*) FROM "Tenant") as tenants,
  (SELECT COUNT(*) FROM "Contract") as contracts;
```

---

## 🛡️ PREVENTION STRATEGIES

### 1. Regular Backups
```bash
# Daily automated backup
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh

# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backups/db_backup_$DATE.sql"
tar -czf "backups/code_backup_$DATE.tar.gz" . --exclude=node_modules
```

### 2. Feature Branch Strategy
```bash
# Always create feature branches
git checkout -b feature/new-functionality

# Test thoroughly before merge
npm run build
npm run test
npm run type-check

# Merge only when stable
git checkout main
git merge feature/new-functionality
```

### 3. Staging Environment
```bash
# Deploy to staging first
vercel --prod=false

# Test all functionality
# Deploy to production only after verification
vercel --prod
```

---

## 📞 EMERGENCY CONTACTS & PROCEDURES

### 1. Critical System Down
**Order of operations:**
1. Check system status (logs, monitoring)
2. Identify scope (database, application, infrastructure)
3. Implement immediate fix or rollback
4. Communicate with stakeholders
5. Investigate root cause
6. Implement prevention measures

### 2. Data Loss Incident
**Immediate actions:**
1. Stop all write operations
2. Identify extent of loss
3. Restore from most recent backup
4. Verify data integrity
5. Resume operations
6. Document incident

### 3. Security Breach
**Response protocol:**
1. Isolate affected systems
2. Revoke all API keys/tokens
3. Reset user passwords
4. Audit access logs
5. Patch vulnerabilities
6. Monitor for further attempts

---

## 📝 RECOVERY LOG TEMPLATE

```markdown
# Recovery Incident Log

**Date:** YYYY-MM-DD HH:MM
**Severity:** Low/Medium/High/Critical
**Reporter:** Name
**Duration:** Start - End

## Issue Description
Brief description of the problem

## Root Cause
What caused the issue

## Recovery Actions Taken
1. Step 1
2. Step 2
3. Step 3

## Verification Steps
- [ ] System functional
- [ ] Data integrity verified
- [ ] Performance normal
- [ ] Users notified

## Prevention Measures
Actions to prevent recurrence

## Lessons Learned
What was learned from this incident
```

---

**🔗 Kapcsolódó dokumentumok:**
- [Backup Snapshot](./BACKUP_SNAPSHOT_2025.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [System Architecture](./SYSTEM_ARCHITECTURE.md)

**🆘 Emergency Hotline:**
```bash
# Last resort commands
git reset --hard 43b1091    # Return to stable state
npm run nuclear-reset       # Complete system reset
npx prisma migrate reset     # Database fresh start
```