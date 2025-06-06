-- PRODUCTION SCHEMA FIX
-- Létrehozza a hiányzó táblákat a Supabase production adatbázisban

-- Owner table
CREATE TABLE IF NOT EXISTS "Owner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "taxNumber" TEXT,
    "billingAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- Property table  
CREATE TABLE IF NOT EXISTS "Property" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- Tenant table
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occupation" TEXT,
    "monthlyIncome" DECIMAL(10,2),
    "previousAddress" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "notes" TEXT,
    "coTenants" JSONB,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Provider table
CREATE TABLE IF NOT EXISTS "Provider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT,
    "specialization" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2),
    "availableHours" TEXT,
    "serviceArea" TEXT,
    "rating" DECIMAL(3,2),
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- Issue table
CREATE TABLE IF NOT EXISTS "Issue" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL DEFAULT 'MAINTENANCE',
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "images" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_currentTenantId_fkey" FOREIGN KEY ("currentTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Owner_userId_key" ON "Owner"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_userId_key" ON "Tenant"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Provider_userId_key" ON "Provider"("userId");

-- Insert test data
INSERT INTO "Owner" ("id", "userId", "companyName", "createdAt", "updatedAt") 
VALUES ('test-owner-1', (SELECT id FROM "User" WHERE email = 'admin@molino.com'), 'Molino Rentals', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "Property" ("id", "ownerId", "title", "address", "type", "bedrooms", "bathrooms", "monthlyRent", "capacity", "createdAt", "updatedAt")
VALUES ('test-property-1', 'test-owner-1', 'Test Apartment', 'Madrid, Spain', 'RESIDENTIAL', 2, 1, 1200.00, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "Tenant" ("id", "userId", "occupation", "monthlyIncome", "createdAt", "updatedAt")
VALUES ('test-tenant-1', (SELECT id FROM "User" WHERE email = 'admin@molino.com'), 'Software Developer', 3000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "Provider" ("id", "userId", "specialization", "hourlyRate", "createdAt", "updatedAt")
VALUES ('test-provider-1', (SELECT id FROM "User" WHERE email = 'admin@molino.com'), 'PLUMBING', 45.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("userId") DO NOTHING;