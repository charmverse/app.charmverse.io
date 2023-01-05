import type { PageComment, Space, User } from '@prisma/client';

import { prisma } from 'db';

import type { ForumCommentTask, ForumCommentTasksGroup } from './interface';

type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

interface GetForumCommentsInput {
  userId: string;
  spaceIds: string[];
}

export async function getForumCommentsTasks(userId: string): Promise<ForumCommentTasksGroup> {
  // Get all the spaces the user is part of
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true
    }
  });

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
      type: 'forum_comment'
    },
    select: {
      taskId: true
    }
  });

  // Get comments specific for the user
  const comments = await getPostComments({ userId, spaceIds });

  // Only fetch the users that created the comments
  const uniqueUsers = [...new Set(comments.map((comment) => comment.createdBy))];
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueUsers
      }
    }
  });

  // Get the marked & unique comment task ids
  const notifiedTaskIds = new Set(notifications.map((notification) => notification.taskId));

  // Create a record for the user
  const usersRecord = users.reduce<Record<string, User>>((acc, cur) => ({ ...acc, [cur.id]: cur }), {});

  // Loop through each comment task, attach information about the space & page and set them marked/unmarked,
  const commentTasks = comments.reduce<ForumCommentTasksGroup>(
    (acc, commentWithoutUser) => {
      const commentTask: ForumCommentTask = {
        spaceId: commentWithoutUser.page.spaceId,
        spaceDomain: spaceRecord[commentWithoutUser.page.spaceId].domain,
        spaceName: spaceRecord[commentWithoutUser.page.spaceId].name,
        pageId: commentWithoutUser.pageId,
        pagePath: commentWithoutUser.page.path,
        pageTitle: commentWithoutUser.page.title,
        createdBy: usersRecord[commentWithoutUser.createdBy],
        createdAt: new Date(commentWithoutUser.createdAt).toISOString(),
        commentId: commentWithoutUser.id,
        commentText: commentWithoutUser.contentText
      };

      if (notifiedTaskIds.has(commentTask.commentId)) {
        return { ...acc, marked: [...acc.marked, commentTask] };
      } else {
        return { ...acc, unmarked: [...acc.unmarked, commentTask] };
      }
    },
    { marked: [], unmarked: [] }
  );

  return {
    marked: commentTasks.marked.sort(sortByDate),
    unmarked: commentTasks.unmarked.sort(sortByDate)
  };
}

/**
 * Get all comments that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are direct replies after my comment
 */
async function getPostComments({ userId, spaceIds }: GetForumCommentsInput): Promise<
  (PageComment & {
    page: {
      createdBy: string;
      title: string;
      path: string;
      spaceId: string;
    };
  })[]
> {
  const comments = await prisma.pageComment.findMany({
    where: {
      createdBy: {
        not: userId
      },
      deletedAt: null,
      page: {
        spaceId: {
          in: spaceIds
        },
        deletedAt: null
      }
    },
    include: {
      page: {
        select: {
          createdBy: true,
          path: true,
          title: true,
          spaceId: true
        }
      }
    }
  });

  // Comments that are not created by the user but are on a post page created by the user
  const commentsOnTheUserPage = comments.filter((comment) => comment.page.createdBy === userId);

  const parentComments = await prisma.pageComment.findMany({
    where: {
      id: {
        in: comments.map((c) => c.parentId)
      },
      createdBy: userId,
      deletedAt: null,
      page: {
        spaceId: {
          in: spaceIds
        },
        createdBy: {
          not: userId
        },
        deletedAt: null
      }
    }
  });
  const parentCommentIds = parentComments.map((comment) => comment.id);

  // Comments that are not created by the user, are on a post page that is not created by the user and the parent is the user
  const commentReplies = comments.filter(
    (comment) => comment.page.createdBy !== userId && parentCommentIds.includes(comment.parentId)
  );

  return commentsOnTheUserPage.concat(commentReplies);
}
// utils

function sortByDate<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
