-- CreateTable
CREATE TABLE "InviteLinkToRole" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviteLinkId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "InviteLinkToRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteLinkToRole_inviteLinkId_roleId_key" ON "InviteLinkToRole"("inviteLinkId", "roleId");

-- AddForeignKey
ALTER TABLE "InviteLinkToRole" ADD CONSTRAINT "InviteLinkToRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLinkToRole" ADD CONSTRAINT "InviteLinkToRole_inviteLinkId_fkey" FOREIGN KEY ("inviteLinkId") REFERENCES "InviteLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
