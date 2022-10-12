-- AlterTable
ALTER TABLE "TokenGate" ADD COLUMN     "accessTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
