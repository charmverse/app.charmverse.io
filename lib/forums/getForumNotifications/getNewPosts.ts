import type { Post } from '@prisma/client';

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
    userId: post.createdBy,
    taskId: post.id,
    taskType: 'forum_post'
  }));
}
