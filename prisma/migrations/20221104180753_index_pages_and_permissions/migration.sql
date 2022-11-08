-- CreateIndex
CREATE INDEX "Block_spaceId_idx" ON "Block"("spaceId");

-- CreateIndex
CREATE INDEX "Block_rootId_idx" ON "Block"("rootId");

-- CreateIndex
CREATE INDEX "Page_title_idx" ON "Page"("title");

-- CreateIndex
CREATE INDEX "Page_spaceId_idx" ON "Page"("spaceId");

-- CreateIndex
CREATE INDEX "Page_createdBy_idx" ON "Page"("createdBy");

-- CreateIndex
CREATE INDEX "Page_parentId_idx" ON "Page"("parentId");

-- CreateIndex
CREATE INDEX "Page_proposalId_idx" ON "Page"("proposalId");

-- CreateIndex
CREATE INDEX "Page_cardId_idx" ON "Page"("cardId");

-- CreateIndex
CREATE INDEX "Page_bountyId_idx" ON "Page"("bountyId");

-- CreateIndex
CREATE INDEX "PagePermission_userId_idx" ON "PagePermission"("userId");

-- CreateIndex
CREATE INDEX "PagePermission_roleId_idx" ON "PagePermission"("roleId");

-- CreateIndex
CREATE INDEX "PagePermission_spaceId_idx" ON "PagePermission"("spaceId");

-- CreateIndex
CREATE INDEX "PagePermission_pageId_idx" ON "PagePermission"("pageId");
