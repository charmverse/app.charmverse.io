import type { Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { DiscussionNotification } from './interfaces';

export type DiscussionNotificationsGroup = {
  marked: DiscussionNotification[];
  unmarked: DiscussionNotification[];
};

export type Discussion = Omit<DiscussionNotification, 'createdBy'> & { userId: string };
export type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;

export interface GetDiscussionsResponse {
  mentions: Discussion[];
  discussionUserIds: string[];
  comments: Discussion[];
}

export type GetDiscussionsInput = {
  userId: string;
  username: string;
  spaceIds: string[];
  spaceRecord: SpaceRecord;
};

export async function getDiscussionNotifications(userId: string): Promise<DiscussionNotificationsGroup> {
  const discussionNotificationsGroups = (await Promise.all([getPageMentions(userId)])).flat();
  const discussionNotificationsGroup: DiscussionNotificationsGroup = {
    marked: [],
    unmarked: []
  };

  discussionNotificationsGroups.forEach(({ marked, unmarked }) => {
    discussionNotificationsGroup.marked.push(...marked);
    discussionNotificationsGroup.unmarked.push(...unmarked);
  });

  return {
    marked: discussionNotificationsGroup.marked.sort(sortByDate),
    unmarked: discussionNotificationsGroup.unmarked.sort(sortByDate)
  };
}

async function getPageMentions(userId: string): Promise<DiscussionNotificationsGroup> {
  const pageNotifications = await prisma.pageNotification.findMany({
    where: {
      record: {
        userId
      },
      mentionId: {
        not: null
      }
    },
    include: {
      page: {
        select: {
          bountyId: true,
          path: true,
          type: true,
          title: true
        }
      },
      record: {
        include: {
          space: {
            select: {
              name: true,
              domain: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              path: true,
              avatar: true,
              avatarTokenId: true
            }
          }
        }
      }
    }
  });

  const discussionNotificationsGroup: DiscussionNotificationsGroup = {
    marked: [],
    unmarked: []
  };

  pageNotifications.forEach((notification) => {
    const discussionNotification = {
      taskId: notification.id,
      bountyId: notification.page.bountyId,
      bountyTitle: notification.page.title,
      commentId: notification.commentId,
      mentionId: notification.mentionId,
      createdAt: notification.record.createdAt.toISOString(),
      createdBy: notification.record.user,
      pageId: notification.pageId,
      pagePath: notification.page.path,
      pageTitle: notification.page.title,
      spaceDomain: notification.record.space.domain,
      spaceId: notification.record.spaceId,
      spaceName: notification.record.space.name,
      type: notification.page.type as DiscussionNotification['type'],
      text: ''
    };

    if (notification.record.seenAt) {
      discussionNotificationsGroup.marked.push(discussionNotification);
    } else {
      discussionNotificationsGroup.unmarked.push(discussionNotification);
    }
  });

  return discussionNotificationsGroup;
}

// async function getCommentBlockMentions({
//   userId,
//   username,
//   spaceRecord,
//   spaceIds
// }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
//   const blockComments = await prisma.block.findMany({
//     where: {
//       type: 'comment',
//       spaceId: {
//         in: spaceIds
//       },
//       deletedAt: null
//     },
//     select: {
//       id: true,
//       createdBy: true,
//       spaceId: true,
//       fields: true,
//       parentId: true
//     }
//   });

//   const pages = await prisma.page.findMany({
//     where: {
//       id: {
//         in: blockComments.map((block) => block.parentId)
//       }
//     }
//   });

//   const mentions: GetDiscussionsResponse['mentions'] = [];
//   const discussionUserIds: string[] = [];

//   for (const comment of blockComments) {
//     const page = pages.find((p) => p.id === comment.parentId);
//     const content = (comment.fields as any)?.content as PageContent;
//     if (page && content) {
//       const extractedMentions = extractMentions(content, username);
//       extractedMentions.forEach((mention) => {
//         if (page && mention.value === userId && mention.createdBy !== userId && comment.createdBy !== userId) {
//           discussionUserIds.push(mention.createdBy);
//           mentions.push({
//             ...getPropertiesFromPage(page, spaceRecord[page.spaceId]),
//             mentionId: mention.id,
//             createdAt: mention.createdAt,
//             userId: mention.createdBy,
//             text: mention.text,
//             commentId: comment.id,
//             taskId: mention.id
//           });
//         }
//       });
//     }
//   }
//   return {
//     mentions,
//     discussionUserIds,
//     comments: []
//   };
// }

/**
 * Get all comments from threads that match these 2:
 * 1. My page, but not my comments
 * 2. Not my page, just comments that are replies after my comment
 */
// async function getPageComments({
//   userId,
//   spaceRecord,
//   spaceIds
// }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
//   const threads = await prisma.thread.findMany({
//     where: {
//       spaceId: {
//         in: spaceIds
//       },
//       page: {
//         deletedAt: null
//       },
//       OR: [
//         {
//           page: {
//             createdBy: userId
//           },
//           comments: {
//             some: {
//               userId: {
//                 not: userId
//               }
//             }
//           }
//         },
//         {
//           page: {
//             createdBy: {
//               not: userId
//             }
//           },
//           AND: [
//             {
//               comments: {
//                 some: {
//                   userId
//                 }
//               }
//             },
//             {
//               comments: {
//                 some: {
//                   userId: {
//                     not: userId
//                   }
//                 }
//               }
//             }
//           ]
//         }
//       ]
//     },
//     include: {
//       page: {
//         select: {
//           createdBy: true
//         }
//       },
//       comments: {
//         select: {
//           id: true,
//           userId: true,
//           spaceId: true,
//           content: true,
//           createdAt: true,
//           page: {
//             select: {
//               title: true,
//               id: true,
//               path: true,
//               bountyId: true,
//               spaceId: true,
//               createdBy: true
//             }
//           }
//         }
//       }
//     }
//   });

//   // All comments that are not created by the user and are on a page created by the user
//   const myPageComments = threads
//     .filter((thread) => thread.page.createdBy === userId)
//     .map((t) => t.comments)
//     .flat()
//     .filter((c) => c.userId !== userId);

//   // All comments that are not created by the user, are replies of a comment created by the user and page is not created by the user.
//   const repliesFromThreads = threads
//     .filter((thread) => thread.page.createdBy !== userId)
//     .map((thread) => thread.comments)
//     .filter((_comments) => {
//       // Find the first user comment
//       const userCommentIndex = _comments.findIndex((_comment) => _comment.userId === userId);

//       if (userCommentIndex > -1) {
//         // Start searching after the first user comment to check if there is a reply to it
//         const otherUserCommentIndex = _comments
//           .slice(userCommentIndex)
//           .findIndex((_comment) => _comment.userId !== userId);

//         if (otherUserCommentIndex > 0) {
//           return true;
//         }
//       }

//       return false;
//     })
//     .map((_comments) => {
//       const userCommentIndex = _comments.findIndex((_comment) => _comment.userId === userId);
//       // Return all replies after the user comment
//       return _comments.slice(userCommentIndex + 1);
//     })
//     .flat()
//     .filter((_comment) => _comment.userId !== userId);

//   const allComments = [...myPageComments, ...repliesFromThreads];

//   const textComments: Discussion[] = [];

//   for (const comment of allComments) {
//     const content = comment.content as PageContent;
//     const isTextContent = (node: TextContent | PageContent | MentionNode): node is TextContent => node.type === 'text';
//     const blockNodes = content.content ? content.content[0].content ?? [] : [];

//     for (const blockNode of blockNodes) {
//       if (isTextContent(blockNode) && blockNode.text.trim()) {
//         textComments.push({
//           ...getPropertiesFromPage(comment.page, spaceRecord[comment.page.spaceId]),
//           text: blockNode.text,
//           commentId: comment.id,
//           userId: comment.userId,
//           createdAt: new Date(comment.createdAt).toISOString(),
//           mentionId: null,
//           taskId: comment.id
//         });
//         break;
//       }
//     }
//   }

//   return {
//     mentions: [],
//     discussionUserIds: textComments.map((comm) => comm.userId).concat([userId]),
//     comments: textComments
//   };
// }

// async function getPageCommentMentions({
//   userId,
//   username,
//   spaceRecord,
//   spaceIds
// }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
//   const comments = await prisma.comment.findMany({
//     where: {
//       spaceId: {
//         in: spaceIds
//       },
//       page: {
//         deletedAt: null
//       }
//     },
//     select: {
//       id: true,
//       userId: true,
//       spaceId: true,
//       content: true,
//       page: {
//         select: {
//           title: true,
//           id: true,
//           path: true,
//           bountyId: true,
//           spaceId: true
//         }
//       }
//     }
//   });

//   const mentions: GetDiscussionsResponse['mentions'] = [];
//   const discussionUserIds: string[] = [];

//   for (const comment of comments) {
//     const content = comment.content as PageContent;
//     if (content) {
//       const extractedMentions = extractMentions(content, username);
//       extractedMentions.forEach((mention) => {
//         if (mention.value === userId && mention.createdBy !== userId && comment.userId !== userId) {
//           discussionUserIds.push(mention.createdBy);
//           mentions.push({
//             ...getPropertiesFromPage(comment.page, spaceRecord[comment.page.spaceId]),
//             mentionId: mention.id,
//             taskId: mention.id,
//             createdAt: mention.createdAt,
//             userId: mention.createdBy,
//             text: mention.text,
//             commentId: comment.id
//           });
//         }
//       });
//     }
//   }
//   return {
//     mentions,
//     discussionUserIds,
//     comments: []
//   };
// }

/** Currently this code is unused - leaving to see if we should fix */
// async function getBoardPersonPropertyMentions({
//   userId,
//   spaceIds,
//   spaceRecord
// }: GetDiscussionsInput): Promise<GetDiscussionsResponse> {
//   const boards = (
//     await prisma.block.findMany({
//       where: {
//         spaceId: {
//           in: spaceIds
//         },
//         type: 'board',
//         deletedAt: null
//       }
//     })
//   ).map(prismaToBlock) as Board[];

//   const boardBlocksPersonPropertyRecord: Record<string, string> = {};

//   boards.forEach((board) => {
//     const personProperty = board.fields.cardProperties.find((cardProperty) => cardProperty.type === 'person');
//     if (personProperty) {
//       boardBlocksPersonPropertyRecord[board.id] = personProperty.id;
//     }
//   });

//   const cards = await prisma.block.findMany({
//     where: {
//       parentId: {
//         in: Object.keys(boardBlocksPersonPropertyRecord)
//       },
//       type: 'card',
//       deletedAt: null,
//       createdAt: {
//         gt: new Date(Date.now() - 1000 * 60 * 60 * 24)
//       }
//     },
//     include: {
//       page: {
//         select: {
//           title: true,
//           id: true,
//           path: true,
//           bountyId: true
//         }
//       },
//       user: {
//         select: {
//           username: true,
//           id: true
//         }
//       }
//     }
//   });

//   const mentions: GetDiscussionsResponse['mentions'] = [];
//   const discussionUserIds: string[] = [];
//   for (const card of cards) {
//     const blockCard = prismaToBlock(card) as Card;
//     const personPropertyId = boardBlocksPersonPropertyRecord[card.parentId];
//     const personPropertyValue = personPropertyId ? blockCard.fields.properties[personPropertyId] ?? [] : [];
//     const space = spaceRecord[card.spaceId];
//     if (space && card.page && (personPropertyValue as string[]).includes(userId) && userId !== card.user.id) {
//       discussionUserIds.push(personPropertyId);
//       // Need to push author of card to fetch information
//       discussionUserIds.push(card.user.id);
//       mentions.push({
//         pageId: card.page.id,
//         spaceId: card.spaceId,
//         spaceDomain: space.domain,
//         pagePath: card.page.path,
//         spaceName: space.name,
//         pageTitle: card.page.title || 'Untitled',
//         bountyId: card.page.bountyId,
//         bountyTitle: card.page.title,
//         type: card.page.bountyId ? 'bounty' : 'page',
//         mentionId: null,
//         taskId: `${card.id}.${personPropertyId}`,
//         // Fake value
//         createdAt: new Date().toString(),
//         userId: card.createdBy,
//         text: `${card.user.username} assigned you in the card ${card.page.title || 'Untitled'}`,
//         commentId: null
//       });
//     }
//   }

//   return {
//     mentions,
//     discussionUserIds,
//     comments: []
//   };
// }

// utils
function sortByDate<T extends { createdAt: string | Date }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
