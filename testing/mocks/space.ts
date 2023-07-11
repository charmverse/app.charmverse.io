import type { Space } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

export const createMockSpace = (space?: Partial<Space>): Space => {
  const newUserId = uuid();
  return {
    id: uuid(),
    deletedAt: null,
    createdAt: new Date(),
    createdBy: newUserId,
    updatedAt: new Date(),
    updatedBy: newUserId,
    name: 'Test Space',
    domain: 'test-space',
    customDomain: null,
    discordServerId: null,
    defaultVotingDuration: null,
    origin: null,
    paidTier: 'pro',
    snapshotDomain: null,
    spaceImage: null,
    defaultPostCategoryId: null,
    notifyNewProposals: null,
    requireProposalTemplate: null,
    defaultPagePermissionGroup: null,
    defaultPublicPages: null,
    permissionConfigurationMode: null,
    publicBountyBoard: null,
    xpsEngineId: null,
    superApiTokenId: null,
    webhookSubscriptionUrl: null,
    webhookSigningSecret: null,
    publicProposals: null,
    hiddenFeatures: [],
    isCustomDomainVerified: null,
    ...space
  };
};
