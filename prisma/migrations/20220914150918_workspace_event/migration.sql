-- CreateEnum
CREATE TYPE "WorkspaceEventType" AS ENUM ('proposal_status_change');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'proposal';

-- CreateTable
CREATE TABLE "WorkspaceEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "type" "WorkspaceEventType" NOT NULL,
    "meta" JSONB,
    "spaceId" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkspaceEvent" ADD CONSTRAINT "WorkspaceEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceEvent" ADD CONSTRAINT "WorkspaceEvent_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceEvent" ADD CONSTRAINT "WorkspaceEvent_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
