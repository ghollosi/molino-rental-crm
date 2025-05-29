#!/bin/bash

# Production Setup Script
# Ez a script előkészíti a production környezetet

echo "🚀 Production Setup Script"
echo "========================="

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Ellenőrizzük a .env.production fájlt
echo -e "\n${YELLOW}1. Checking .env.production...${NC}"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓ .env.production found${NC}"
else
    echo -e "${RED}✗ .env.production not found!${NC}"
    exit 1
fi

# 2. Database URL ellenőrzése
echo -e "\n${YELLOW}2. Checking database connection...${NC}"
if grep -q "DATABASE_URL" .env.production; then
    echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
else
    echo -e "${RED}✗ DATABASE_URL missing!${NC}"
    exit 1
fi

# 3. API kulcsok ellenőrzése
echo -e "\n${YELLOW}3. Checking API keys...${NC}"
if grep -q "RESEND_API_KEY" .env.production && grep -q "R2_ACCESS_KEY_ID" .env.production; then
    echo -e "${GREEN}✓ API keys configured${NC}"
else
    echo -e "${YELLOW}⚠ Some API keys might be missing${NC}"
fi

# 4. NextAuth secret generálása (ha még nincs)
echo -e "\n${YELLOW}4. Generating NextAuth secret...${NC}"
if grep -q 'NEXTAUTH_SECRET=""' .env.production; then
    NEW_SECRET=$(openssl rand -base64 32)
    sed -i '' "s/NEXTAUTH_SECRET=\"\"/NEXTAUTH_SECRET=\"$NEW_SECRET\"/" .env.production
    echo -e "${GREEN}✓ Generated new NEXTAUTH_SECRET${NC}"
else
    echo -e "${GREEN}✓ NEXTAUTH_SECRET already set${NC}"
fi

# 5. Build ellenőrzése
echo -e "\n${YELLOW}5. Checking build...${NC}"
if [ -d ".next" ]; then
    echo -e "${GREEN}✓ Build directory exists${NC}"
else
    echo -e "${YELLOW}⚠ No build found. Run 'npm run build' first${NC}"
fi

# 6. Összefoglaló
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Production setup check complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Push to GitHub: git push origin main"
echo "2. Connect GitHub to Vercel"
echo "3. Add environment variables in Vercel dashboard"
echo "4. Deploy!"

echo -e "\n${YELLOW}Database migration command:${NC}"
echo "npx prisma migrate deploy"