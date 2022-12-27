-- CreateTable
CREATE TABLE "WorkspaceOnboard" (
    "userId" UUID NOT NULL,
    "spaceRoleId" UUID NOT NULL,
    "onboarded" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceOnboard_userId_spaceRoleId_key" ON "WorkspaceOnboard"("userId", "spaceRoleId");

-- AddForeignKey
ALTER TABLE "WorkspaceOnboard" ADD CONSTRAINT "WorkspaceOnboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceOnboard" ADD CONSTRAINT "WorkspaceOnboard_spaceRoleId_fkey" FOREIGN KEY ("spaceRoleId") REFERENCES "SpaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
