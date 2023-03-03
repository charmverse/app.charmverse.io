import type { Post, PostComment, Space, User } from '@prisma/client';

import { prisma } from 'db';
import type { TaskUser } from 'lib/discussion/interfaces';
import { timeAgo } from 'lib/utilities/dates';
import { shortenHex } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import { getNewPosts } from './getNewPosts';
import { getPostCommentMentions } from './getPostCommentMentions';
import { getPostComments } from './getPostComments';
import { getPostMentions } from './getPostMentions';

export type ForumTask = {
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

export type ForumNotificationsInput = {
  userId: string;
  spacesRecord: SpaceRecord;
  username: string;
  posts: (Post & {
    comments: Pick<PostComment, 'id' | 'createdAt' | 'createdBy' | 'content' | 'contentText' | 'parentId' | 'postId'>[];
  })[];
};

export type UnpopulatedForumTask = Omit<ForumTask, 'createdBy'> & { userId: string };

export type ForumNotifications = {
  mentions: UnpopulatedForumTask[];
  discussionUserIds: string[];
  comments: UnpopulatedForumTask[];
};

const lookback = timeAgo({ months: 1 });

export async function getForumNotifications(userId: string): Promise<ForumTasksGroup> {
  // Get the user's spaces, posts and comments from those spaces. TODO: we should only get comments created by the user first
  const forumDataBySpace = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    include: {
      space: {
        include: {
          posts: {
            where: {
              deletedAt: null
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
          }
        }
      }
    }
  });

  // Get the username of the user, its required when constructing the mention message text
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      username: true
    }
  });

  const username = user?.username ?? shortenHex(userId);

  const spaces = forumDataBySpace.map(({ space }) => space);

  const spacesRecord = spaces.reduce<SpaceRecord>((acc, space) => {
    return {
      ...acc,
      [space.id]: space
    };
  }, {});

  const notifications = await prisma.userNotification.findMany({
    where: {
      createdAt: {
        gte: lookback
      },
      userId,
      type: {
        in: ['post_comment', 'mention']
      }
    },
    select: {
      taskId: true
    }
  });

  // Get the marked comment/mention task ids (all the discussion type tasks that exist in the db)
  const notifiedTaskIds = new Set(notifications.map((notification) => notification.taskId));
  const posts = spaces.flatMap((space) => space.posts);

  const context: ForumNotificationsInput = { userId, username, spacesRecord, posts };

  const newPosts = await getNewPosts({ userId, posts, spacesRecord });

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
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [...new Set(discussionUserIds)]
      }
    }
  });

  // Create a record for the user
  const usersRecord = users.reduce<Record<string, User>>((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

  // Loop through each mentioned task and attach the user data using usersRecord
  const mentionedTasks = Object.values(mentions).reduce<ForumTasksGroup>(
    (acc, mentionedTaskWithoutUser) => {
      const mentionedTask = {
        ...mentionedTaskWithoutUser,
        createdBy: usersRecord[mentionedTaskWithoutUser.userId]
      } as ForumTask;

      const taskList = notifiedTaskIds.has(mentionedTask.mentionId ?? '') ? acc.marked : acc.unmarked;
      taskList.push(mentionedTask);

      return acc;
    },
    { marked: [], unmarked: [] }
  );

  // Loop through each comment task and attach the user data using usersRecord
  const commentTasks = uniqueComments.reduce<ForumTasksGroup>(
    (acc, commentTaskWithoutUser) => {
      const commentTask = {
        ...commentTaskWithoutUser,
        createdBy: usersRecord[commentTaskWithoutUser.userId]
      } as ForumTask;

      const taskList = notifiedTaskIds.has(commentTask.commentId ?? '') ? acc.marked : acc.unmarked;
      taskList.push(commentTask);

      return acc;
    },
    { marked: [], unmarked: [] }
  );

  const allTasks = {
    marked: [...mentionedTasks.marked, ...commentTasks.marked],
    unmarked: [...mentionedTasks.unmarked, ...commentTasks.unmarked]
  };

  return {
    marked: allTasks.marked.sort(sortByDate),
    unmarked: allTasks.unmarked.sort(sortByDate)
  };
}

// utils

function sortByDate<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
