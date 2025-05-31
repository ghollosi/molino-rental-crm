# Molino RENTAL CRM - Gyors indítás

## 🚀 Szerver indítása (egyszerű módszer)

```bash
# A projekt könyvtárban:
./scripts/dev-server.sh
```

Ez automatikusan:
- Ellenőrzi és leállítja a 3333-as porton futó folyamatokat
- Ellenőrzi a PostgreSQL-t
- Elindítja a szervert a http://localhost:3333 címen

## 📝 Bejelentkezési adatok

- **Email:** admin@molino.com
- **Jelszó:** admin123

## 🛠️ Kézi indítás (ha szükséges)

```bash
# 1. PostgreSQL indítása (ha nem fut)
brew services start postgresql@14

# 2. Függőségek telepítése (első alkalommal)
npm install

# 3. Adatbázis migrációk futtatása (első alkalommal)
npm run db:migrate

# 4. Fejlesztői szerver indítása
npm run dev
```

## ⚠️ Gyakori problémák

### Port foglalt
Ha a 3333-as port foglalt:
```bash
lsof -i :3333
kill -9 [PID]
```

### Adatbázis kapcsolati hiba
Ellenőrizd a PostgreSQL:
```bash
pg_isready -h localhost -p 5432
```

### Cache problémák
Böngésző cache törlése:
- Ctrl+Shift+R (Windows/Linux)
- Cmd+Shift+R (Mac)

## 📁 Fontos útvonalak

- **Dashboard:** http://localhost:3333/dashboard
- **Ingatlanok:** http://localhost:3333/dashboard/properties
- **Tulajdonosok:** http://localhost:3333/dashboard/owners
- **Bérlők:** http://localhost:3333/dashboard/tenants

## 🔧 Környezeti változók

A `.env.local` fájlban már be van állítva:
- PORT=3333
- DATABASE_URL
- NEXTAUTH_URL=http://localhost:3333

## 📱 Fejlesztői tippek

1. **Hot Reload:** A kód változtatásai automatikusan újratöltődnek
2. **TypeScript:** Típushibák azonnal megjelennek a konzolon
3. **tRPC:** API hívások típusbiztonságosak

## 🐛 Hibaelhárítás

Ha bármi nem működik:
1. Állítsd le a szervert (Ctrl+C)
2. Töröld a `.next` mappát: `rm -rf .next`
3. Indítsd újra: `./scripts/dev-server.sh`

---

**Megjegyzés:** Az auth rendszer ideiglenesen egyszerűsítve van a fejlesztés megkönnyítése érdekében.