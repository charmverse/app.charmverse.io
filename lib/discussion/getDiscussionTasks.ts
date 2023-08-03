import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { prismaToBlock } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { getPermissionsClient } from 'lib/permissions/api';
import { getProposalCommentMentions, getProposalComments } from 'lib/proposal/getProposalTasks';
import type { ProposalWithCommentsAndUsers } from 'lib/proposal/interface';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { MentionNode, PageContent, TextContent } from 'lib/prosemirror/interfaces';
import { shortenHex } from 'lib/utilities/strings';

import { getPropertiesFromPage } from './getPropertiesFromPage';
import type { DiscussionTask } from './interfaces';

export type DiscussionTasksGroup = {
  marked: DiscussionTask[];
  unmarked: DiscussionTask[];
};

export type Discussion = Omit<DiscussionTask, 'createdBy'> & { userId: string };
export type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

interface GetDiscussionsInput {
  userId: string;
  username: string;
  spaceIds: string[];
  spaceRecord: SpaceRecord;
}

export interface GetDiscussionsResponse {
  mentions: Discussion[];
  discussionUserIds: string[];
  comments: Discussion[];
}

export async function getDiscussionTasks(userId: string): Promise<DiscussionTasksGroup> {
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

  const { mentions, discussionUserIds, comments } = await Promise.all([
    getPageComments(context),
    getPageCommentMentions(context),
    getPageMentions(context),
    getCommentBlockMentions(context),
    getProposalDiscussionTasks(context)
    // getBoardPersonPropertyMentions(context)
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
    .filter((item: string | null): item is string => !!item);

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
  const mentionedTasks = Object.values(mentions).reduce<DiscussionTasksGroup>(
    (acc, mentionedTaskWithoutUser) => {
      const mentionedTask = {
        ...mentionedTaskWithoutUser,
        createdBy: usersRecord[mentionedTaskWithoutUser.userId]
      } as DiscussionTask;

      const taskList = notifiedTaskIds.has(mentionedTask.mentionId ?? mentionedTask.taskId ?? '')
        ? acc.marked
        : acc.unmarked;
      taskList.push(mentionedTask);

      return acc;
    },
    { marked: [], unmarked: [] }
  );

  // Loop through each comment task and attach the user data using usersRecord
  const commentTasks = uniqueComments.reduce<DiscussionTasksGroup>(
    (acc, commentTaskWithoutUser) => {
      const commentTask = {
        ...commentTaskWithoutUser,
        createdBy: usersRecord[commentTaskWithoutUser.userId]
      } as DiscussionTask;

      const taskList = notifiedTaskIds.has(commentTask.commentId ?? commentTask.taskId ?? '')
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

async function getCommentBlockMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
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
        in: blockComments.map((block) => block.parentId)
      }
    }
  });

  const mentions: GetDiscussionsResponse['mentions'] = [];
  const discussionUserIds: string[] = [];

  for (const comment of blockComments) {
    const page = pages.find((p) => p.id === comment.parentId);
    const content = (comment.fields as any)?.content as PageContent;
    if (page && content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        if (page && mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentions.push({
            ...getPropertiesFromPage(page, spaceRecord[page.spaceId]),
            mentionId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            text: mention.text,
            commentId: comment.id,
            taskId: mention.id
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

/**
 * Get all comments from threads that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are replies after my comment
 */
async function getPageComments({
  userId,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
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

  const allComments = [...myPageComments, ...repliesFromThreads];

  const textComments: Discussion[] = [];

  for (const comment of allComments) {
    const content = comment.content as PageContent;
    const isTextContent = (node: TextContent | PageContent | MentionNode): node is TextContent => node.type === 'text';
    const blockNodes = content.content ? content.content[0].content ?? [] : [];

    for (const blockNode of blockNodes) {
      if (isTextContent(blockNode) && blockNode.text.trim()) {
        textComments.push({
          ...getPropertiesFromPage(comment.page, spaceRecord[comment.page.spaceId]),
          text: blockNode.text,
          commentId: comment.id,
          userId: comment.userId,
          createdAt: new Date(comment.createdAt).toISOString(),
          mentionId: null,
          taskId: comment.id
        });
        break;
      }
    }
  }

  return {
    mentions: [],
    discussionUserIds: textComments.map((comm) => comm.userId).concat([userId]),
    comments: textComments
  };
}

async function getPageCommentMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
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

  const mentions: GetDiscussionsResponse['mentions'] = [];
  const discussionUserIds: string[] = [];

  for (const comment of comments) {
    const content = comment.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        if (mention.value === userId && mention.createdBy !== userId && comment.userId !== userId) {
          discussionUserIds.push(mention.createdBy);
          mentions.push({
            ...getPropertiesFromPage(comment.page, spaceRecord[comment.page.spaceId]),
            mentionId: mention.id,
            taskId: mention.id,
            createdAt: mention.createdAt,
            userId: mention.createdBy,
            text: mention.text,
            commentId: comment.id
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

async function getBoardPersonPropertyMentions({
  userId,
  spaceIds,
  spaceRecord
}: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
  const boards = (
    await prisma.block.findMany({
      where: {
        spaceId: {
          in: spaceIds
        },
        type: 'board',
        deletedAt: null
      }
    })
  ).map(prismaToBlock) as Board[];

  const boardBlocksPersonPropertyRecord: Record<string, string> = {};

  boards.forEach((board) => {
    const personProperty = board.fields.cardProperties.find((cardProperty) => cardProperty.type === 'person');
    if (personProperty) {
      boardBlocksPersonPropertyRecord[board.id] = personProperty.id;
    }
  });

  const cards = await prisma.block.findMany({
    where: {
      parentId: {
        in: Object.keys(boardBlocksPersonPropertyRecord)
      },
      type: 'card',
      deletedAt: null,
      createdAt: {
        gt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      }
    },
    include: {
      page: {
        select: {
          title: true,
          id: true,
          path: true,
          bountyId: true
        }
      },
      user: {
        select: {
          username: true,
          id: true
        }
      }
    }
  });

  const mentions: GetDiscussionsResponse['mentions'] = [];
  const discussionUserIds: string[] = [];
  for (const card of cards) {
    const blockCard = prismaToBlock(card) as Card;
    const personPropertyId = boardBlocksPersonPropertyRecord[card.parentId];
    const personPropertyValue = personPropertyId ? blockCard.fields.properties[personPropertyId] ?? [] : [];
    const space = spaceRecord[card.spaceId];
    if (space && card.page && personPropertyValue.includes(userId) && userId !== card.user.id) {
      discussionUserIds.push(personPropertyId);
      // Need to push author of card to fetch information
      discussionUserIds.push(card.user.id);
      mentions.push({
        pageId: card.page.id,
        spaceId: card.spaceId,
        spaceDomain: space.domain,
        pagePath: card.page.path,
        spaceName: space.name,
        pageTitle: card.page.title || 'Untitled',
        bountyId: card.page.bountyId,
        bountyTitle: card.page.title,
        type: card.page.bountyId ? 'bounty' : 'page',
        mentionId: null,
        taskId: `${card.id}.${personPropertyId}`,
        // Fake value
        createdAt: new Date().toString(),
        userId: card.createdBy,
        text: `${card.user.username} assigned you in the card ${card.page.title || 'Untitled'}`,
        commentId: null
      });
    }
  }

  return {
    mentions,
    discussionUserIds,
    comments: []
  };
}

type PageToExtractMentionsFrom = Pick<Page, 'bountyId' | 'content' | 'id' | 'path' | 'title' | 'createdBy' | 'spaceId'>;

async function getPageMentions({
  userId,
  username,
  spaceRecord,
  spaceIds
}: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
  // Get all the pages of all the spaces this user is part of
  const mentions: GetDiscussionsResponse['mentions'] = [];
  const discussionUserIds: string[] = [];

  function extractMentionsFromPage(page: PageToExtractMentionsFrom) {
    const content = page.content as PageContent;
    if (content) {
      const extractedMentions = extractMentions(content, username);
      extractedMentions.forEach((mention) => {
        // Skip mentions not for the user, self mentions and inside user created pages
        if (mention.value === userId && mention.createdBy !== userId) {
          discussionUserIds.push(mention.createdBy);
          // Check if another mention already exists (this is possible if the page was duplicated)
          if (!mentions.some(({ taskId }) => mention.id === taskId)) {
            mentions.push({
              ...getPropertiesFromPage(page, spaceRecord[page.spaceId]),
              mentionId: mention.id,
              taskId: mention.id,
              createdAt: mention.createdAt,
              userId: mention.createdBy,
              text: mention.text,
              commentId: null
            });
          }
        }
      });
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
      extractMentionsFromPage(page);
    }
    // Make page eligible for garbage collection
    pages = null as any;
  }

  return {
    mentions,
    discussionUserIds,
    comments: []
  };
}

// utils
function sortByDate<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}

export type ProposalDiscussionNotificationsContext = {
  userId: string;
  spaceRecord: SpaceRecord;
  username: string;
  proposals: ProposalWithCommentsAndUsers[];
};

async function getProposalDiscussionTasks({
  spaceIds,
  userId,
  spaceRecord,
  username
}: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
  const proposals: ProposalDiscussionNotificationsContext['proposals'] = [];
  for (const spaceId of spaceIds) {
    const userProposals = (await getPermissionsClient({ resourceId: spaceId, resourceIdType: 'space' }).then(
      ({ client }) =>
        client.proposals.getAccessibleProposals({
          userId,
          spaceId,
          includePage: true,
          onlyAssigned: true
        })
    )) as ProposalWithCommentsAndUsers[];

    proposals.push(...userProposals);
  }

  const context: ProposalDiscussionNotificationsContext = { userId, username, spaceRecord, proposals };

  // aggregate the results
  const { mentions, discussionUserIds, comments } = [
    getProposalComments(context),
    getProposalCommentMentions(context)
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

  return {
    mentions,
    discussionUserIds,
    comments
  };
}
