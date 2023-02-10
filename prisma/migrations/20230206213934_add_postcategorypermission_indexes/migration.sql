-- CreateIndex
CREATE INDEX "PostCategoryPermission_postCategoryId_idx" ON "PostCategoryPermission"("postCategoryId");

-- CreateIndex
CREATE INDEX "PostCategoryPermission_postCategoryId_roleId_idx" ON "PostCategoryPermission"("postCategoryId", "roleId");

-- CreateIndex
CREATE INDEX "PostCategoryPermission_postCategoryId_spaceId_idx" ON "PostCategoryPermission"("postCategoryId", "spaceId");

-- CreateIndex
CREATE INDEX "PostCategoryPermission_postCategoryId_public_idx" ON "PostCategoryPermission"("postCategoryId", "public");
