import type { Post, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { shortenHex } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import type { ForumTask, ForumTasksGroup } from './interface';

type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

interface GetForumTasksInput {
  userId: string;
  spaceIds: string[];
  spaceRecord: SpaceRecord;
  username: string;
}

type ForumDiscussionTask = Omit<ForumTask, 'createdBy'> & { userId: string };

interface GetForumTasksResponse {
  mentions: ForumDiscussionTask[];
  discussionUserIds: string[];
  comments: ForumDiscussionTask[];
}

export async function getForumTasks(userId: string): Promise<ForumTasksGroup> {
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

  const context: GetForumTasksInput = { userId, username, spaceRecord, spaceIds };

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

export async function getPostMentions({
  userId,
  username,
  spaceIds,
  spaceRecord
}: GetForumTasksInput): Promise<GetForumTasksResponse> {
  // Get all the pages of all the spaces this user is part of
  const posts = await prisma.post.findMany({
    where: {
      spaceId: {
        in: spaceIds
      },
      deletedAt: null
    },
    select: {
      content: true,
      id: true,
      path: true,
      title: true,
      createdBy: true,
      spaceId: true
    }
  });

  const mentions: GetForumTasksResponse['mentions'] = [];
  const discussionUserIds: string[] = [];

  for (const post of posts) {
    const content = post.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        // Skip mentions not for the user, self mentions and inside user created pages
        if (mention.value === userId && mention.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentions.push({
            ...getPropertiesFromPost(post, spaceRecord),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            commentText: mention.text,
            commentId: null,
            postId: post.id,
            postPath: post.path,
            postTitle: post.title
          });
        }
      });
    }
  }

  return {
    mentions,
    discussionUserIds,
    comments: []
  };
}

async function getPostCommentMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: GetForumTasksInput): Promise<GetForumTasksResponse> {
  const comments = await prisma.postComment.findMany({
    where: {
      post: {
        spaceId: {
          in: spaceIds
        }
      },
      deletedAt: null
    },
    select: {
      id: true,
      createdBy: true,
      content: true,
      post: {
        select: {
          title: true,
          id: true,
          path: true,
          spaceId: true
        }
      }
    }
  });

  const mentions: GetForumTasksResponse['mentions'] = [];
  const discussionUserIds: string[] = [];

  for (const comment of comments) {
    const content = comment.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        if (mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentions.push({
            ...getPropertiesFromPost(comment.post, spaceRecord),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            commentText: mention.text,
            commentId: null,
            postId: comment.post.id,
            postPath: comment.post.path,
            postTitle: comment.post.title
          });
        }
      });
    }
  }
  return {
    mentions,
    discussionUserIds,
    comments: []
  };
}

function getPropertiesFromPost(post: Pick<Post, 'spaceId' | 'title' | 'id' | 'path'>, spaceRecord: SpaceRecord) {
  return {
    postId: post.id,
    spaceId: post.spaceId,
    spaceDomain: spaceRecord[post.spaceId].domain,
    postPath: post.path,
    spaceName: spaceRecord[post.spaceId].name,
    postTitle: post.title || 'Untitled'
  } as const;
}

/**
 * Get all comments that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are direct replies after my comment
 */
async function getPostComments({ userId, spaceIds, spaceRecord }: GetForumTasksInput): Promise<GetForumTasksResponse> {
  const comments = await prisma.postComment.findMany({
    where: {
      createdBy: {
        not: userId
      },
      deletedAt: null,
      post: {
        spaceId: {
          in: spaceIds
        },
        deletedAt: null
      }
    },
    include: {
      post: {
        select: {
          createdBy: true,
          path: true,
          title: true,
          spaceId: true,
          id: true
        }
      }
    }
  });
  // Comments that are not created by the user but are on a post page created by the user
  const commentsOnTheUserPage = comments.filter((comment) => comment.post.createdBy === userId);

  const parentComments = await prisma.postComment.findMany({
    where: {
      id: {
        in: comments.map((c) => c.parentId ?? '').filter(isTruthy)
      },
      createdBy: userId,
      deletedAt: null,
      post: {
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
    (comment) => comment.post.createdBy !== userId && parentCommentIds.includes(comment.parentId ?? '')
  );

  const allComments = [...commentsOnTheUserPage, ...commentReplies];

  const commentTasks = allComments.map((comment) => {
    return {
      ...getPropertiesFromPost(comment.post, spaceRecord),
      createdAt: new Date(comment.createdAt).toISOString(),
      userId: comment.createdBy,
      commentText: comment.contentText,
      commentId: comment.id,
      mentionId: null
    };
  });

  return {
    mentions: [],
    discussionUserIds: commentTasks.map((comm) => comm.userId).concat([userId]),
    comments: commentTasks
  };
}

// utils

function sortByDate<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
