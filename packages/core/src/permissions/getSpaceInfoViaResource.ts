import type { Space, SubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import {
  DataNotFoundError,
  InvalidInputError,
  PageNotFoundError,
  PostCategoryNotFoundError,
  PostNotFoundError,
  ProposalNotFoundError,
  SpaceNotFoundError
} from '../errors';
import { isUUID } from '../utilities/strings';

import type { Resource } from './core/interfaces';

export type PermissionsEngine = 'free' | 'premium';

type SpaceMetaFields = Pick<Space, 'id' | 'paidTier' | 'domain'>;

function spaceSelect() {
  return {
    select: {
      id: true,
      paidTier: true,
      domain: true
    } as Record<keyof SpaceMetaFields, boolean>
  };
}

export type SpaceSubscriptionInfo = {
  spaceId: string;
  domain: string;
  tier: SubscriptionTier;
  permissionType: PermissionsEngine;
};

function getEngine(input: SpaceMetaFields): SpaceSubscriptionInfo {
  return {
    spaceId: input.id,
    tier: input.paidTier,
    domain: input.domain,
    permissionType: input.paidTier === 'free' ? 'free' : 'premium'
  };
}

async function isPostSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const post = await prisma.post.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: spaceSelect()
    }
  });

  if (!post) {
    throw new PostNotFoundError(resourceId);
  }

  return getEngine(post.space);
}

async function isPostCategorySpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const postCategory = await prisma.postCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: spaceSelect()
    }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  return getEngine(postCategory.space);
}

async function isSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const space = await prisma.space.findUnique({
    where: {
      id: resourceId
    },
    ...spaceSelect()
  });

  if (!space) {
    throw new SpaceNotFoundError(resourceId);
  }

  return getEngine(space);
}

async function isPostCategoryPermissionSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const postCategoryPermission = await prisma.postCategoryPermission.findUnique({
    where: {
      id: resourceId
    },
    select: {
      postCategory: {
        select: {
          space: spaceSelect()
        }
      }
    }
  });

  if (!postCategoryPermission) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  return getEngine(postCategoryPermission.postCategory.space);
}

async function isProposalSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const proposal = await prisma.proposal.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: spaceSelect()
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(resourceId);
  }

  return getEngine(proposal.space);
}

async function isPageSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const page = await prisma.page.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: spaceSelect()
    }
  });

  if (!page) {
    throw new PageNotFoundError(resourceId);
  }

  return getEngine(page.space);
}
async function isPagePermissionSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const pagePermission = await prisma.pagePermission.findUnique({
    where: {
      id: resourceId
    },
    select: {
      page: {
        select: {
          space: spaceSelect()
        }
      }
    }
  });

  if (!pagePermission) {
    throw new DataNotFoundError(`Page permission not found: ${resourceId}`);
  }

  return getEngine(pagePermission.page.space);
}

async function isBountySpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const bounty = await prisma.bounty.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: spaceSelect()
    }
  });

  if (!bounty) {
    throw new DataNotFoundError(resourceId);
  }

  return getEngine(bounty.space);
}

async function isVoteSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const vote = await prisma.vote.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: spaceSelect()
    }
  });

  if (!vote) {
    throw new DataNotFoundError(resourceId);
  }

  return getEngine(vote.space);
}

async function isRoleSpaceOptedIn({ resourceId }: Resource): Promise<SpaceSubscriptionInfo> {
  const role = await prisma.role.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: spaceSelect()
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
  | 'page'
  | 'pagePermission'
  | 'bounty'
  | 'vote'
  | 'role';
export type GetPermissionClient = {
  resourceId: string;
  resourceIdType: ResourceIdEntity;
};

export async function getSpaceInfoViaResource({
  resourceId,
  resourceIdType
}: GetPermissionClient): Promise<SpaceSubscriptionInfo> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
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
