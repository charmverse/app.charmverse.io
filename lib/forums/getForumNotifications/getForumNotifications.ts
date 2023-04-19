import { prisma } from '@charmverse/core';
import type { Post, PostCategory, PostComment, Space, User } from '@prisma/client';

import type { TaskUser } from 'lib/discussion/interfaces';
import { getPostCategories } from 'lib/forums/categories/getPostCategories';
import { checkSpacePermissionsEngine, premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { getUserSpaceNotifications } from 'lib/userNotifications/spaceNotifications';
import { timeAgo } from 'lib/utilities/dates';
import { isTruthy } from 'lib/utilities/types';

import { getNewPosts } from './getNewPosts';
import { getPostCommentMentions } from './getPostCommentMentions';
import { getPostComments } from './getPostComments';
import { getPostMentions } from './getPostMentions';

export type ForumTask = {
  taskId: string;
  taskType: 'forum_post' | 'post_mention' | 'post_comment' | 'post_comment_mention';
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  postId: string;
  postPath: string;
  postTitle: string;
  createdAt: string;
  commentId: string | null;
  mentionId: string | null;
  commentText: string;
  createdBy: TaskUser | null;
};

export type ForumTasksGroup = {
  marked: ForumTask[];
  unmarked: ForumTask[];
};

type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

export type ForumNotificationsContext = {
  userId: string;
  spacesRecord: SpaceRecord;
  username: string;
  posts: (Post & {
    comments: Pick<PostComment, 'id' | 'createdAt' | 'createdBy' | 'content' | 'contentText' | 'parentId' | 'postId'>[];
  })[];
};

export type UnpopulatedForumTask = Omit<ForumTask, 'createdBy'> & { taskId: string; userId: string };

export type ForumNotifications = {
  mentions: UnpopulatedForumTask[];
  discussionUserIds: string[];
  comments: UnpopulatedForumTask[];
};

const lookback = timeAgo({ months: 1 });

export async function getForumNotifications(userId: string): Promise<ForumTasksGroup> {
  // Get the user's spaces, posts and comments from those spaces. TODO: we should only get comments created by the user first
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    include: {
      space: {
        select: {
          id: true,
          name: true,
          domain: true
        }
      }
    }
  });

  let posts: ForumNotificationsContext['posts'] = [];

  let newPosts: UnpopulatedForumTask[] = [];

  for (const spaceRole of spaceRoles) {
    const postCategories = await getPostCategories(spaceRole.space.id);
    const spaceNotifications = await getUserSpaceNotifications({ spaceId: spaceRole.space.id, userId });

    const shouldFilter = await checkSpacePermissionsEngine({
      resourceId: spaceRole.spaceId,
      resourceIdType: 'space'
    });

    const visiblePostCategories: PostCategory[] = shouldFilter
      ? await premiumPermissionsApiClient.forum.filterAccessiblePostCategories({
          postCategories,
          userId
        })
      : postCategories;

    const _posts = await prisma.post.findMany({
      where: {
        isDraft: false,
        deletedAt: null,
        // only get posts created after a user has joined the space
        createdAt: {
          gt: spaceRole.createdAt
        },
        categoryId: {
          in: visiblePostCategories.map((category) => category.id)
        }
      },
      include: {
        category: true,
        comments: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            createdBy: true,
            content: true,
            parentId: true,
            postId: true,
            contentText: true,
            createdAt: true
          }
        }
      }
    });

    const _newPosts = getNewPosts({ userId, posts: _posts, space: spaceRole.space, settings: spaceNotifications });

    newPosts = [...newPosts, ..._newPosts];

    posts = [...posts, ..._posts];
  }

  // Get the username of the user, its required when constructing the mention message text
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      username: true
    }
  });

  const username = user.username;

  const spaces = spaceRoles.map(({ space }) => space);

  const spacesRecord = spaces.reduce<SpaceRecord>((acc, space) => {
    return {
      ...acc,
      [space.id]: space
    };
  }, {});

  const notifications = await prisma.userNotification.findMany({
    where: {
      // not sure what lookback should be on notifications - maybe instead we should query by taskId
      // createdAt: {
      //   gte: lookback
      // },
      userId,
      type: {
        // TODO: we only need to look for forum tasks once we pass the lookback, added Mar 3, 2023
        in: ['post_comment', 'mention', 'forum']
      }
    },
    select: {
      taskId: true
    }
  });

  // Get the marked comment/mention task ids (all the discussion type tasks that exist in the db)
  const notifiedTaskIds = new Set(notifications.map((notification) => notification.taskId));

  const context: ForumNotificationsContext = { userId, username, spacesRecord, posts };

  // aggregate the results
  const { mentions, discussionUserIds, comments } = [
    getPostComments(context),
    getPostMentions(context),
    getPostCommentMentions(context)
  ].reduce(
    (acc, result) => {
      return {
        mentions: acc.mentions.concat(result.mentions),
        discussionUserIds: acc.discussionUserIds.concat(result.discussionUserIds),
        comments: acc.comments.concat(result.comments)
      };
    },
    { mentions: [], discussionUserIds: [], comments: [] }
  );

  const commentIdsFromMentions = Object.values(mentions)
    .map((item) => item.commentId)
    .filter(isTruthy);

  // Filter already added comments from mentions
  const uniqueComments = comments.filter((item) => item.commentId && !commentIdsFromMentions.includes(item.commentId));

  // Only fetch the users that created the mentions
  const newPostsUserIds = newPosts.map((item) => item.userId);
  const userIds = [...new Set([...discussionUserIds, ...newPostsUserIds])];
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    }
  });

  // Create a record for the user
  const usersRecord = users.reduce<Record<string, User>>((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

  // Loop through each mentioned task and attach the user data using usersRecord
  const forumTasks = mentions.concat(uniqueComments, newPosts).reduce<ForumTasksGroup>(
    (acc, mentionedTaskWithoutUser) => {
      const mentionedTask = {
        ...mentionedTaskWithoutUser,
        createdBy: usersRecord[mentionedTaskWithoutUser.userId]
      } as ForumTask;

      const taskList = notifiedTaskIds.has(mentionedTask.taskId) ? acc.marked : acc.unmarked;
      taskList.push(mentionedTask);

      return acc;
    },
    { marked: [], unmarked: [] }
  );

  return {
    marked: forumTasks.marked.sort(sortByDate),
    unmarked: forumTasks.unmarked.sort(sortByDate)
  };
}

// utils

function sortByDate<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
