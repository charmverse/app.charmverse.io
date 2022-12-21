-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "locked" BOOLEAN DEFAULT false,
ADD COLUMN     "pinned" BOOLEAN DEFAULT false;
