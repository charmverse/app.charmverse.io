-- CreateIndex
CREATE INDEX "GoogleAccount_email_idx" ON "GoogleAccount"("email");

-- CreateIndex
CREATE INDEX "GoogleAccount_userId_idx" ON "GoogleAccount"("userId");

-- CreateIndex
CREATE INDEX "Post_categoryId_idx" ON "Post"("categoryId");

-- CreateIndex
CREATE INDEX "Post_path_idx" ON "Post"("path");

-- CreateIndex
CREATE INDEX "Post_spaceId_deletedAt_idx" ON "Post"("spaceId", "deletedAt");

-- CreateIndex
CREATE INDEX "Post_spaceId_deletedAt_categoryId_idx" ON "Post"("spaceId", "deletedAt", "categoryId");

-- CreateIndex
CREATE INDEX "Post_spaceId_deletedAt_categoryId_title_contentText_idx" ON "Post"("spaceId", "deletedAt", "categoryId", "title", "contentText");

-- CreateIndex
CREATE INDEX "UnstoppableDomain_domain_idx" ON "UnstoppableDomain"("domain");

-- CreateIndex
CREATE INDEX "UnstoppableDomain_userId_idx" ON "UnstoppableDomain"("userId");
