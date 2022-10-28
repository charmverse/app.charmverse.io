import type { Page, Space } from '@prisma/client';

import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import { shortenHex } from 'lib/utilities/strings';
import type { MentionNode, PageContent, TextContent, User } from 'models';

import type { DiscussionTask } from './interfaces';

export type DiscussionTasksGroup = {
  marked: DiscussionTask[];
  unmarked: DiscussionTask[];
}

type Discussion = Omit<DiscussionTask, 'createdBy'> & { userId: string };
type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

interface GetDiscussionsInput {
  userId: string;
  username: string;
  spaceIds: string[];
  spaceRecord: SpaceRecord;
}

interface GetDiscussionsResponse {
  mentions: Record<string, Discussion>;
  discussionUserIds: string[];
  comments: Discussion[];
}

export async function getDiscussionTasks (userId: string): Promise<DiscussionTasksGroup> {
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
  const spaceIds = spaceRoles.map(spaceRole => spaceRole.spaceId);

  const notifications = await prisma.userNotification.findMany({
    where: {
      userId,
      type: 'mention'
    },
    select: {
      taskId: true
    }
  });

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

  const spaceRecord: SpaceRecord = {};

  spaces.forEach(space => {
    spaceRecord[space.id] = space;
  });

  // Get the marked comment/mention task ids (all the discussion type tasks that exist in the db)
  const notifiedTaskIds = new Set(notifications.map(notification => notification.taskId));

  const context: GetDiscussionsInput = { userId, username, spaceRecord, spaceIds };

  const { mentions, discussionUserIds, comments } = await Promise.all([
    getComments(context),
    getMentionsFromComments(context),
    getMentionsFromPages(context),
    getMentionsFromCommentBlocks(context)
  ]).then(results => {
    // aggregate the results
    return results.reduce((acc, result) => {
      return {
        mentions: { ...acc.mentions, ...result.mentions },
        discussionUserIds: [...acc.discussionUserIds, ...result.discussionUserIds],
        comments: [...acc.comments, ...result.comments]
      };
    }, { mentions: {}, discussionUserIds: [], comments: [] });
  });

  const commentIdsFromMentions = Object.values(mentions).map(item => item.commentId).filter((item: string | null): item is string => !!item);

  // Filter already added comments from mentions
  const uniqueComments = comments.filter(item => item.commentId && !commentIdsFromMentions.includes(item.commentId));

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
  const mentionedTasks = Object.values(mentions).reduce<DiscussionTasksGroup>((acc, mentionedTaskWithoutUser) => {

    const mentionedTask = {
      ...mentionedTaskWithoutUser,
      createdBy: usersRecord[mentionedTaskWithoutUser.userId]
    } as DiscussionTask;

    const taskList = notifiedTaskIds.has(mentionedTask.mentionId ?? '') ? acc.marked : acc.unmarked;
    taskList.push(mentionedTask);

    return acc;
  }, { marked: [], unmarked: [] });

  // Loop through each comment task and attach the user data using usersRecord
  const commentTasks = uniqueComments.reduce<DiscussionTasksGroup>((acc, commentTaskWithoutUser) => {

    const commentTask = {
      ...commentTaskWithoutUser,
      createdBy: usersRecord[commentTaskWithoutUser.userId]
    } as DiscussionTask;

    const taskList = notifiedTaskIds.has(commentTask.commentId ?? '') ? acc.marked : acc.unmarked;
    taskList.push(commentTask);

    return acc;
  }, { marked: [], unmarked: [] });

  const allTasks = {
    marked: [...mentionedTasks.marked, ...commentTasks.marked],
    unmarked: [...mentionedTasks.unmarked, ...commentTasks.unmarked]
  };

  return {
    marked: allTasks.marked.sort(sortByDate),
    unmarked: allTasks.unmarked.sort(sortByDate)
  };
}

async function getMentionsFromCommentBlocks ({ userId, username, spaceRecord, spaceIds }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {

  const blockComments = await prisma.block.findMany({
    where: {
      type: 'comment',
      spaceId: {
        in: spaceIds
      },
      deletedAt: null
    },
    select: {
      id: true,
      createdBy: true,
      spaceId: true,
      fields: true,
      parentId: true
    }
  });

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: blockComments.map(block => block.parentId)
      }
    }
  });

  const mentionsMap: GetDiscussionsResponse['mentions'] = {};
  const discussionUserIds: string[] = [];

  for (const comment of blockComments) {
    const page = pages.find(p => p.id === comment.parentId);
    const content = (comment.fields as any)?.content as PageContent;
    if (page && content) {
      const mentions = extractMentions(content, username);
      mentions.forEach(mention => {
        if (page && mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentionsMap[mention.id] = {
            ...getPropertiesFromPage(page, spaceRecord),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            text: mention.text,
            commentId: comment.id
          };
        }
      });
    }
  }
  return {
    mentions: mentionsMap,
    discussionUserIds,
    comments: []
  };
}

/**
 * Get all comments from threads that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are replies after my comment
 */
async function getComments ({ userId, spaceRecord, spaceIds }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
  const threads = await prisma.thread.findMany({
    where: {
      spaceId: {
        in: spaceIds
      },
      page: {
        deletedAt: null
      },
      OR: [
        {
          page: {
            createdBy: userId
          },
          comments: {
            some: {
              userId: {
                not: userId
              }
            }
          }
        }, {
          page: {
            createdBy: {
              not: userId
            }
          },
          AND: [
            {
              comments: {
                some: {
                  userId
                }
              }
            }, {
              comments: {
                some: {
                  userId: {
                    not: userId
                  }
                }
              }
            }
          ]
        }
      ]
    },
    include: {
      page: {
        select: {
          createdBy: true
        }
      },
      comments: {
        select: {
          id: true,
          userId: true,
          spaceId: true,
          content: true,
          createdAt: true,
          page: {
            select: {
              title: true,
              id: true,
              path: true,
              bountyId: true,
              spaceId: true,
              createdBy: true
            }
          }
        }
      }
    }
  });

  // All comments that are not created by the user and are on a page created by the user
  const myPageComments = threads
    .filter(thread => thread.page.createdBy === userId)
    .map(t => t.comments)
    .flat()
    .filter(c => c.userId !== userId);

  // All comments that are not created by the user, are replies of a comment created by the user and page is not created by the user.
  const repliesFromThreads = threads
    .filter(thread => thread.page.createdBy !== userId)
    .map(thread => thread.comments)
    .filter(_comments => {
      // Find the first user comment
      const userCommentIndex = _comments.findIndex(_comment => _comment.userId === userId);

      if (userCommentIndex > -1) {
        // Start searching after the first user comment to check if there is a reply to it
        const otherUserCommentIndex = _comments.slice(userCommentIndex).findIndex(_comment => _comment.userId !== userId);

        if (otherUserCommentIndex > 0) {
          return true;
        }
      }

      return false;
    })
    .map((_comments) => {
      const userCommentIndex = _comments.findIndex(_comment => _comment.userId === userId);
      // Return all replies after the user comment
      return _comments.slice(userCommentIndex + 1);
    })
    .flat()
    .filter(_comment => _comment.userId !== userId);

  const allComments = [...myPageComments, ...repliesFromThreads];

  const textComments: Discussion[] = [];

  for (const comment of allComments) {
    const content = comment.content as PageContent;
    const isTextContent = (node: TextContent | PageContent | MentionNode): node is TextContent => node.type === 'text';
    const blockNodes = content.content ? content.content[0].content ?? [] : [];

    for (const blockNode of blockNodes) {
      if (isTextContent(blockNode) && blockNode.text.trim()) {
        textComments.push({
          ...getPropertiesFromPage(comment.page, spaceRecord),
          text: blockNode.text,
          commentId: comment.id,
          userId: comment.userId,
          createdAt: new Date(comment.createdAt).toISOString(),
          mentionId: null
        });
      }
    }
  }

  return {
    mentions: {},
    discussionUserIds: textComments.map(comm => comm.userId).concat([userId]),
    comments: textComments
  };

}

async function getMentionsFromComments ({ userId, username, spaceRecord, spaceIds }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {

  const comments = await prisma.comment.findMany({
    where: {
      spaceId: {
        in: spaceIds
      },
      page: {
        deletedAt: null
      }
    },
    select: {
      id: true,
      userId: true,
      spaceId: true,
      content: true,
      page: {
        select: {
          title: true,
          id: true,
          path: true,
          bountyId: true,
          spaceId: true
        }
      }
    }
  });

  const mentionsMap: GetDiscussionsResponse['mentions'] = {};
  const discussionUserIds: string[] = [];

  for (const comment of comments) {
    const content = comment.content as PageContent;
    if (content) {
      const mentions = extractMentions(content, username);
      mentions.forEach(mention => {
        if (mention.value === userId && mention.createdBy !== userId && comment.userId !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentionsMap[mention.id] = {
            ...getPropertiesFromPage(comment.page, spaceRecord),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            text: mention.text,
            commentId: comment.id
          };
        }
      });
    }
  }
  return {
    mentions: mentionsMap,
    discussionUserIds,
    comments: []
  };
}

async function getMentionsFromPages ({ userId, username, spaceRecord, spaceIds }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {

  // Get all the pages of all the spaces this user is part of
  const pages = await prisma.page.findMany({
    where: {
      spaceId: {
        in: spaceIds
      },
      deletedAt: null
    },
    select: {
      bountyId: true,
      content: true,
      id: true,
      path: true,
      title: true,
      createdBy: true,
      spaceId: true
    }
  });

  const mentionsMap: GetDiscussionsResponse['mentions'] = {};
  const discussionUserIds: string[] = [];

  for (const page of pages) {
    const content = page.content as PageContent;
    if (content) {
      const mentions = extractMentions(content, username);
      mentions.forEach(mention => {
        // Skip mentions not for the user, self mentions and inside user created pages
        if (mention.value === userId && mention.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentionsMap[mention.id] = {
            ...getPropertiesFromPage(page, spaceRecord),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            text: mention.text,
            commentId: null
          };
        }
      });
    }
  }

  return {
    mentions: mentionsMap,
    discussionUserIds,
    comments: []
  };
}

// utils

function sortByDate <T extends { createdAt: string }> (a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}

function getPropertiesFromPage (page: Pick<Page, 'bountyId' | 'spaceId' | 'title' | 'id' | 'path'>, spaceRecord: SpaceRecord) {
  return {
    pageId: page.id,
    spaceId: page.spaceId,
    spaceDomain: spaceRecord[page.spaceId].domain,
    pagePath: page.path,
    spaceName: spaceRecord[page.spaceId].name,
    pageTitle: page.title || 'Untitled',
    bountyId: page.bountyId,
    bountyTitle: page.title,
    type: page.bountyId ? 'bounty' : 'page'
  } as const;
}
