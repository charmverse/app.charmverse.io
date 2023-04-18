-- CreateEnum
CREATE TYPE "FontFamily" AS ENUM ('default', 'serif', 'mono');

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "fontFamily" "FontFamily" DEFAULT 'default',
ADD COLUMN     "fontSizeSmall" BOOLEAN DEFAULT false;
