-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "social" JSONB NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
