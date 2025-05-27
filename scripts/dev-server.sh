#!/bin/bash
# Megbízható fejlesztői szerver indító szkript

echo "🚀 Molino RENTAL CRM - Fejlesztői szerver indítása..."

# Ellenőrizzük, hogy fut-e már valami a 3333-as porton
if lsof -Pi :3333 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  A 3333-as port már használatban van. Leállítom a folyamatot..."
    kill -9 $(lsof -Pi :3333 -sTCP:LISTEN -t)
    sleep 2
fi

# Ellenőrizzük a PostgreSQL-t
echo "🔍 PostgreSQL ellenőrzése..."
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL nem fut. Kérlek indítsd el először!"
    exit 1
fi

# Környezeti változók beállítása
export PORT=3333
export NODE_ENV=development

# Indítsuk el a szervert
echo "✅ Szerver indítása a http://localhost:3333 címen..."
echo "📝 Belépési adatok: admin@molino.com / admin123"
echo ""

# Next.js indítása közvetlenül
cd "$(dirname "$0")/.." && npx next dev -p 3333