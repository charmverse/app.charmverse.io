-- CreateTable
CREATE TABLE "WorkspaceEvent" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "type" TEXT NOT NULL,
    "meta" JSONB,
    "spaceId" UUID NOT NULL,
    "pageId" UUID,

    CONSTRAINT "WorkspaceEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkspaceEvent" ADD CONSTRAINT "WorkspaceEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceEvent" ADD CONSTRAINT "WorkspaceEvent_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceEvent" ADD CONSTRAINT "WorkspaceEvent_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
