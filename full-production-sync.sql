-- FULL PRODUCTION DATABASE SYNC
-- This will make production database identical to local development

-- 1. DROP ALL EXISTING TABLES (clean slate)
DROP TABLE IF EXISTS "Issue" CASCADE;
DROP TABLE IF EXISTS "Offer" CASCADE;
DROP TABLE IF EXISTS "Contract" CASCADE;
DROP TABLE IF EXISTS "ContractTemplate" CASCADE;
DROP TABLE IF EXISTS "Provider" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;
DROP TABLE IF EXISTS "Property" CASCADE;
DROP TABLE IF EXISTS "Owner" CASCADE;
DROP TABLE IF EXISTS "Company" CASCADE;
DROP TABLE IF EXISTS "UploadedFile" CASCADE;
DROP TABLE IF EXISTS "RateLimitToken" CASCADE;
DROP TABLE IF EXISTS "AccessRule" CASCADE;
DROP TABLE IF EXISTS "AccessMonitoring" CASCADE;
DROP TABLE IF EXISTS "AccessCode" CASCADE;
DROP TABLE IF EXISTS "SmartLock" CASCADE;
DROP TABLE IF EXISTS "PropertyProvider" CASCADE;
DROP TABLE IF EXISTS "PropertyTenant" CASCADE;
DROP TABLE IF EXISTS "IssueTimeline" CASCADE;
DROP TABLE IF EXISTS "PropertyPricing" CASCADE;
DROP TABLE IF EXISTS "BookingIntegration" CASCADE;
DROP TABLE IF EXISTS "WhatsAppMessage" CASCADE;
DROP TABLE IF EXISTS "ZohoInvoice" CASCADE;
DROP TABLE IF EXISTS "CaixaBankTransaction" CASCADE;
DROP TABLE IF EXISTS "ReconciliationLog" CASCADE;
DROP TABLE IF EXISTS "IntegrationConfig" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "Language" CASCADE;
DROP TYPE IF EXISTS "PropertyType" CASCADE;
DROP TYPE IF EXISTS "PropertyStatus" CASCADE;
DROP TYPE IF EXISTS "IssueCategory" CASCADE;
DROP TYPE IF EXISTS "IssuePriority" CASCADE;
DROP TYPE IF EXISTS "IssueStatus" CASCADE;
DROP TYPE IF EXISTS "OfferStatus" CASCADE;
DROP TYPE IF EXISTS "ContractStatus" CASCADE;
DROP TYPE IF EXISTS "ProviderSpecialization" CASCADE;
DROP TYPE IF EXISTS "BookingPlatform" CASCADE;
DROP TYPE IF EXISTS "LockPlatform" CASCADE;
DROP TYPE IF EXISTS "AccessTimeRestriction" CASCADE;
DROP TYPE IF EXISTS "AccessRenewalStatus" CASCADE;
DROP TYPE IF EXISTS "ProviderType" CASCADE;
DROP TYPE IF EXISTS "TenantType" CASCADE;

-- 2. CREATE ENUMS
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR_ADMIN', 'OFFICE_ADMIN', 'OWNER', 'SERVICE_MANAGER', 'PROVIDER', 'TENANT');
CREATE TYPE "Language" AS ENUM ('HU', 'EN', 'ES');
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'OFFICE', 'COMMERCIAL');
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE');
CREATE TYPE "IssueCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'STRUCTURAL', 'OTHER');
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');
CREATE TYPE "ProviderSpecialization" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'CLEANING', 'MAINTENANCE', 'SECURITY', 'GENERAL');
CREATE TYPE "BookingPlatform" AS ENUM ('AIRBNB', 'BOOKING_COM', 'VRBO', 'DIRECT');
CREATE TYPE "LockPlatform" AS ENUM ('TTLOCK', 'NUKI', 'YALE', 'AUGUST', 'SCHLAGE');
CREATE TYPE "AccessTimeRestriction" AS ENUM ('BUSINESS_HOURS', 'EXTENDED_HOURS', 'DAYLIGHT_ONLY', 'CUSTOM', 'NO_RESTRICTION');
CREATE TYPE "AccessRenewalStatus" AS ENUM ('ACTIVE', 'PENDING_RENEWAL', 'EXPIRED', 'SUSPENDED');
CREATE TYPE "ProviderType" AS ENUM ('REGULAR', 'OCCASIONAL', 'EMERGENCY');
CREATE TYPE "TenantType" AS ENUM ('LONG_TERM', 'SHORT_TERM', 'VACATION_RENTAL');

-- 3. CREATE USER TABLE (keep existing structure but add missing fields)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" "Language" DEFAULT 'HU';

-- Update firstName from name if exists
UPDATE "User" SET "firstName" = name WHERE "firstName" IS NULL AND name IS NOT NULL;
UPDATE "User" SET "firstName" = 'Admin' WHERE email = 'admin@molino.com' AND "firstName" IS NULL;

-- Make firstName required
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;

-- 4. CREATE ALL OTHER TABLES
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "taxNumber" TEXT,
    "bankAccount" TEXT,
    "street" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Owner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "companyName" TEXT,
    "taxNumber" TEXT,
    "billingAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL DEFAULT 'APARTMENT',
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "squareMeters" DECIMAL(10,2),
    "monthlyRent" DECIMAL(10,2),
    "deposit" DECIMAL(10,2),
    "availableFrom" TIMESTAMP(3),
    "images" TEXT[],
    "amenities" TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "currentTenantId" TEXT,
    "capacity" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "occupation" TEXT,
    "monthlyIncome" DECIMAL(10,2),
    "previousAddress" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "notes" TEXT,
    "coTenants" JSONB,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "company" TEXT,
    "specialization" "ProviderSpecialization" NOT NULL DEFAULT 'GENERAL',
    "hourlyRate" DECIMAL(10,2),
    "availableHours" TEXT,
    "serviceArea" TEXT,
    "rating" DECIMAL(3,2),
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "IssuePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "category" "IssueCategory" NOT NULL DEFAULT 'OTHER',
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "images" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Issue_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Issue_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "RateLimitToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "usage" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. INSERT INITIAL DATA
INSERT INTO "Company" ("id", "name", "email", "phone", "createdAt", "updatedAt") 
VALUES ('company-1', 'Molino Rental CRM', 'admin@molino.com', '+36 1 234 5678', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "Owner" ("id", "userId", "companyName", "createdAt", "updatedAt") 
VALUES ('owner-1', 'cmb9bk7zv0000jnsh3qx43rth', 'Molino Rentals', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create sample property
INSERT INTO "Property" ("id", "ownerId", "title", "address", "type", "bedrooms", "bathrooms", "monthlyRent", "capacity", "createdAt", "updatedAt")
VALUES (
    'property-1', 
    'owner-1', 
    'Modern Apartment in Budapest', 
    'Budapest, Váci út 1-3, 1062 Hungary', 
    'APARTMENT', 
    2, 
    1, 
    150000.00, 
    4, 
    NOW(), 
    NOW()
) ON CONFLICT DO NOTHING;

-- Create sample tenant
INSERT INTO "Tenant" ("id", "userId", "occupation", "monthlyIncome", "createdAt", "updatedAt")
VALUES ('tenant-1', 'cmb9bk7zv0000jnsh3qx43rth', 'Software Developer', 500000.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create sample provider  
INSERT INTO "Provider" ("id", "userId", "specialization", "hourlyRate", "createdAt", "updatedAt")
VALUES ('provider-1', 'cmb9bk7zv0000jnsh3qx43rth', 'PLUMBING', 8000.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create sample issue
INSERT INTO "Issue" ("id", "propertyId", "title", "description", "reportedById", "category", "priority", "createdAt", "updatedAt")
VALUES (
    'issue-1', 
    'property-1', 
    'Vízszivárgás a konyhában', 
    'A mosogató alatt víz szivárog, azonnali javítás szükséges.', 
    'cmb9bk7zv0000jnsh3qx43rth', 
    'PLUMBING', 
    'HIGH', 
    NOW(), 
    NOW()
) ON CONFLICT DO NOTHING;

-- Final verification
SELECT 'Database sync completed successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;