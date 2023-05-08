import type { PermissionsClient } from '@charmverse/core';
import { PermissionsApiClient, prisma } from '@charmverse/core';
import type { Space, SubscriptionTier } from '@charmverse/core/prisma';
import type { PremiumPermissionsClient } from '@charmverse/core/shared';
import {
  stringUtils,
  InvalidInputError,
  PostCategoryNotFoundError,
  PostNotFoundError,
  ProposalNotFoundError,
  ProposalCategoryNotFoundError
} from '@charmverse/core/shared';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';
import { SpaceNotFoundError } from 'lib/public-api';

import type { Resource } from '../interfaces';

import { PublicPermissionsClient } from './client';

export const publicClient = new PublicPermissionsClient();
export const premiumPermissionsApiClient = new PermissionsApiClient({
  authKey: permissionsApiAuthKey,
  baseUrl: permissionsApiUrl
});

export type PermissionsEngine = 'free' | 'premium';

export type SpaceSubscriptionInfo = {
  spaceId: string;
  tier: SubscriptionTier;
};

function getEngine(input: Pick<Space, 'paidTier' | 'id'>): SpaceSubscriptionInfo {
  return {
    spaceId: input.id,
    tier: input.paidTier ?? 'pro'
  };
}

export async function isPostSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const post = await prisma.post.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: {
        select: {
          id: true,
          paidTier: true
        }
      }
    }
  });

  if (!post) {
    throw new PostNotFoundError(resourceId);
  }

  return getEngine(post.space);
}

export async function isPostCategorySpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const postCategory = await prisma.postCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: {
        select: {
          id: true,
          paidTier: true
        }
      }
    }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  return getEngine(postCategory.space);
}

export async function isSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const space = await prisma.space.findUnique({
    where: {
      id: resourceId
    },
    select: {
      id: true,
      paidTier: true
    }
  });

  if (!space) {
    throw new SpaceNotFoundError(resourceId);
  }

  return getEngine(space);
}

export async function isPostCategoryPermissionSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const postCategoryPermission = await prisma.postCategoryPermission.findUnique({
    where: {
      id: resourceId
    },
    select: {
      postCategory: {
        select: {
          space: {
            select: {
              id: true,
              paidTier: true
            }
          }
        }
      }
    }
  });

  if (!postCategoryPermission) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  return getEngine(postCategoryPermission.postCategory.space);
}

export async function isProposalSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: {
        select: {
          id: true,
          paidTier: true
        }
      }
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(resourceId);
  }

  return getEngine(proposal.space);
}
export async function isProposalCategorySpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const proposalCategory = await prisma.proposalCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: {
        select: {
          id: true,
          paidTier: true
        }
      }
    }
  });

  if (!proposalCategory) {
    throw new ProposalCategoryNotFoundError(resourceId);
  }

  return getEngine(proposalCategory.space);
}

export async function isProposalCategoryPermissionSpaceOptedIn({
  resourceId
}: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const proposalCategoryPermission = await prisma.proposalCategoryPermission.findUnique({
    where: {
      id: resourceId
    },
    select: {
      proposalCategory: {
        select: {
          space: {
            select: {
              id: true,
              paidTier: true
            }
          }
        }
      }
    }
  });

  if (!proposalCategoryPermission) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  return getEngine(proposalCategoryPermission.proposalCategory.space);
}

export type ResourceIdEntity =
  | 'space'
  | 'post'
  | 'postCategory'
  | 'postCategoryPermission'
  | 'proposal'
  | 'proposalCategory'
  | 'proposalCategoryPermission';

export type GetPermissionClient = {
  resourceId: string;
  resourceIdType: ResourceIdEntity;
};

export async function checkSpaceSpaceSubscriptionInfo({
  resourceId,
  resourceIdType
}: GetPermissionClient): Promise<SpaceSubscriptionInfo> {
  const engineResolver =
    !resourceIdType || resourceIdType === 'space'
      ? isSpaceOptedIn
      : resourceIdType === 'postCategory'
      ? isPostCategorySpaceOptedIn
      : resourceIdType === 'postCategoryPermission'
      ? isPostCategoryPermissionSpaceOptedIn
      : resourceIdType === 'post'
      ? isPostSpaceOptedIn
      : resourceIdType === 'proposal'
      ? isProposalSpaceOptedIn
      : resourceIdType === 'proposalCategory'
      ? isProposalCategorySpaceOptedIn
      : resourceIdType === 'proposalCategoryPermission'
      ? isProposalCategoryPermissionSpaceOptedIn
      : null;

  if (!engineResolver) {
    throw new InvalidInputError(`Invalid resolver provided`);
  }

  const engine = await engineResolver({ resourceId });

  return engine;
}

/**
 * Get correct permissions client for a specific space, return premium client if space is paid subscriber
 * */
export async function getPermissionsClient(
  request: GetPermissionClient
): Promise<{ type: 'free' | 'premium'; client: PermissionsClient | PremiumPermissionsClient }>;
export async function getPermissionsClient({
  resourceId,
  resourceIdType = 'space'
}: GetPermissionClient): Promise<{ type: PermissionsEngine; client: PermissionsClient | PremiumPermissionsClient }> {
  const spaceInfo = await checkSpaceSpaceSubscriptionInfo({
    resourceId,
    resourceIdType
  });

  if (spaceInfo.tier !== 'free') {
    return { type: 'premium', client: premiumPermissionsApiClient };
  } else {
    return { type: 'free', client: publicClient };
  }
}
