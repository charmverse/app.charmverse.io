import {
  PageNotFoundError,
  ProposalCategoryPermissionNotFoundError,
  InvalidInputError,
  PostCategoryNotFoundError,
  PostNotFoundError,
  ProposalNotFoundError,
  ProposalCategoryNotFoundError,
  DataNotFoundError
} from '@charmverse/core/errors';
import { PermissionsApiClient } from '@charmverse/core/permissions';
import type { PermissionsClient, PremiumPermissionsClient } from '@charmverse/core/permissions';
import type { Space, SubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';
import { SpaceNotFoundError } from 'lib/public-api/errors';

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
    tier: input.paidTier ?? 'community'
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
    throw new ProposalCategoryPermissionNotFoundError(resourceId);
  }

  return getEngine(proposalCategoryPermission.proposalCategory.space);
}

export async function isPageSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const page = await prisma.page.findUnique({
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

  if (!page) {
    throw new PageNotFoundError(resourceId);
  }

  return getEngine(page.space);
}
export async function isPagePermissionSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const pagePermission = await prisma.pagePermission.findUnique({
    where: {
      id: resourceId
    },
    select: {
      page: {
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

  if (!pagePermission) {
    throw new ProposalCategoryPermissionNotFoundError(resourceId);
  }

  return getEngine(pagePermission.page.space);
}

export async function isBountySpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const bounty = await prisma.bounty.findUnique({
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

  if (!bounty) {
    throw new DataNotFoundError(resourceId);
  }

  return getEngine(bounty.space);
}

export async function isVoteSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const vote = await prisma.vote.findUnique({
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

  if (!vote) {
    throw new DataNotFoundError(resourceId);
  }

  return getEngine(vote.space);
}

export async function isRoleSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const role = await prisma.role.findUnique({
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

  if (!role) {
    throw new DataNotFoundError(`Role with id ${resourceId} not found`);
  }

  return getEngine(role.space);
}

export type ResourceIdEntity =
  | 'space'
  | 'post'
  | 'postCategory'
  | 'postCategoryPermission'
  | 'proposal'
  | 'proposalCategory'
  | 'proposalCategoryPermission'
  | 'page'
  | 'pagePermission'
  | 'bounty'
  | 'vote'
  | 'role';
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
      : resourceIdType === 'page'
      ? isPageSpaceOptedIn
      : resourceIdType === 'pagePermission'
      ? isPagePermissionSpaceOptedIn
      : resourceIdType === 'bounty'
      ? isBountySpaceOptedIn
      : resourceIdType === 'vote'
      ? isVoteSpaceOptedIn
      : resourceIdType === 'role'
      ? isRoleSpaceOptedIn
      : null;

  if (!engineResolver) {
    throw new InvalidInputError(`Invalid resolver provided`);
  }

  const engine = await engineResolver({ resourceId });

  return engine;
}
export type SpacePermissionsClient = {
  type: PermissionsEngine;
  client: PermissionsClient | PremiumPermissionsClient;
  spaceId: string;
};

/**
 * Get correct permissions client for a specific space, return premium client if space is paid subscriber
 * */
export async function getPermissionsClient({
  resourceId,
  resourceIdType = 'space'
}: GetPermissionClient): Promise<SpacePermissionsClient> {
  const spaceInfo = await checkSpaceSpaceSubscriptionInfo({
    resourceId,
    resourceIdType
  });

  if (spaceInfo.tier !== 'free') {
    return { type: 'premium', client: premiumPermissionsApiClient, spaceId: spaceInfo.spaceId };
  } else {
    return { type: 'free', client: publicClient, spaceId: spaceInfo.spaceId };
  }
}
