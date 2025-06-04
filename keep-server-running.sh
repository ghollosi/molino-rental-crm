#!/bin/bash
# Szerver monitor script

echo "🔄 Szerver monitor indítása..."

while true; do
    # Ellenőrizzük a szervert
    if ! curl -s -f http://localhost:3333 > /dev/null 2>&1; then
        echo "❌ Szerver nem válaszol, újraindítás..."
        
        # Leállítjuk a hibás folyamatokat
        pkill -f "next dev" 2>/dev/null || true
        sleep 2
        
        # Újraindítjuk
        cd /Users/hollosigabor/molino-rental-crm
        nohup npm run dev > dev-server.log 2>&1 &
        
        echo "🚀 Szerver újraindítva"
        sleep 5
    else
        echo "✅ $(date '+%H:%M:%S') - Szerver működik: http://localhost:3333"
    fi
    
    sleep 10
done