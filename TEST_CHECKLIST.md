# Molino CRM - Tesztelési Ellenőrző Lista

## ✅ Működik (Tesztelve)
- [x] **Tulajdonosok (Owners)**
  - [x] Létrehozás - `/dashboard/owners/create` (standalone API)
  - [x] Listázás - `/dashboard/owners`
  - [x] Gyors létrehozás modal - Property form-ban (standalone API - JAVÍTVA!)
  - [ ] Szerkesztés - Kattints egy tulajdonosra
  - [ ] Törlés - Törlés gomb

## ⏳ Tesztelendő - tRPC Mutations

### 🏠 Ingatlanok (Properties)
- [ ] Létrehozás - `/dashboard/properties` → "Új ingatlan"
- [ ] Listázás - `/dashboard/properties`
- [ ] Szerkesztés - Kattints egy ingatlanra
- [ ] Törlés - Törlés gomb
- [ ] Képfeltöltés - Létrehozásnál/szerkesztésnél

### 👥 Bérlők (Tenants)
- [ ] Létrehozás - `/dashboard/tenants` → "Új bérlő"
- [ ] Listázás - `/dashboard/tenants`
- [ ] Szerkesztés - Kattints egy bérlőre
- [ ] Törlés - Törlés gomb

### 📄 Szerződések (Contracts)
- [ ] Létrehozás - `/dashboard/contracts` → "Új szerződés"
- [ ] Listázás - `/dashboard/contracts`
- [ ] Szerkesztés - Kattints egy szerződésre
- [ ] Törlés - Törlés gomb
- [ ] PDF generálás - Szerződés megtekintése

### 🔧 Hibabejelentések (Issues)
- [ ] Létrehozás - `/dashboard/issues` → "Új hibabejelentés"
- [ ] Listázás - `/dashboard/issues`
- [ ] Szerkesztés - Kattints egy hibabejelentésre
- [ ] Törlés - Törlés gomb
- [ ] Képfeltöltés - Létrehozásnál
- [ ] Státusz váltás - Szerkesztésnél

### 💰 Ajánlatok (Offers)
- [ ] Létrehozás - `/dashboard/offers` → "Új ajánlat"
- [ ] Listázás - `/dashboard/offers`
- [ ] Szerkesztés - Kattints egy ajánlatra
- [ ] Törlés - Törlés gomb
- [ ] Dinamikus tételek - Hozzáadás/törlés

### 🛠️ Szolgáltatók (Providers)
- [ ] Létrehozás - `/dashboard/providers` → "Új szolgáltató"
- [ ] Listázás - `/dashboard/providers`
- [ ] Szerkesztés - Kattints egy szolgáltatóra
- [ ] Törlés - Törlés gomb

## 🔍 Tesztelési lépések:

1. **Létrehozás tesztelése:**
   - Töltsd ki a kötelező mezőket
   - Kattints a "Létrehozás" gombra
   - Ellenőrizd hogy átirányít a listához
   - Ellenőrizd hogy megjelenik az új rekord

2. **Szerkesztés tesztelése:**
   - Kattints egy meglévő rekordra
   - Módosíts néhány mezőt
   - Mentsd el
   - Ellenőrizd hogy a változások megmaradtak

3. **Törlés tesztelése:**
   - Kattints a törlés gombra
   - Erősítsd meg a törlést
   - Ellenőrizd hogy eltűnt a listából

## ⚠️ Ismert problémák:
- Service Worker cache ki van kapcsolva
- Tulajdonos létrehozás standalone API-t használ (NewOwnerModal is!)
- Test page: `/dashboard/test-owner-modal` - Modal működésének ellenőrzésére

## 📊 Eredmények:
- Tesztelve: 2025-05-30 00:58
- Utolsó frissítés: NewOwnerModal javítás debug logokkal
- Állapot: Folyamatban