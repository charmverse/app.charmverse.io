import type { PermissionsClient } from '@charmverse/core';
import { PermissionsApiClient, prisma } from '@charmverse/core';
import {
  stringUtils,
  InvalidInputError,
  PostCategoryNotFoundError,
  PostNotFoundError
} from '@charmverse/core/dist/shared';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';
import { SpaceNotFoundError } from 'lib/public-api';

import type { Resource } from '../interfaces';

import { PublicPermissionsClient } from './client';

const publicClient = new PublicPermissionsClient();
const apiClient = new PermissionsApiClient({
  authKey: permissionsApiAuthKey,
  baseUrl: permissionsApiUrl
});

export type PermissionsEngine = 'public' | 'private';

export async function isPostSpaceOptedIn({ resourceId }: Resource): Promise<PermissionsEngine> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError('Invalid resourceId');
  }
  const post = await prisma.post.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: {
        select: {
          premiumOptin: true
        }
      }
    }
  });

  if (!post) {
    throw new PostNotFoundError(resourceId);
  }

  return post.space.premiumOptin === true ? 'private' : 'public';
}

export async function isPostCategorySpaceOptedIn({ resourceId }: Resource): Promise<PermissionsEngine> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError('Invalid resourceId');
  }
  const postCategory = await prisma.postCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      space: {
        select: {
          premiumOptin: true
        }
      }
    }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  return postCategory.space.premiumOptin === true ? 'private' : 'public';
}

export async function isSpaceOptedIn({ resourceId }: Resource): Promise<PermissionsEngine> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError('Invalid resourceId');
  }
  const space = await prisma.space.findUnique({
    where: {
      id: resourceId
    },
    select: {
      premiumOptin: true
    }
  });

  if (!space) {
    throw new SpaceNotFoundError(resourceId);
  }

  return space.premiumOptin === true ? 'private' : 'public';
}
type GetPermissionClient = {
  resourceId: string;
  resourceIdType?: 'space' | 'post' | 'postCategory';
};
/**
 * Get correct permissions client for a specific space, even if we have a resourceId for another app
 * */
export async function getPermissionsClient({
  resourceId,
  resourceIdType = 'space'
}: GetPermissionClient): Promise<PermissionsClient> {
  const engineResolver =
    !resourceIdType || resourceIdType === 'space'
      ? isSpaceOptedIn
      : resourceIdType === 'postCategory'
      ? isPostCategorySpaceOptedIn
      : resourceIdType === 'post'
      ? isPostSpaceOptedIn
      : null;

  if (!engineResolver) {
    throw new InvalidInputError(`Invalid resolver provided`);
  }

  const engine = await engineResolver({ resourceId });

  if (engine === 'private') {
    return apiClient;
  } else {
    return publicClient;
  }
}
