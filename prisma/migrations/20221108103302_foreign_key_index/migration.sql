-- CreateIndex
CREATE INDEX "Application_createdBy_idx" ON "Application"("createdBy");

-- CreateIndex
CREATE INDEX "Application_bountyId_idx" ON "Application"("bountyId");

-- CreateIndex
CREATE INDEX "Block_createdBy_idx" ON "Block"("createdBy");

-- CreateIndex
CREATE INDEX "Bounty_createdBy_idx" ON "Bounty"("createdBy");

-- CreateIndex
CREATE INDEX "Bounty_spaceId_idx" ON "Bounty"("spaceId");

-- CreateIndex
CREATE INDEX "BountyPermission_bountyId_idx" ON "BountyPermission"("bountyId");

-- CreateIndex
CREATE INDEX "BountyPermission_spaceId_idx" ON "BountyPermission"("spaceId");

-- CreateIndex
CREATE INDEX "BountyPermission_roleId_idx" ON "BountyPermission"("roleId");

-- CreateIndex
CREATE INDEX "BountyPermission_userId_idx" ON "BountyPermission"("userId");

-- CreateIndex
CREATE INDEX "Comment_pageId_idx" ON "Comment"("pageId");

-- CreateIndex
CREATE INDEX "Comment_spaceId_idx" ON "Comment"("spaceId");

-- CreateIndex
CREATE INDEX "Comment_threadId_idx" ON "Comment"("threadId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "DiscordUser_userId_idx" ON "DiscordUser"("userId");

-- CreateIndex
CREATE INDEX "FavoritePage_userId_idx" ON "FavoritePage"("userId");

-- CreateIndex
CREATE INDEX "FavoritePage_pageId_idx" ON "FavoritePage"("pageId");

-- CreateIndex
CREATE INDEX "InviteLink_createdBy_idx" ON "InviteLink"("createdBy");

-- CreateIndex
CREATE INDEX "InviteLink_spaceId_idx" ON "InviteLink"("spaceId");

-- CreateIndex
CREATE INDEX "InviteLinkToRole_roleId_idx" ON "InviteLinkToRole"("roleId");

-- CreateIndex
CREATE INDEX "InviteLinkToRole_inviteLinkId_idx" ON "InviteLinkToRole"("inviteLinkId");

-- CreateIndex
CREATE INDEX "MemberProperty_spaceId_idx" ON "MemberProperty"("spaceId");

-- CreateIndex
CREATE INDEX "MemberPropertyPermission_memberPropertyId_idx" ON "MemberPropertyPermission"("memberPropertyId");

-- CreateIndex
CREATE INDEX "MemberPropertyPermission_roleId_idx" ON "MemberPropertyPermission"("roleId");

-- CreateIndex
CREATE INDEX "MemberPropertyValue_memberPropertyId_idx" ON "MemberPropertyValue"("memberPropertyId");

-- CreateIndex
CREATE INDEX "MemberPropertyValue_spaceId_idx" ON "MemberPropertyValue"("spaceId");

-- CreateIndex
CREATE INDEX "MemberPropertyValue_userId_idx" ON "MemberPropertyValue"("userId");

-- CreateIndex
CREATE INDEX "PaymentMethod_spaceId_idx" ON "PaymentMethod"("spaceId");

-- CreateIndex
CREATE INDEX "Poap_userId_idx" ON "Poap"("userId");

-- CreateIndex
CREATE INDEX "ProfileItem_userId_idx" ON "ProfileItem"("userId");

-- CreateIndex
CREATE INDEX "Proposal_spaceId_idx" ON "Proposal"("spaceId");

-- CreateIndex
CREATE INDEX "Proposal_reviewedBy_idx" ON "Proposal"("reviewedBy");

-- CreateIndex
CREATE INDEX "Proposal_categoryId_idx" ON "Proposal"("categoryId");

-- CreateIndex
CREATE INDEX "ProposalAuthor_proposalId_idx" ON "ProposalAuthor"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalAuthor_userId_idx" ON "ProposalAuthor"("userId");

-- CreateIndex
CREATE INDEX "ProposalCategory_spaceId_idx" ON "ProposalCategory"("spaceId");

-- CreateIndex
CREATE INDEX "ProposalReviewer_proposalId_idx" ON "ProposalReviewer"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalReviewer_roleId_idx" ON "ProposalReviewer"("roleId");

-- CreateIndex
CREATE INDEX "ProposalReviewer_userId_idx" ON "ProposalReviewer"("userId");

-- CreateIndex
CREATE INDEX "Role_spaceId_idx" ON "Role"("spaceId");

-- CreateIndex
CREATE INDEX "Space_createdBy_idx" ON "Space"("createdBy");

-- CreateIndex
CREATE INDEX "SpaceApiToken_spaceId_idx" ON "SpaceApiToken"("spaceId");

-- CreateIndex
CREATE INDEX "SpacePermission_roleId_idx" ON "SpacePermission"("roleId");

-- CreateIndex
CREATE INDEX "SpacePermission_userId_idx" ON "SpacePermission"("userId");

-- CreateIndex
CREATE INDEX "SpacePermission_forSpaceId_idx" ON "SpacePermission"("forSpaceId");

-- CreateIndex
CREATE INDEX "SpacePermission_spaceId_idx" ON "SpacePermission"("spaceId");

-- CreateIndex
CREATE INDEX "SpaceRole_spaceId_idx" ON "SpaceRole"("spaceId");

-- CreateIndex
CREATE INDEX "SpaceRole_userId_idx" ON "SpaceRole"("userId");

-- CreateIndex
CREATE INDEX "SpaceRoleToRole_spaceRoleId_idx" ON "SpaceRoleToRole"("spaceRoleId");

-- CreateIndex
CREATE INDEX "SpaceRoleToRole_roleId_idx" ON "SpaceRoleToRole"("roleId");

-- CreateIndex
CREATE INDEX "TelegramUser_userId_idx" ON "TelegramUser"("userId");

-- CreateIndex
CREATE INDEX "Thread_pageId_idx" ON "Thread"("pageId");

-- CreateIndex
CREATE INDEX "Thread_spaceId_idx" ON "Thread"("spaceId");

-- CreateIndex
CREATE INDEX "Thread_userId_idx" ON "Thread"("userId");

-- CreateIndex
CREATE INDEX "TokenGate_spaceId_idx" ON "TokenGate"("spaceId");

-- CreateIndex
CREATE INDEX "TokenGateToRole_tokenGateId_idx" ON "TokenGateToRole"("tokenGateId");

-- CreateIndex
CREATE INDEX "TokenGateToRole_roleId_idx" ON "TokenGateToRole"("roleId");

-- CreateIndex
CREATE INDEX "Transaction_applicationId_idx" ON "Transaction"("applicationId");

-- CreateIndex
CREATE INDEX "UserGnosisSafe_userId_idx" ON "UserGnosisSafe"("userId");

-- CreateIndex
CREATE INDEX "UserNotification_userId_idx" ON "UserNotification"("userId");

-- CreateIndex
CREATE INDEX "UserNotificationState_userId_idx" ON "UserNotificationState"("userId");

-- CreateIndex
CREATE INDEX "UserVote_voteId_idx" ON "UserVote"("voteId");

-- CreateIndex
CREATE INDEX "UserVote_userId_idx" ON "UserVote"("userId");

-- CreateIndex
CREATE INDEX "UserWallet_userId_idx" ON "UserWallet"("userId");

-- CreateIndex
CREATE INDEX "Vote_createdBy_idx" ON "Vote"("createdBy");

-- CreateIndex
CREATE INDEX "Vote_pageId_idx" ON "Vote"("pageId");

-- CreateIndex
CREATE INDEX "Vote_spaceId_idx" ON "Vote"("spaceId");

-- CreateIndex
CREATE INDEX "VoteOptions_voteId_idx" ON "VoteOptions"("voteId");

-- CreateIndex
CREATE INDEX "WorkspaceEvent_actorId_idx" ON "WorkspaceEvent"("actorId");

-- CreateIndex
CREATE INDEX "WorkspaceEvent_spaceId_idx" ON "WorkspaceEvent"("spaceId");

-- CreateIndex
CREATE INDEX "WorkspaceEvent_pageId_idx" ON "WorkspaceEvent"("pageId");
