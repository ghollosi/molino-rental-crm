#!/bin/bash

# Molino Rental CRM - Automatikus Deployment Script
# Használat: ./scripts/deploy-to-vercel.sh

set -e  # Exit on error

echo "🚀 Molino Rental CRM - Deployment Script"
echo "========================================"

# Színek a kimenethez
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Git státusz ellenőrzése
echo -e "\n${YELLOW}1. Git státusz ellenőrzése...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ Vannak nem commitolt változtatások!${NC}"
    echo "Kérem commitolja a változtatásokat:"
    git status -s
    exit 1
fi
echo -e "${GREEN}✅ Git working directory tiszta${NC}"

# 2. TypeScript hibák ellenőrzése
echo -e "\n${YELLOW}2. TypeScript ellenőrzés...${NC}"
if npm run type-check 2>&1 | grep -E "error TS[0-9]+"; then
    echo -e "${RED}❌ TypeScript hibák találhatók!${NC}"
    echo "Futtassa: npm run type-check"
    exit 1
fi
echo -e "${GREEN}✅ Nincs TypeScript hiba${NC}"

# 3. Build teszt
echo -e "\n${YELLOW}3. Build teszt futtatása...${NC}"
if ! npm run build > /dev/null 2>&1; then
    echo -e "${RED}❌ Build hiba!${NC}"
    echo "Futtassa: npm run build"
    exit 1
fi
echo -e "${GREEN}✅ Build sikeres${NC}"

# 4. Tesztek futtatása (ha vannak)
echo -e "\n${YELLOW}4. Tesztek futtatása...${NC}"
if npm run test:unit > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Unit tesztek sikeresek${NC}"
else
    echo -e "${YELLOW}⚠️  Unit tesztek sikertelenek vagy hiányoznak${NC}"
fi

# 5. Jelenlegi branch és remote ellenőrzése
echo -e "\n${YELLOW}5. Git információk...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "Branch: $CURRENT_BRANCH"

# 6. Változtatások pusholása
echo -e "\n${YELLOW}6. Változtatások feltöltése GitHubra...${NC}"
git push origin $CURRENT_BRANCH
echo -e "${GREEN}✅ Push sikeres${NC}"

# 7. Deployment státusz
echo -e "\n${YELLOW}7. Deployment információk${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Production URL: https://molino-rental-crm.vercel.app"
echo "📊 Vercel Dashboard: https://vercel.com/ghollosi/molino-rental-crm"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 8. Deployment triggereléséről információ
echo -e "\n${GREEN}✅ A deployment automatikusan elindul a GitHub push után.${NC}"
echo -e "${YELLOW}Követheti a folyamatot:${NC}"
echo "1. GitHub: Zöld pipa a commit mellett"
echo "2. Vercel Dashboard: Build logok"
echo "3. ~2-3 perc múlva elérhető a production URL-en"

# 9. Post-deployment teendők
echo -e "\n${YELLOW}📋 Post-deployment checklist:${NC}"
echo "[ ] Ellenőrizze a Vercel Dashboard-on a build státuszt"
echo "[ ] Tesztelje a production URL-t"
echo "[ ] Ellenőrizze a főbb funkciókat"
echo "[ ] Nézze át a browser console-t hibákért"

# 10. Verzió információ mentése
echo -e "\n${YELLOW}10. Deployment log frissítése...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "$TIMESTAMP - Deploy: $COMMIT_HASH - Branch: $CURRENT_BRANCH" >> deployment.log
echo -e "${GREEN}✅ Deployment log frissítve${NC}"

echo -e "\n${GREEN}🎉 Deployment script sikeres!${NC}"
echo -e "${YELLOW}Várjon 2-3 percet a deployment befejezéséig.${NC}"

# Opcionális: Nyissa meg a Vercel Dashboard-ot
read -p "Megnyitja a Vercel Dashboard-ot? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://vercel.com/ghollosi/molino-rental-crm"
fi