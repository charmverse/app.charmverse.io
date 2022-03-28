-- AddForeignKey
ALTER TABLE "SpaceRoleToRole" ADD CONSTRAINT "SpaceRoleToRole_spaceRoleId_fkey" FOREIGN KEY ("spaceRoleId") REFERENCES "SpaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
