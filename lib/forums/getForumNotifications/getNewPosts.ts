import type { Post } from '@prisma/client';

import type { ClientUserSpaceNotifications } from 'lib/userNotifications/spaceNotifications';

import type { UnpopulatedForumTask } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';

export function getNewPosts({
  userId,
  posts,
  space,
  settings
}: {
  userId: string;
  posts: Post[];
  space: { name: string; domain: string };
  settings: ClientUserSpaceNotifications;
}): UnpopulatedForumTask[] {
  const subscriptions = settings.forums.categories;
  const postsFromOthers = posts.filter((post) => post.createdBy !== userId && subscriptions[post.categoryId]);

  return postsFromOthers.map((post) => ({
    ...getPropertiesFromPost(post, space),
    createdAt: post.createdAt.toISOString(),
    commentId: null,
    mentionId: null,
    commentText: '',
    userId: post.createdBy,
    taskId: post.id,
    taskType: 'forum_post'
  }));
}
