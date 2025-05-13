import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpaceByDomainWhere } from '@packages/spaces/getSpaceByDomain';
import { InvalidInputError } from '@packages/utils/errors';
import { isUUID } from '@packages/utils/strings';

import { PostNotFoundError } from './errors';
import { getPostVoteSummary } from './getPostMeta';
import type { PostWithVotes } from './interfaces';

export type GetForumPostRequest = { postId: string; userId?: string; spaceDomain?: string };

/**
 * Provide the user ID to calculate if a requesting user has upvoted this post
 */
export async function getForumPost({ postId, userId, spaceDomain }: GetForumPostRequest): Promise<PostWithVotes> {
  const query: Prisma.PostWhereInput = {};

  if (isUUID(postId)) {
    query.id = postId;
  } else if (postId && spaceDomain) {
    query.path = postId;
    query.space = getSpaceByDomainWhere(spaceDomain);
  } else {
    throw new InvalidInputError('Please provide a valid UUID or a post path and spaceId');
  }

  const post = await prisma.post.findFirst({
    where: query,
    include: {
      upDownVotes: {
        select: {
          upvoted: true,
          createdBy: true
        }
      }
    }
  });

  if (!post) {
    throw new PostNotFoundError(postId);
  }

  const { upDownVotes, ...postWithoutVotes } = post;

  return {
    ...postWithoutVotes,
    votes: getPostVoteSummary(upDownVotes, userId)
  };
}
