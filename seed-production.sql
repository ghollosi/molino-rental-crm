-- Production Seed Data for Molino Rental CRM
-- Run this AFTER running migration-production.sql

-- Update existing admin user to have proper fields
UPDATE "User" 
SET 
  "firstName" = 'Admin',
  "lastName" = 'User',
  "phone" = '+36 1 234 5678',
  language = 'HU'
WHERE email = 'admin@molino.com';

-- Create company
INSERT INTO "Company" (
  id, name, "taxNumber", "bankAccount", street, city, "postalCode", country, settings
) VALUES (
  'comp_molino_001',
  'Molino RENTAL Kft.',
  '12345678-1-42',
  '12345678-12345678-12345678',
  'Váci út 1.',
  'Budapest',
  '1133',
  'Magyarország',
  '{"currency": "HUF", "language": "HU", "timezone": "Europe/Budapest", "email": "info@molino-rental.hu", "phone": "+36 1 234 5678"}'::jsonb
);

-- Create demo users with bcrypt hashed password (user123)
INSERT INTO "User" (id, email, password, "firstName", "lastName", role, language, phone, "isActive") VALUES
('user_owner_001', 'nagy.istvan@example.com', '$2b$10$UfEB1GDpfWfzXu5KH.3QX.wvlEh2txe.zjcoYEwuzk0PpjoazWhXK', 'Nagy', 'István', 'OWNER', 'HU', '+36 30 111 2222', true),
('user_owner_002', 'kovacs.maria@example.com', '$2b$10$UfEB1GDpfWfzXu5KH.3QX.wvlEh2txe.zjcoYEwuzk0PpjoazWhXK', 'Kovács', 'Mária', 'OWNER', 'HU', '+36 30 333 4444', true),
('user_tenant_001', 'szabo.peter@example.com', '$2b$10$UfEB1GDpfWfzXu5KH.3QX.wvlEh2txe.zjcoYEwuzk0PpjoazWhXK', 'Szabó', 'Péter', 'TENANT', 'HU', '+36 70 555 6666', true),
('user_tenant_002', 'toth.anna@example.com', '$2b$10$UfEB1GDpfWfzXu5KH.3QX.wvlEh2txe.zjcoYEwuzk0PpjoazWhXK', 'Tóth', 'Anna', 'TENANT', 'HU', '+36 70 777 8888', true),
('user_provider_001', 'fixit.kft@example.com', '$2b$10$UfEB1GDpfWfzXu5KH.3QX.wvlEh2txe.zjcoYEwuzk0PpjoazWhXK', 'Fix-It', 'Kft.', 'PROVIDER', 'HU', '+36 20 999 0000', true);

-- Create owner profiles
INSERT INTO "Owner" (id, "userId", "taxNumber", "bankAccount", "billingStreet", "billingCity", "billingPostalCode", "billingCountry") VALUES
('owner_001', 'user_owner_001', '87654321-1-42', '87654321-87654321-87654321', 'Petőfi utca 10.', 'Budapest', '1052', 'Magyarország'),
('owner_002', 'user_owner_002', '11223344-1-42', '11223344-11223344-11223344', 'Kossuth tér 5.', 'Debrecen', '4024', 'Magyarország');

-- Create tenant profiles
INSERT INTO "Tenant" (id, "userId", "emergencyName", "emergencyPhone") VALUES
('tenant_001', 'user_tenant_001', 'Szabó János (édesapa)', '+36 30 123 4567'),
('tenant_002', 'user_tenant_002', 'Tóth László (férj)', '+36 30 987 6543');

-- Create provider profiles
INSERT INTO "Provider" (id, "userId", "businessName", specialty, "hourlyRate", currency, rating, availability) VALUES
('provider_001', 'user_provider_001', 'Fix-It Szolgáltató Kft.', ARRAY['Vízvezeték-szerelés', 'Villanyszerelés', 'Fűtés-szellőzés'], 15000, 'HUF', 4.5, '{"monday": {"start": "08:00", "end": "18:00"}, "tuesday": {"start": "08:00", "end": "18:00"}}'::jsonb);

-- Create properties
INSERT INTO "Property" (id, "ownerId", street, city, "postalCode", country, type, size, rooms, floor, "rentAmount", currency, status, photos) VALUES
('property_001', 'owner_001', 'Andrássy út 60.', 'Budapest', '1062', 'Magyarország', 'APARTMENT', 65, 2, 3, 180000, 'HUF', 'RENTED', ARRAY[]::TEXT[]),
('property_002', 'owner_001', 'Váci út 15.', 'Budapest', '1134', 'Magyarország', 'APARTMENT', 85, 3, 5, 250000, 'HUF', 'AVAILABLE', ARRAY[]::TEXT[]),
('property_003', 'owner_002', 'Bem rakpart 20.', 'Budapest', '1011', 'Magyarország', 'HOUSE', 150, 4, 0, 350000, 'HUF', 'RENTED', ARRAY[]::TEXT[]);

-- Create contracts
INSERT INTO "Contract" (id, "propertyId", "tenantId", "startDate", "endDate", "rentAmount", deposit, "paymentDay") VALUES
('contract_001', 'property_001', 'tenant_001', '2024-01-01', '2025-12-31', 180000, 360000, 5),
('contract_002', 'property_003', 'tenant_002', '2024-06-01', '2025-05-31', 350000, 700000, 1);

-- Create issues
INSERT INTO "Issue" (id, "propertyId", "reportedById", title, description, category, priority, status, photos) VALUES
('issue_001', 'property_001', 'user_tenant_001', 'Csöpög a csap a konyhában', 'A konyhai mosogató csapja folyamatosan csöpög, javítás szükséges.', 'PLUMBING', 'HIGH', 'OPEN', ARRAY[]::TEXT[]),
('issue_002', 'property_003', 'user_tenant_002', 'Nem működik a fűtés', 'A nappaliban lévő radiátor nem melegszik, sürgős javítás szükséges.', 'HVAC', 'URGENT', 'IN_PROGRESS', ARRAY[]::TEXT[]);

-- Create offers
INSERT INTO "Offer" (id, "propertyId", "issueId", "createdById", items, "laborCost", "materialCost", "totalAmount", currency, "validUntil", status, notes) VALUES
('offer_001', 'property_001', 'issue_001', 'user_provider_001', '[{"description": "Egykaros mosogató csap csere", "quantity": 1, "unitPrice": 25000, "total": 25000}]'::jsonb, 35000, 25000, 60000, 'HUF', NOW() + INTERVAL '30 days', 'SENT', 'A csap teljes cseréje szükséges, javítás nem lehetséges.');

-- Verify data was inserted
SELECT 'Users created:' as info, COUNT(*) as count FROM "User";
SELECT 'Companies created:' as info, COUNT(*) as count FROM "Company"; 
SELECT 'Properties created:' as info, COUNT(*) as count FROM "Property";
SELECT 'Contracts created:' as info, COUNT(*) as count FROM "Contract";
SELECT 'Issues created:' as info, COUNT(*) as count FROM "Issue";
SELECT 'Offers created:' as info, COUNT(*) as count FROM "Offer";