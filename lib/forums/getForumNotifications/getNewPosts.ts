import type { Post, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';

import type { UnpopulatedForumTask } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';

export async function getNewPosts({
  userId,
  posts,
  spacesRecord
}: {
  userId: string;
  posts: Post[];
  spacesRecord: Record<string, { name: string; domain: string }>;
}): Promise<UnpopulatedForumTask[]> {
  const postsFromOthers = posts.filter((post) => post.createdBy !== userId);

  return postsFromOthers.map((post) => ({
    ...getPropertiesFromPost(post, spacesRecord[post.spaceId]),
    createdAt: post.createdAt.toISOString(),
    commentId: null,
    mentionId: null,
    commentText: '',
    userId: post.createdBy
  }));
}
