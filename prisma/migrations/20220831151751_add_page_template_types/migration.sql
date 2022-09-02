-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PageType" ADD VALUE 'board_template';
ALTER TYPE "PageType" ADD VALUE 'bounty_template';
ALTER TYPE "PageType" ADD VALUE 'page_template';
ALTER TYPE "PageType" ADD VALUE 'card_template';
ALTER TYPE "PageType" ADD VALUE 'proposal_template';

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "isTemplate" BOOLEAN DEFAULT false;
