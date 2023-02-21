import type { Space, User } from '@prisma/client';

import { prisma } from 'db';
import { shortenHex } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import type { ForumTask, ForumTasksGroup } from '../comments/interface';

import { getPostCommentMentions } from './getPostCommentMentions';
import { getPostComments } from './getPostComments';
import { getPostMentions } from './getPostMentions';

type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

export type ForumNotificationsInput = {
  userId: string;
  spaceIds: string[];
  spaceRecord: SpaceRecord;
  username: string;
};

type ForumDiscussionTask = Omit<ForumTask, 'createdBy'> & { userId: string };

export type ForumNotifications = {
  mentions: ForumDiscussionTask[];
  discussionUserIds: string[];
  comments: ForumDiscussionTask[];
};

export async function getForumNotifications(userId: string): Promise<ForumTasksGroup> {
  // Get all the space the user is part of
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true
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

  // Array of space ids the user is part of
  const spaceIds = spaceRoles.map((spaceRole) => spaceRole.spaceId);

  const spaces = await prisma.space.findMany({
    where: {
      id: {
        in: spaceIds
      }
    },
    select: {
      domain: true,
      id: true,
      name: true
    }
  });

  const spaceRecord = spaces.reduce<SpaceRecord>((acc, space) => {
    return {
      ...acc,
      [space.id]: space
    };
  }, {});

  const notifications = await prisma.userNotification.findMany({
    where: {
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

  const context: ForumNotificationsInput = { userId, username, spaceRecord, spaceIds };

  const { mentions, discussionUserIds, comments } = await Promise.all([
    getPostComments(context),
    getPostMentions(context),
    getPostCommentMentions(context)
  ]).then((results) => {
    // aggregate the results
    return results.reduce(
      (acc, result) => {
        return {
          mentions: acc.mentions.concat(result.mentions),
          discussionUserIds: acc.discussionUserIds.concat(result.discussionUserIds),
          comments: acc.comments.concat(result.comments)
        };
      },
      { mentions: [], discussionUserIds: [], comments: [] }
    );
  });

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
