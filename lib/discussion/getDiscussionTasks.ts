import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { DiscussionNotification, NotificationsGroup } from 'lib/notifications/interfaces';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { MentionNode, PageContent, TextContent } from 'lib/prosemirror/interfaces';
import { shortenHex } from 'lib/utilities/blockchain';

import { getPropertiesFromPage } from './getPropertiesFromPage';
import type { DiscussionTask } from './interfaces';

export type DiscussionTasksGroup = {
  marked: DiscussionTask[];
  unmarked: DiscussionTask[];
};

export type Discussion = Omit<DiscussionTask, 'createdBy'> & { userId: string };
export type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

export type GetDiscussionsInput = {
  userId: string;
  username: string;
  spaceIds: string[];
  spaceRecord: SpaceRecord;
};

export interface GetDiscussionsResponse {
  mentions: Discussion[];
  discussionUserIds: string[];
  comments: Discussion[];
}

export type DiscussionNotificationsGroup = NotificationsGroup<DiscussionNotification>;

export interface GetDiscussionNotificationsResponse {
  mentions: DiscussionNotification[];
  comments: DiscussionNotification[];
}

export async function getDiscussionTasks(userId: string): Promise<DiscussionNotificationsGroup> {
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

  const notifications = await prisma.userNotification.findMany({
    where: {
      userId,
      type: {
        in: ['page_comment', 'mention']
      }
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

  spaces.forEach((space) => {
    spaceRecord[space.id] = space;
  });

  // Get the marked comment/mention task ids (all the discussion type tasks that exist in the db)
  const notifiedTaskIds = new Set(notifications.map((notification) => notification.taskId));

  const context: GetDiscussionsInput = { userId, username, spaceRecord, spaceIds };

  const { mentions, comments } = await Promise.all([
    getPageInlineComments(context),
    getPageInlineCommentMentions(context),
    getPageMentions(context),
    getBlockCommentMentions(context)
  ]).then((results) => {
    // aggregate the results
    return results.reduce(
      (acc, result) => {
        return {
          mentions: acc.mentions.concat(result.mentions),
          comments: acc.comments.concat(result.comments)
        };
      },
      { mentions: [], comments: [] }
    );
  });

  const commentIdsFromMentions = Object.values(mentions)
    .map((item) => item.inlineCommentId ?? item.blockCommentId)
    .filter((item: string | null): item is string => !!item);

  // Filter already added comments from mentions
  const uniqueComments = comments.filter((item) => {
    const commentId = item.inlineCommentId ?? item.blockCommentId;
    return commentId && !commentIdsFromMentions.includes(commentId);
  });

  // Loop through each mentioned task and attach the user data using usersRecord
  const mentionedTasks = mentions.reduce<DiscussionNotificationsGroup>(
    (acc, mentionTask) => {
      const taskList = notifiedTaskIds.has(mentionTask.mentionId ?? mentionTask.taskId ?? '')
        ? acc.marked
        : acc.unmarked;
      taskList.push(mentionTask);

      return acc;
    },
    { marked: [], unmarked: [] }
  );

  // Loop through each comment task and attach the user data using usersRecord
  const commentTasks = uniqueComments.reduce<DiscussionNotificationsGroup>(
    (acc, commentTask) => {
      const taskList = notifiedTaskIds.has(
        commentTask.inlineCommentId ?? commentTask.blockCommentId ?? commentTask.taskId ?? ''
      )
        ? acc.marked
        : acc.unmarked;
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

async function getBlockCommentMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionNotificationsResponse> {
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
      },
      spaceId: true,
      fields: true,
      parentId: true
    }
  });

  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: blockComments.map((block) => block.parentId)
      }
    }
  });

  const mentions: DiscussionNotification[] = [];
  const discussionUserIds: string[] = [];

  for (const comment of blockComments) {
    const page = pages.find((p) => p.id === comment.parentId);
    const content = (comment.fields as any)?.content as PageContent;
    if (page && content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        if (page && mention.value === userId && mention.createdBy !== userId && comment.user.id !== userId) {
          discussionUserIds.push(mention.createdBy);
          const discussionNotification: DiscussionNotification = {
            ...getPropertiesFromPage(page, spaceRecord[page.spaceId]),
            mentionId: mention.id,
            taskId: mention.id,
            createdAt: mention.createdAt,
            text: mention.text,
            blockCommentId: comment.id,
            createdBy: comment.user,
            inlineCommentId: null,
            pageType: 'page',
            personPropertyId: null,
            type: 'block_comment.mention.created'
          };

          mentions.push(discussionNotification);
        }
      });
    }
  }
  return {
    mentions,
    comments: []
  };
}

/**
 * Get all comments from threads that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are replies after my comment
 */
async function getPageInlineComments({
  userId,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionNotificationsResponse> {
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
        },
        {
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
            },
            {
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
          },
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
    .filter((thread) => thread.page.createdBy === userId)
    .map((t) => t.comments)
    .flat()
    .filter((c) => c.userId !== userId);

  // All comments that are not created by the user, are replies of a comment created by the user and page is not created by the user.
  const repliesFromThreads = threads
    .filter((thread) => thread.page.createdBy !== userId)
    .map((thread) => thread.comments)
    .filter((_comments) => {
      // Find the first user comment
      const userCommentIndex = _comments.findIndex((_comment) => _comment.userId === userId);

      if (userCommentIndex > -1) {
        // Start searching after the first user comment to check if there is a reply to it
        const otherUserCommentIndex = _comments
          .slice(userCommentIndex)
          .findIndex((_comment) => _comment.userId !== userId);

        if (otherUserCommentIndex > 0) {
          return true;
        }
      }

      return false;
    })
    .map((_comments) => {
      const userCommentIndex = _comments.findIndex((_comment) => _comment.userId === userId);
      // Return all replies after the user comment
      return _comments.slice(userCommentIndex + 1);
    })
    .flat()
    .filter((_comment) => _comment.userId !== userId);

  const allComments = [
    ...myPageComments.map((c) => ({ ...c, reply: false })),
    ...repliesFromThreads.map((c) => ({ ...c, reply: true }))
  ];

  const textComments: DiscussionNotification[] = [];

  for (const comment of allComments) {
    const content = comment.content as PageContent;
    const isTextContent = (node: TextContent | PageContent | MentionNode): node is TextContent => node.type === 'text';
    const blockNodes = content.content ? content.content[0].content ?? [] : [];

    for (const blockNode of blockNodes) {
      if (isTextContent(blockNode) && blockNode.text.trim()) {
        const discussionNotification: DiscussionNotification = {
          ...getPropertiesFromPage(comment.page, spaceRecord[comment.page.spaceId]),
          text: blockNode.text,
          mentionId: null,
          taskId: comment.id,
          createdAt: new Date(comment.createdAt).toISOString(),
          createdBy: comment.user,
          inlineCommentId: comment.id,
          pageType: 'page',
          personPropertyId: null,
          type: comment.reply ? 'inline_comment.replied' : 'inline_comment.created',
          blockCommentId: null
        };

        textComments.push(discussionNotification);
        break;
      }
    }
  }

  return {
    mentions: [],
    comments: textComments
  };
}

async function getPageInlineCommentMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionNotificationsResponse> {
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
      },
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
  });

  const mentions: DiscussionNotification[] = [];

  for (const comment of comments) {
    const content = comment.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        if (mention.value === userId && mention.createdBy !== userId && comment.userId !== userId) {
          const discussionNotification: DiscussionNotification = {
            ...getPropertiesFromPage(comment.page, spaceRecord[comment.page.spaceId]),
            mentionId: mention.id,
            taskId: mention.id,
            createdAt: mention.createdAt,
            text: mention.text,
            createdBy: comment.user,
            inlineCommentId: comment.id,
            pageType: 'page',
            personPropertyId: null,
            type: 'inline_comment.mention.created',
            blockCommentId: null
          };
          mentions.push(discussionNotification);
        }
      });
    }
  }
  return {
    mentions,
    comments: []
  };
}

type PageToExtractMentionsFrom = Pick<Page, 'bountyId' | 'content' | 'id' | 'path' | 'title' | 'createdBy' | 'spaceId'>;

async function getPageMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionNotificationsResponse> {
  // Get all the pages of all the spaces this user is part of
  const mentions: DiscussionNotification[] = [];

  async function extractMentionsFromPage(page: PageToExtractMentionsFrom) {
    const content = page.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      for (const mention of extractedMentions) {
        const mentionAuthorId = mention.createdBy;

        const user = await prisma.user.findUnique({
          where: {
            id: mentionAuthorId
          },
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
        });
        // Skip mentions not for the user, self mentions and inside user created pages
        if (user && mention.value === userId && mention.createdBy !== userId) {
          // Check if another mention already exists (this is possible if the page was duplicated)
          if (!mentions.some(({ taskId }) => mention.id === taskId)) {
            const discussionNotification: DiscussionNotification = {
              ...getPropertiesFromPage(page, spaceRecord[page.spaceId]),
              mentionId: mention.id,
              taskId: mention.id,
              createdAt: mention.createdAt,
              text: mention.text,
              createdBy: user,
              inlineCommentId: null,
              pageType: 'page',
              personPropertyId: null,
              type: 'mention.created',
              blockCommentId: null
            };
            mentions.push(discussionNotification);
          }
        }
      }
    }
  }

  for (const spaceId of spaceIds) {
    let pages = await prisma.page.findMany({
      where: {
        spaceId,
        deletedAt: null
      },
      // This query will return a huge amount of content is user is part of alot of spaces, we need to split it up
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
    for (const page of pages) {
      await extractMentionsFromPage(page);
    }
    // Make page eligible for garbage collection
    pages = null as any;
  }

  return {
    mentions,
    comments: []
  };
}

// utils
function sortByDate<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
