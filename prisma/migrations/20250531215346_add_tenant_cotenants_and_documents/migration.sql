-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "documents" TEXT[],
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mainTenantId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "profilePhoto" TEXT;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_mainTenantId_fkey" FOREIGN KEY ("mainTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
