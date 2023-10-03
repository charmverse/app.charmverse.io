import type { Post, PostComment, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { getPostCategories } from 'lib/forums/categories/getPostCategories';
import type { ForumNotification, NotificationActor } from 'lib/notifications/interfaces';
import { getPermissionsClient } from 'lib/permissions/api/routers';
import { getUserSpaceNotifications } from 'lib/userNotifications/spaceNotifications';
import { isTruthy } from 'lib/utilities/types';

import { getPostCommentMentions } from './getPostCommentMentions';
import { getPostComments } from './getPostComments';
import { getPostMentions } from './getPostMentions';
import { getPropertiesFromPost } from './utils';

export type ForumNotificationsGroup = {
  marked: ForumNotification[];
  unmarked: ForumNotification[];
};

type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

export type ForumNotificationsContext = {
  userId: string;
  spacesRecord: SpaceRecord;
  username: string;
  posts: (Post & {
    comments: (Pick<
      PostComment,
      'id' | 'createdAt' | 'createdBy' | 'content' | 'contentText' | 'parentId' | 'postId'
    > & { user: NotificationActor })[];
  })[];
};

export type ForumNotifications = {
  mentions: ForumNotification[];
  comments: ForumNotification[];
};

export async function getForumTasks(userId: string): Promise<ForumNotificationsGroup> {
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

  let newPosts: ForumNotification[] = [];

  for (const spaceRole of spaceRoles) {
    const postCategories = await getPostCategories(spaceRole.space.id);
    const spaceNotifications = await getUserSpaceNotifications({ spaceId: spaceRole.space.id, userId });

    const visiblePostCategories = await getPermissionsClient({
      resourceId: spaceRole.spaceId,
      resourceIdType: 'space'
    }).then(({ client }) =>
      client.forum.getPermissionedCategories({
        postCategories,
        userId
      })
    );

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
        author: {
          select: {
            id: true,
            username: true,
            path: true,
            avatar: true,
            avatarTokenId: true,
            avatarContract: true,
            avatarChain: true,
            deletedAt: true
          }
        },
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
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                path: true,
                avatar: true,
                avatarTokenId: true,
                avatarContract: true,
                avatarChain: true,
                deletedAt: true
              }
            }
          }
        }
      }
    });

    const featureStartDate = new Date(2023, 2, 9);

    const subscriptions = spaceNotifications.forums.categories;
    const postsFromOthers = _posts
      .filter((post) => post.createdBy !== userId && subscriptions[post.categoryId])
      .filter((post) => post.createdAt > featureStartDate);

    newPosts = [
      ...newPosts,
      ...(postsFromOthers.map((post) => ({
        ...getPropertiesFromPost(post, spaceRole.space),
        commentId: null,
        commentText: '',
        createdAt: post.createdAt.toISOString(),
        createdBy: post.author,
        mentionId: null,
        postId: post.id,
        postPath: post.path,
        postTitle: post.title,
        spaceDomain: spaceRole.space.domain,
        spaceId: post.spaceId,
        spaceName: spaceRole.space.name,
        taskId: post.id,
        type: 'created'
      })) as ForumNotification[])
    ];

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
  const { mentions, comments } = (
    await Promise.all([getPostComments(context), getPostMentions(context), getPostCommentMentions(context)])
  ).reduce(
    (acc, result) => {
      return {
        mentions: acc.mentions.concat(result.mentions),
        comments: acc.comments.concat(result.comments)
      };
    },
    { mentions: [], comments: [] }
  );

  const commentIdsFromMentions = Object.values(mentions)
    .map((item) => item.commentId)
    .filter(isTruthy);

  // Filter already added comments from mentions
  const uniqueComments = comments.filter((item) => item.commentId && !commentIdsFromMentions.includes(item.commentId));

  // Loop through each mentioned task and attach the user data using usersRecord
  const forumTasks = mentions.concat(uniqueComments, newPosts).reduce<ForumNotificationsGroup>(
    (acc, mentionedTaskWithoutUser) => {
      const taskList = notifiedTaskIds.has(mentionedTaskWithoutUser.taskId) ? acc.marked : acc.unmarked;
      taskList.push(mentionedTaskWithoutUser);
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
