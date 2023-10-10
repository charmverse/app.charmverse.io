import type { Space } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { memberProfileNames } from 'lib/profile/memberProfiles';

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
    notificationToggles: {},
    origin: null,
    paidTier: 'community',
    snapshotDomain: null,
    spaceImage: null,
    defaultPostCategoryId: null,
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
    features: STATIC_PAGES.map((page) => ({ id: page.feature, isHidden: false })),
    memberProfiles: memberProfileNames.map((name) => ({ id: name, isHidden: false })),
    isCustomDomainVerified: null,
    ...space
  } as any;
};
