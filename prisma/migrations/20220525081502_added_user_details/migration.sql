-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "isPublic" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserDetails" (
    "id" UUID NOT NULL,
    "description" TEXT,
    "social" JSONB,

    CONSTRAINT "UserDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
