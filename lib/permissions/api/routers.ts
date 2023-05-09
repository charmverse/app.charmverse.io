import type { PermissionsClient } from '@charmverse/core';
import { PermissionsApiClient, prisma } from '@charmverse/core';
import type { Space } from '@charmverse/core/prisma';
import { stringUtils, InvalidInputError, PostCategoryNotFoundError, PostNotFoundError } from '@charmverse/core/shared';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';
import { SpaceNotFoundError } from 'lib/public-api';

import type { Resource } from '../interfaces';

import { PublicPermissionsClient } from './client';

export const publicClient = new PublicPermissionsClient();
export const premiumPermissionsApiClient = new PermissionsApiClient({
  authKey: permissionsApiAuthKey,
  baseUrl: permissionsApiUrl
});

export type PermissionsEngine = 'public' | 'private';

function getEngine(input: Pick<Space, 'paidTier'>) {
  if (input.paidTier === 'pro' || input.paidTier === 'enterprise') {
    return 'private';
  }
  return 'public';
}

export async function isPostSpaceOptedIn({ resourceId }: Resource): Promise<PermissionsEngine> {
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

export async function isPostCategorySpaceOptedIn({ resourceId }: Resource): Promise<PermissionsEngine> {
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

export async function isSpaceOptedIn({ resourceId }: Resource): Promise<PermissionsEngine> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid resourceId: ${resourceId}`);
  }
  const space = await prisma.space.findUnique({
    where: {
      id: resourceId
    },
    select: {
      paidTier: true
    }
  });

  if (!space) {
    throw new SpaceNotFoundError(resourceId);
  }

  return getEngine(space);
}

export async function isPostCategoryPermissionSpaceOptedIn({ resourceId }: Resource): Promise<PermissionsEngine> {
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

export type ResourceIdEntity = 'space' | 'post' | 'postCategory' | 'postCategoryPermission';

export type GetPermissionClient = {
  resourceId: string;
  resourceIdType: ResourceIdEntity;
};

export async function checkSpacePermissionsEngine({
  resourceId,
  resourceIdType
}: GetPermissionClient): Promise<PermissionsEngine> {
  const engineResolver =
    !resourceIdType || resourceIdType === 'space'
      ? isSpaceOptedIn
      : resourceIdType === 'postCategory'
      ? isPostCategorySpaceOptedIn
      : resourceIdType === 'postCategoryPermission'
      ? isPostCategoryPermissionSpaceOptedIn
      : resourceIdType === 'post'
      ? isPostSpaceOptedIn
      : null;

  if (!engineResolver) {
    throw new InvalidInputError(`Invalid resolver provided`);
  }

  const engine = await engineResolver({ resourceId });

  return engine;
}

/**
 * Get correct permissions client for a specific space, even if we have a resourceId for another app
 * */
export async function getPermissionsClient({
  resourceId,
  resourceIdType = 'space'
}: GetPermissionClient): Promise<PermissionsClient> {
  const engine = await checkSpacePermissionsEngine({
    resourceId,
    resourceIdType
  });

  if (engine === 'private') {
    return premiumPermissionsApiClient;
  } else {
    return publicClient;
  }
}
