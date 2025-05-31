# STABILITÁSI SZABÁLYOK - KÖTELEZŐ BETARTANI!

## 1. SOHA ne változtass kódot tesztelés nélkül!

**MINDIG** futtasd le ezeket MIELŐTT bármit megváltoztatnál:
```bash
# 1. Ellenőrizd hogy fut-e a szerver
curl -s http://localhost:3333/ | grep -o "<title>.*</title>"

# 2. Futtasd a tesztelő scriptet
./scripts/test-before-change.sh
```

## 2. Változtatások után AZONNAL tesztelj!

Minden változtatás után:
1. Mentsd el a fájlt
2. Várj 2 másodpercet (Next.js hot reload)
3. Ellenőrizd hogy még mindig működik:
   ```bash
   curl -s http://localhost:3333/ | grep -o "<title>.*</title>"
   ```

## 3. Ha elrontottál valamit:

```bash
# Állítsd vissza az utolsó működő állapotot
git checkout .

# Vagy ha commitoltál:
git reset --hard HEAD~1
```

## 4. Biztonságos fejlesztési folyamat:

1. **Tervezés**: Gondold át mit fogsz csinálni
2. **Ellenőrzés**: Futtasd a tesztelő scriptet
3. **Kis lépések**: Egy időben csak egy dolgot változtass
4. **Tesztelés**: Minden lépés után tesztelj
5. **Commit**: Ha működik, commitold

## 5. TILOS:

- ❌ Több fájlt egyszerre módosítani tesztelés nélkül
- ❌ TypeScript hibákat ignorálni
- ❌ Build hibával commitolni
- ❌ A porton (3333) változtatni
- ❌ Az .env fájlban kritikus értékeket módosítani

## 6. Szerver indítása:

Ha nem fut a szerver:
```bash
npm run dev
```

Ha már fut de hibás:
```bash
# Leállítás
lsof -ti:3333 | xargs kill -9

# Újraindítás
npm run dev
```

## 7. Mentési pontok:

Sikeres változtatások után:
```bash
git add .
git commit -m "STABLE: [mit csináltál]"
```

---

**EMLÉKEZZ**: A stabilitás fontosabb mint a sebesség!