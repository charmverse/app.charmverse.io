-- CreateTable
CREATE TABLE "WorkspaceOnboarding" (
    "userId" UUID NOT NULL,
    "spaceRoleId" UUID NOT NULL,
    "onboarded" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceOnboarding_userId_spaceRoleId_key" ON "WorkspaceOnboarding"("userId", "spaceRoleId");

-- AddForeignKey
ALTER TABLE "WorkspaceOnboarding" ADD CONSTRAINT "WorkspaceOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceOnboarding" ADD CONSTRAINT "WorkspaceOnboarding_spaceRoleId_fkey" FOREIGN KEY ("spaceRoleId") REFERENCES "SpaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
