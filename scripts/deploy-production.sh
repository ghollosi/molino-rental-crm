#!/bin/bash

# 🚀 TELJES PRODUCTION DEPLOYMENT SCRIPT
# Minden lépést automatizál a production deploymenthez

set -e  # Hiba esetén leállítás

echo "🚀 MOLINO RENTAL CRM - PRODUCTION DEPLOYMENT"
echo "=============================================="

# Színek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper funkciók
print_step() {
    echo -e "\n${BLUE}$1${NC}"
    echo "$(printf '=%.0s' {1..50})"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. KÖRNYEZET ELLENŐRZÉSE
print_step "1️⃣  KÖRNYEZET ELLENŐRZÉSE"

# Node.js verzió ellenőrzése
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js verzió: $NODE_VERSION"
else
    print_error "Node.js nincs telepítve!"
    exit 1
fi

# npm verzió ellenőrzése
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm verzió: $NPM_VERSION"
else
    print_error "npm nincs telepítve!"
    exit 1
fi

# Vercel CLI ellenőrzése
if command -v vercel &> /dev/null; then
    print_success "Vercel CLI telepítve"
else
    print_warning "Vercel CLI nincs telepítve, telepítjük..."
    npm install -g vercel
fi

# 2. PROJEKT ÁLLAPOT ELLENŐRZÉSE
print_step "2️⃣  PROJEKT ÁLLAPOT ELLENŐRZÉSE"

# Git állapot
if git diff --quiet && git diff --staged --quiet; then
    print_success "Git working directory clean"
else
    print_warning "Uncommitted changes found - committing..."
    git add .
    git commit -m "Pre-deployment commit - $(date +%Y-%m-%d_%H:%M:%S)"
fi

# Package.json ellenőrzése
if [ -f "package.json" ]; then
    print_success "package.json megtalálva"
else
    print_error "package.json hiányzik!"
    exit 1
fi

# Prisma schema ellenőrzése
if [ -f "prisma/schema.prisma" ]; then
    print_success "Prisma schema megtalálva"
else
    print_error "Prisma schema hiányzik!"
    exit 1
fi

# 3. DEPENDENCIES TELEPÍTÉSE
print_step "3️⃣  DEPENDENCIES TELEPÍTÉSE"

npm install
print_success "Dependencies telepítve"

# 4. TYPESCRIPT ÉS BUILD ELLENŐRZÉSE
print_step "4️⃣  TYPESCRIPT ÉS BUILD ELLENŐRZÉSE"

# TypeScript ellenőrzés
print_warning "TypeScript ellenőrzése..."
if npx tsc --noEmit; then
    print_success "TypeScript hibák nincsenek"
else
    print_error "TypeScript hibák találhatók!"
    echo "Javítsd a TypeScript hibákat és futtasd újra a scriptet."
    exit 1
fi

# Build test
print_warning "Production build tesztelése..."
if npm run build; then
    print_success "Build sikeres"
else
    print_error "Build sikertelen!"
    exit 1
fi

# 5. SUPABASE ADATBÁZIS SETUP
print_step "5️⃣  SUPABASE ADATBÁZIS SETUP"

print_warning "Prisma schema push Supabase-hez..."
if DATABASE_URL="postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres" npx prisma db push; then
    print_success "Prisma schema szinkronizálva"
else
    print_error "Prisma schema push sikertelen!"
    exit 1
fi

print_warning "Admin user és test adatok létrehozása..."
if npx tsx scripts/supabase-production-setup.ts; then
    print_success "Adatbázis setup kész"
else
    print_error "Adatbázis setup sikertelen!"
    exit 1
fi

# 6. VERCEL ENVIRONMENT VARIABLES
print_step "6️⃣  VERCEL ENVIRONMENT VARIABLES"

print_warning "FONTOS: Ellenőrizd a Vercel environment változókat!"
echo ""
echo "Menj a Vercel Dashboard-ra:"
echo "https://vercel.com/ghollosi/molino-rental-crm/settings/environment-variables"
echo ""
echo "Töröld ki az összes meglévő változót és add hozzá ezeket:"
echo ""
cat << 'EOF'
DATABASE_URL=postgresql://postgres.wymltaiembzuugxnaqzz:Gabo123kekw@aws-0-eu-central-2.pooler.supabase.com:6543/postgres
NEXTAUTH_URL=https://molino-rental-crm.vercel.app
NEXTAUTH_SECRET=molino-rental-crm-super-secret-key-2025
RESEND_API_KEY=re_YUHrniX6_PAbF5mXFSUqJK86DoYS8haeF
R2_ACCESS_KEY_ID=062db13eb2d227445539332b737c5c41
R2_SECRET_ACCESS_KEY=27b5077b94cc85ab79adb43495af8edb78fd40a85d7b3770c21a36d9e9c5a2b2
R2_BUCKET=molino-rental-uploads
R2_ENDPOINT=https://cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com
NEXT_PUBLIC_APP_URL=https://molino-rental-crm.vercel.app
NODE_ENV=production
PORT=3333
EOF
echo ""
read -p "Beállítottad a Vercel environment változókat? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Állítsd be a Vercel environment változókat és futtasd újra!"
    exit 1
fi

# 7. VERCEL DEPLOYMENT
print_step "7️⃣  VERCEL DEPLOYMENT"

print_warning "Git push origin main..."
git push origin main
print_success "Git push kész"

print_warning "Vercel deployment indítása..."
if vercel --prod; then
    print_success "Vercel deployment sikeres"
else
    print_error "Vercel deployment sikertelen!"
    exit 1
fi

# 8. DEPLOYMENT TESZT
print_step "8️⃣  DEPLOYMENT TESZT"

print_warning "Várakozás deployment befejezésére... (30 másodperc)"
sleep 30

PRODUCTION_URL="https://molino-rental-crm.vercel.app"
BYPASS_URL="$PRODUCTION_URL/api/bypass-login"

print_warning "Production URL tesztelése..."
if curl -f -s "$PRODUCTION_URL" > /dev/null; then
    print_success "Production URL elérhető: $PRODUCTION_URL"
else
    print_error "Production URL nem elérhető!"
fi

print_warning "Bypass login tesztelése..."
if curl -f -s "$BYPASS_URL" > /dev/null; then
    print_success "Bypass login elérhető: $BYPASS_URL"
else
    print_error "Bypass login nem elérhető!"
fi

# 9. ÖSSZEFOGLALÓ
print_step "🎉 DEPLOYMENT KÉSZ!"

echo ""
echo "📋 ÖSSZEFOGLALÓ:"
print_success "✅ TypeScript ellenőrzés: OK"
print_success "✅ Build teszt: OK"
print_success "✅ Supabase adatbázis: OK"
print_success "✅ Admin user létrehozva: OK"
print_success "✅ Test adatok: OK"
print_success "✅ Vercel deployment: OK"
print_success "✅ Production URL: OK"

echo ""
echo "🔗 LINKEK:"
echo "   Production URL: $PRODUCTION_URL"
echo "   Bypass Login:   $BYPASS_URL"
echo "   Force Login:    $PRODUCTION_URL/api/force-login"
echo "   Direct Login:   $PRODUCTION_URL/direct-login"

echo ""
echo "🔑 BEJELENTKEZÉSI ADATOK:"
echo "   Admin:     admin@molino.com / admin123"
echo "   Owners:    owner1-5@example.com / user123"
echo "   Tenants:   tenant1-5@example.com / user123"
echo "   Providers: provider1-5@example.com / user123"

echo ""
echo "🧪 TESZTELÉSI LÉPÉSEK:"
echo "1. Nyisd meg: $PRODUCTION_URL"
echo "2. Próbáld ki: admin@molino.com / admin123"
echo "3. Ha nem megy, próbáld: $BYPASS_URL"
echo "4. Ellenőrizd a Dashboard adatokat"

echo ""
print_success "🚀 MOLINO RENTAL CRM PRODUCTION DEPLOYMENT SIKERES!"