-- AlterTable
ALTER TABLE "SpaceRole" ADD COLUMN     "tokenGateConnectedDate" TIMESTAMP(3),
ADD COLUMN     "tokenGateId" UUID;

-- CreateTable
CREATE TABLE "TokenGate" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID NOT NULL,
    "spaceId" UUID NOT NULL,
    "conditions" JSONB NOT NULL,
    "resourceId" JSONB NOT NULL,

    CONSTRAINT "TokenGate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpaceRole" ADD CONSTRAINT "SpaceRole_tokenGateId_fkey" FOREIGN KEY ("tokenGateId") REFERENCES "TokenGate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenGate" ADD CONSTRAINT "TokenGate_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
