-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "galleryImage" TEXT,
ADD COLUMN     "hasContent" BOOLEAN NOT NULL DEFAULT false;
