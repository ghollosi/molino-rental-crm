#!/bin/bash

# Script a szerver folyamatos futtatásához
# Ez biztosítja, hogy a fejlesztői szerver mindig fusson

echo "🚀 Molino CRM Server Monitor"
echo "=========================="

# Színek
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Funkció a szerver ellenőrzésére
check_server() {
    if curl -s http://localhost:3333/ > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Funkció a szerver indítására
start_server() {
    echo -e "${YELLOW}⚡ Szerver indítása...${NC}"
    cd /Users/hollosigabor/molino-rental-crm
    npm run dev > dev-server.log 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > .server.pid
    sleep 5
}

# Főciklus
while true; do
    if check_server; then
        echo -e "${GREEN}✅ Szerver fut ($(date +%H:%M:%S))${NC}"
    else
        echo -e "${RED}❌ Szerver nem fut!${NC}"
        
        # Megpróbáljuk leállítani a régi folyamatot
        if [ -f .server.pid ]; then
            OLD_PID=$(cat .server.pid)
            kill -9 $OLD_PID 2>/dev/null
            rm .server.pid
        fi
        
        # Port felszabadítása
        lsof -ti:3333 | xargs kill -9 2>/dev/null
        
        # Újraindítás
        start_server
        
        # Ellenőrzés hogy sikerült-e
        sleep 5
        if check_server; then
            echo -e "${GREEN}✅ Szerver sikeresen újraindult!${NC}"
        else
            echo -e "${RED}❌ Nem sikerült újraindítani! Nézd meg a dev-server.log fájlt!${NC}"
        fi
    fi
    
    # Várunk 30 másodpercet a következő ellenőrzésig
    sleep 30
done