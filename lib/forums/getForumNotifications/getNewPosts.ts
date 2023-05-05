import type { Post } from '@charmverse/core/prisma';

import type { ClientUserSpaceNotifications } from 'lib/userNotifications/spaceNotifications';

import type { UnpopulatedForumTask } from './getForumNotifications';
import { getPropertiesFromPost } from './utils';

// Prevent sending notifications from before we added this feature. TODO: Create notification records so we can remove this hack
const featureStartDate = new Date(2023, 2, 9);

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
  const postsFromOthers = posts
    .filter((post) => post.createdBy !== userId && subscriptions[post.categoryId])
    .filter((post) => post.createdAt > featureStartDate);

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
