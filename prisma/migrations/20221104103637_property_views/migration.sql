-- CreateEnum
CREATE TYPE "VisibilityView" AS ENUM ('gallery', 'table', 'profile');

-- AlterTable
ALTER TABLE "MemberProperty" ADD COLUMN     "enabledViews" "VisibilityView"[] DEFAULT ARRAY['gallery', 'table', 'profile']::"VisibilityView"[];
