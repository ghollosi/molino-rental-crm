#!/bin/bash

# Test script a változtatások előtt
# Ez a script ellenőrzi, hogy minden működik-e változtatás előtt

echo "🔍 Ellenőrzés indítása..."

# Színek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ellenőrizzük, hogy fut-e a fejlesztői szerver
check_dev_server() {
    echo -n "Dev szerver ellenőrzése... "
    if curl -s http://localhost:3333/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Fut${NC}"
        return 0
    else
        echo -e "${RED}✗ Nem fut${NC}"
        echo -e "${YELLOW}Próbáld: npm run dev${NC}"
        return 1
    fi
}

# TypeScript és ESLint ellenőrzés
check_typescript() {
    echo -n "TypeScript ellenőrzése... "
    if npm run type-check > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ Hibák vannak${NC}"
        npm run type-check
        return 1
    fi
}

# Build ellenőrzés
check_build() {
    echo -n "Build ellenőrzése... "
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ Build hiba${NC}"
        npm run build
        return 1
    fi
}

# Főbb oldalak ellenőrzése
check_pages() {
    echo "Oldalak ellenőrzése..."
    local pages=("/" "/login" "/register" "/dashboard")
    local all_ok=true
    
    for page in "${pages[@]}"; do
        echo -n "  $page ... "
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3333$page)
        if [ "$response" = "200" ] || [ "$response" = "307" ]; then
            echo -e "${GREEN}✓ OK ($response)${NC}"
        else
            echo -e "${RED}✗ Hiba ($response)${NC}"
            all_ok=false
        fi
    done
    
    if $all_ok; then
        return 0
    else
        return 1
    fi
}

# Főprogram
main() {
    echo "================================"
    echo "Molino CRM Tesztelés"
    echo "================================"
    echo ""
    
    local errors=0
    
    check_dev_server || ((errors++))
    check_typescript || ((errors++))
    check_build || ((errors++))
    
    if [ $errors -eq 0 ] && check_dev_server; then
        check_pages || ((errors++))
    fi
    
    echo ""
    echo "================================"
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✅ Minden rendben! Biztonságos a változtatás.${NC}"
        exit 0
    else
        echo -e "${RED}❌ $errors hiba található! Javítsd ki őket változtatás előtt.${NC}"
        exit 1
    fi
}

# Futtatás
main