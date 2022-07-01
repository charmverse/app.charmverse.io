-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "acceptedBy" UUID,
ADD COLUMN     "reviewedBy" UUID;
