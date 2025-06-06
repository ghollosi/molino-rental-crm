-- SUPABASE ADMIN USER LÉTREHOZÁSA
-- Futtasd ezt a Supabase SQL Editor-ban: https://app.supabase.com/project/wymltaiembzuugxnaqzz/editor

-- 1. Ellenőrizd, hogy létezik-e már az admin user
SELECT * FROM "User" WHERE email = 'admin@molino.com';

-- 2. Ha nem létezik, hozd létre az admin usert
-- FONTOS: A jelszó már bcrypt-tel van hash-elve
INSERT INTO "User" (
    id,
    email,
    password,
    firstName,
    lastName,
    role,
    language,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    'clz1234567890admin',  -- Fix ID az egyszerűség kedvéért
    'admin@molino.com',
    '$2b$10$xVUEF3mKRKtpNPE5lqFLCu87KYUR6wflSI8fwC1M9LrdDoNbNxPxK',  -- admin123 bcrypt hash
    'Admin',
    'User',
    'ADMIN',
    'HU',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = 'ADMIN',
    "isActive" = true,
    "updatedAt" = NOW();

-- 3. Ellenőrizd a többi test usert is
-- Tulajdonosok
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO "User" (
            id,
            email,
            password,
            firstName,
            lastName,
            role,
            language,
            "isActive",
            "createdAt",
            "updatedAt"
        ) VALUES (
            'owner' || i || '_' || gen_random_uuid(),
            'owner' || i || '@example.com',
            '$2b$10$WplSbk4quzeB6hYqYqYKAumXFZ4SrNM/JWJvvT6PlqUGEXLHOgFbu',  -- user123
            'Owner',
            i::TEXT,
            'OWNER',
            'HU',
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
    END LOOP;
END $$;

-- Bérlők
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO "User" (
            id,
            email,
            password,
            firstName,
            lastName,
            role,
            language,
            "isActive",
            "createdAt",
            "updatedAt"
        ) VALUES (
            'tenant' || i || '_' || gen_random_uuid(),
            'tenant' || i || '@example.com',
            '$2b$10$WplSbk4quzeB6hYqYqYKAumXFZ4SrNM/JWJvvT6PlqUGEXLHOgFbu',  -- user123
            'Tenant',
            i::TEXT,
            'TENANT',
            'HU',
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
    END LOOP;
END $$;

-- Szolgáltatók
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO "User" (
            id,
            email,
            password,
            firstName,
            lastName,
            role,
            language,
            "isActive",
            "createdAt",
            "updatedAt"
        ) VALUES (
            'provider' || i || '_' || gen_random_uuid(),
            'provider' || i || '@example.com',
            '$2b$10$WplSbk4quzeB6hYqYqYKAumXFZ4SrNM/JWJvvT6PlqUGEXLHOgFbu',  -- user123
            'Provider',
            i::TEXT,
            'PROVIDER',
            'HU',
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (email) DO NOTHING;
    END LOOP;
END $$;

-- 4. Ellenőrizd az eredményt
SELECT id, email, role, "isActive" FROM "User" ORDER BY "createdAt" DESC;

-- 5. Ha szükséges, ellenőrizd a Company táblát is
SELECT * FROM "Company";

-- Ha nincs Company rekord, hozz létre egyet
INSERT INTO "Company" (
    id,
    name,
    settings,
    "createdAt",
    "updatedAt"
) VALUES (
    'default-company',
    'Molino Rental Company',
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;