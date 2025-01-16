/* eslint-disable no-continue */
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/utils/types';
import { getPermissionsClient } from '@root/lib/permissions/api';
import { permissionsApiClient } from '@root/lib/permissions/api/client';
import type { UserMentionMetadata } from '@root/lib/prosemirror/extractMentions';
import { extractMentions } from '@root/lib/prosemirror/extractMentions';
import type { PageContent } from '@root/lib/prosemirror/interfaces';
import type { ThreadAccessGroup } from '@root/lib/threads';
import type { WebhookEvent } from '@root/lib/webhookPublisher/interfaces';
import { WebhookEventNames } from '@root/lib/webhookPublisher/interfaces';

import { saveDocumentNotification } from '../saveNotification';

async function getUserIdsFromRole({ roleId, spaceId }: { spaceId: string; roleId: string }) {
  if (roleId === 'everyone' || roleId === 'admin') {
    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId,
        isAdmin: roleId === 'admin' ? true : undefined
      },
      select: {
        user: {
          select: {
            id: true
          }
        }
      }
    });

    return spaceRoles.map((spaceRole) => spaceRole.user.id);
  }

  const role = await prisma.role.findFirstOrThrow({
    where: {
      id: roleId
    },
    select: {
      spaceRolesToRole: {
        select: {
          spaceRole: {
            select: {
              user: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      }
    }
  });

  return role.spaceRolesToRole.map(({ spaceRole }) => spaceRole.user.id);
}

async function getUserIdsFromMentionNode({
  group,
  value,
  spaceId
}: {
  spaceId: string;
  group: 'role' | 'user';
  value: string;
}): Promise<string[]> {
  const targetUserIds: string[] = [];

  if (group === 'role') {
    return getUserIdsFromRole({ roleId: value, spaceId });
  }

  if (group === 'user') {
    targetUserIds.push(value);
  }

  return targetUserIds;
}

export async function createDocumentNotifications(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}): Promise<string[]> {
  const ids: string[] = [];
  switch (webhookData.event.scope) {
    case WebhookEventNames.DocumentMentionCreated: {
      const mentionId = webhookData.event.mention.id;
      const mentionAuthorId = webhookData.event.user.id;
      const pageId = webhookData.event.document?.id;
      const postId = webhookData.event.post?.id;
      let targetMention: UserMentionMetadata | undefined;
      if (webhookData.event.document) {
        const document = await prisma.page.findUniqueOrThrow({
          where: {
            id: pageId
          },
          select: {
            content: true
          }
        });
        const documentContent = document.content as PageContent;
        targetMention = extractMentions(documentContent).find((mention) => mention.id === mentionId);
      } else if (webhookData.event.post) {
        const post = await prisma.post.findUniqueOrThrow({
          where: {
            id: postId
          },
          select: {
            content: true,
            categoryId: true
          }
        });
        const postContent = post.content as PageContent;
        targetMention = extractMentions(postContent).find((mention) => mention.id === mentionId);
      }

      if (!targetMention) {
        log.warn('Ignore user mention - could not find it in the doc', {
          pageId,
          postId,
          mentionAuthorId,
          targetMention
        });
        break;
      }

      const targetUserIds = (
        await getUserIdsFromMentionNode({
          group: targetMention.type,
          value: targetMention.value,
          spaceId: webhookData.spaceId
        })
      ).filter((userId) => userId !== mentionAuthorId);

      const permissionsClient = await getPermissionsClient({
        resourceId: webhookData.spaceId,
        resourceIdType: 'space'
      });

      for (const targetUserId of targetUserIds) {
        let hasReadPermission = false;
        if (pageId) {
          const pagePermission = await permissionsApiClient.pages.computePagePermissions({
            resourceId: pageId,
            userId: targetUserId
          });

          hasReadPermission = pagePermission.read;
        } else if (postId) {
          const postPermission = await permissionsClient.client.forum.computePostPermissions({
            resourceId: postId,
            userId: targetUserId
          });

          hasReadPermission = postPermission.view_post;
        }

        if (!hasReadPermission) {
          continue;
        }

        const { id } = await saveDocumentNotification({
          type: 'mention.created',
          createdAt: webhookData.createdAt,
          createdBy: mentionAuthorId,
          mentionId,
          pageId,
          postId,
          spaceId: webhookData.spaceId,
          userId: targetUserId,
          content: targetMention.parentNode ?? null
        });
        ids.push(id);
      }
      break;
    }

    case WebhookEventNames.DocumentInlineCommentCreated: {
      const data = webhookData.event;
      const spaceId = data.space.id;
      const inlineCommentId = data.inlineComment.id;
      const inlineCommentAuthorId = data.inlineComment.author.id;
      const inlineComment = await prisma.comment.findFirstOrThrow({
        where: {
          id: inlineCommentId
        },
        select: {
          content: true,
          threadId: true,
          thread: {
            select: {
              accessGroups: true
            }
          }
        }
      });
      const threadAccessGroups = inlineComment.thread.accessGroups as unknown as ThreadAccessGroup[];
      const threadId = inlineComment.threadId;
      const inlineCommentContent = inlineComment.content as PageContent;
      const previousInlineComment = await prisma.comment.findFirst({
        where: {
          threadId
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: 1,
        take: 1,
        select: {
          id: true,
          userId: true
        }
      });

      const notificationTargetUserIds =
        threadAccessGroups.length === 0 ? data.document.authors.map((author) => author.id) : [];

      // Get all the users that have access to the thread
      for (const threadAccessGroup of threadAccessGroups) {
        const accessGroupsUserIds = (
          await getUserIdsFromMentionNode({
            group: threadAccessGroup.group,
            value: threadAccessGroup.id,
            spaceId
          })
        ).filter((userId) => userId !== inlineCommentAuthorId);

        accessGroupsUserIds.forEach((userId) => {
          notificationTargetUserIds.push(userId);
        });
      }

      const pageId = data.document.id;
      const notificationSentUserIds: Set<string> = new Set();
      if (
        previousInlineComment &&
        previousInlineComment?.id !== inlineCommentId &&
        previousInlineComment.userId !== inlineCommentAuthorId
      ) {
        const { id } = await saveDocumentNotification({
          type: 'inline_comment.replied',
          createdAt: webhookData.createdAt,
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId: previousInlineComment.userId,
          content: inlineCommentContent
        });
        ids.push(id);
        notificationSentUserIds.add(previousInlineComment.userId);
      }

      for (const userId of new Set(notificationTargetUserIds)) {
        if (
          notificationSentUserIds.has(userId) ||
          userId === inlineCommentAuthorId ||
          previousInlineComment?.userId === userId
        ) {
          continue;
        }

        const pagePermission = await permissionsApiClient.pages.computePagePermissions({
          resourceId: pageId,
          userId
        });

        if (!pagePermission.read) {
          continue;
        }

        const { id } = await saveDocumentNotification({
          type: 'inline_comment.created',
          createdAt: webhookData.createdAt,
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId,
          content: inlineCommentContent
        });
        ids.push(id);
        notificationSentUserIds.add(userId);
      }

      const extractedMentions = extractMentions(inlineCommentContent);

      for (const extractedMention of extractedMentions) {
        const targetUserIds = (
          await getUserIdsFromMentionNode({
            group: extractedMention.type,
            value: extractedMention.value,
            spaceId: webhookData.spaceId
          })
        ).filter((userId) => userId !== inlineCommentAuthorId);

        for (const targetUserId of targetUserIds) {
          if (notificationSentUserIds.has(targetUserId)) {
            continue;
          }

          const pagePermission = await permissionsApiClient.pages.computePagePermissions({
            resourceId: pageId,
            userId: targetUserId
          });

          if (!pagePermission.read) {
            continue;
          }

          const { id } = await saveDocumentNotification({
            type: 'inline_comment.mention.created',
            createdAt: webhookData.createdAt,
            createdBy: inlineCommentAuthorId,
            mentionId: extractedMention.id,
            pageId,
            spaceId,
            userId: targetUserId,
            content: extractedMention.parentNode ?? null,
            inlineCommentId
          });
          ids.push(id);
          notificationSentUserIds.add(targetUserId);
        }
      }

      break;
    }

    case WebhookEventNames.DocumentCommentCreated: {
      const spaceId = webhookData.spaceId;
      const commentAuthorId = webhookData.event.comment.author.id;
      const commentId = webhookData.event.comment.id;
      const authorIds = webhookData.event.post
        ? [webhookData.event.post.author.id]
        : (webhookData.event.document?.authors.map(({ id }) => id) ?? []);
      const documentId = webhookData.event.document?.id;
      const postId = webhookData.event.post?.id;
      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          domain: true
        }
      });

      const comment = webhookData.event.post
        ? await prisma.postComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true
            }
          })
        : await prisma.pageComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true
            }
          });

      const notificationSentUserIds: Set<string> = new Set();

      // Send notification only for top-level comments
      if (!comment.parentId) {
        for (const authorId of authorIds) {
          if (authorId !== commentAuthorId) {
            const { id } = await saveDocumentNotification({
              type: 'comment.created',
              createdAt: webhookData.createdAt,
              createdBy: commentAuthorId,
              commentId,
              pageId: documentId,
              postId,
              spaceId,
              pageCommentId: documentId ? commentId : undefined,
              postCommentId: postId ? commentId : undefined,
              userId: authorId,
              content: comment.content
            });
            ids.push(id);
            notificationSentUserIds.add(authorId);
          }
        }
      } else {
        const parentComment = webhookData.event.post
          ? await prisma.postComment.findUniqueOrThrow({
              where: {
                id: comment.parentId
              },
              select: {
                createdBy: true
              }
            })
          : await prisma.pageComment.findUniqueOrThrow({
              where: {
                id: comment.parentId
              },
              select: {
                createdBy: true
              }
            });

        const parentCommentAuthorId = parentComment.createdBy;
        if (parentCommentAuthorId !== commentAuthorId) {
          const { id } = await saveDocumentNotification({
            type: 'comment.replied',
            createdAt: webhookData.createdAt,
            createdBy: commentAuthorId,
            commentId,
            pageId: documentId,
            postId,
            spaceId,
            pageCommentId: documentId ? commentId : undefined,
            postCommentId: postId ? commentId : undefined,
            userId: parentCommentAuthorId,
            content: comment.content
          });
          ids.push(id);
          notificationSentUserIds.add(parentCommentAuthorId);
        }
      }

      const commentContent = comment.content as PageContent;

      const extractedMentions = extractMentions(commentContent);

      const permissionsClient = await getPermissionsClient({
        resourceId: webhookData.spaceId,
        resourceIdType: 'space'
      });

      for (const extractedMention of extractedMentions) {
        const targetUserIds = (
          await getUserIdsFromMentionNode({
            group: extractedMention.type,
            value: extractedMention.value,
            spaceId: webhookData.spaceId
          })
        ).filter((userId) => userId !== commentAuthorId);

        for (const targetUserId of targetUserIds) {
          if (notificationSentUserIds.has(targetUserId)) {
            continue;
          }

          let hasReadPermission = false;
          if (documentId) {
            const pagePermission = await permissionsApiClient.pages.computePagePermissions({
              resourceId: documentId,
              userId: targetUserId
            });

            hasReadPermission = pagePermission.read;
          } else if (postId) {
            const postPermission = await permissionsClient.client.forum.computePostPermissions({
              resourceId: postId,
              userId: targetUserId
            });

            hasReadPermission = postPermission.view_post;
          }

          if (!hasReadPermission) {
            continue;
          }

          const { id } = await saveDocumentNotification({
            type: 'comment.mention.created',
            createdAt: webhookData.createdAt,
            createdBy: commentAuthorId,
            mentionId: extractedMention.id,
            pageId: documentId,
            postId,
            spaceId,
            userId: targetUserId,
            content: extractedMention.parentNode ?? null,
            pageCommentId: documentId ? commentId : undefined,
            postCommentId: postId ? commentId : undefined,
            commentId
          });
          ids.push(id);
          notificationSentUserIds.add(targetUserId);
        }
      }

      const document = documentId
        ? await prisma.page.findUniqueOrThrow({
            where: {
              id: documentId
            },
            select: {
              type: true,
              proposalId: true,
              proposal: {
                select: {
                  id: true,
                  reviewers: {
                    where: {
                      userId: {
                        not: null
                      }
                    },
                    select: {
                      userId: true
                    }
                  }
                }
              }
            }
          })
        : null;

      const proposalId = document?.type === 'proposal' ? document?.proposal?.id : null;
      const proposalReviewerUserIds = Array.from(
        new Set(document?.proposal?.reviewers.map((reviewer) => reviewer.userId).filter(isTruthy) ?? [])
      ).filter((userId) => userId !== commentAuthorId && !notificationSentUserIds.has(userId));

      if (documentId && proposalId && proposalReviewerUserIds.length) {
        for (const userId of proposalReviewerUserIds) {
          const proposalPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
            resourceId: proposalId,
            userId
          });

          if (proposalPermissions.evaluate || proposalPermissions.evaluate_appeal || proposalPermissions.view) {
            const { id } = await saveDocumentNotification({
              type: 'comment.created',
              createdAt: webhookData.createdAt,
              createdBy: commentAuthorId,
              commentId,
              pageId: documentId,
              spaceId,
              userId,
              content: comment.content
            });

            ids.push(id);
            notificationSentUserIds.add(userId);
          }
        }
      }

      break;
    }

    case WebhookEventNames.DocumentApplicationCommentCreated: {
      const spaceId = webhookData.spaceId;
      const applicationCommentAuthorId = webhookData.event.applicationComment.author.id;
      const applicationCommentId = webhookData.event.applicationComment.id;
      const documentId = webhookData.event.document.id;

      const applicationComment = await prisma.applicationComment.findFirstOrThrow({
        where: {
          id: applicationCommentId
        },
        select: {
          parentId: true,
          content: true,
          application: {
            select: {
              createdBy: true
            }
          }
        }
      });

      const applicationAuthorId = applicationComment.application.createdBy;
      const applicationCommentContent = applicationComment.content as PageContent;

      const reward = await prisma.bounty.findFirstOrThrow({
        where: {
          page: {
            id: documentId
          }
        },
        select: {
          permissions: {
            select: {
              roleId: true,
              userId: true,
              permissionLevel: true
            }
          }
        }
      });

      const notificationSentUserIds: Set<string> = new Set();
      const notificationTargetUserIds: string[] = [applicationAuthorId];
      const reviewerPermissions = reward.permissions.filter((permission) => permission.permissionLevel === 'reviewer');
      for (const permission of reviewerPermissions) {
        if (permission.userId) {
          notificationTargetUserIds.push(permission.userId);
        } else if (permission.roleId) {
          const userIds = await getUserIdsFromRole({
            roleId: permission.roleId,
            spaceId
          });
          notificationTargetUserIds.push(...userIds);
        }
      }

      // Send notification only for top-level comments
      if (!applicationComment.parentId) {
        for (const targetUserId of notificationTargetUserIds) {
          if (targetUserId !== applicationCommentAuthorId && !notificationSentUserIds.has(targetUserId)) {
            const { id } = await saveDocumentNotification({
              type: 'application_comment.created',
              createdAt: webhookData.createdAt,
              createdBy: applicationCommentAuthorId,
              applicationCommentId,
              pageId: documentId,
              spaceId,
              userId: targetUserId,
              content: applicationCommentContent
            });
            ids.push(id);
            notificationSentUserIds.add(targetUserId);
          }
        }
      } else {
        const parentApplicationComment = await prisma.applicationComment.findUniqueOrThrow({
          where: {
            id: applicationComment.parentId
          },
          select: {
            createdBy: true
          }
        });

        const parentApplicationCommentAuthorId = parentApplicationComment.createdBy;

        if (parentApplicationCommentAuthorId !== applicationCommentAuthorId) {
          const { id } = await saveDocumentNotification({
            type: 'application_comment.replied',
            createdAt: webhookData.createdAt,
            createdBy: applicationCommentAuthorId,
            applicationCommentId,
            spaceId,
            pageId: documentId,
            userId: parentApplicationCommentAuthorId,
            content: applicationCommentContent
          });
          ids.push(id);
          notificationSentUserIds.add(parentApplicationCommentAuthorId);
        }
      }

      const extractedMentions = extractMentions(applicationCommentContent);

      const permissionsClient = await getPermissionsClient({
        resourceId: webhookData.spaceId,
        resourceIdType: 'space'
      });

      for (const extractedMention of extractedMentions) {
        const targetUserIds = (
          await getUserIdsFromMentionNode({
            group: extractedMention.type,
            value: extractedMention.value,
            spaceId: webhookData.spaceId
          })
        ).filter((userId) => userId !== applicationCommentAuthorId);

        for (const targetUserId of targetUserIds) {
          if (notificationSentUserIds.has(targetUserId)) {
            continue;
          }

          const pagePermission = await permissionsApiClient.pages.computePagePermissions({
            resourceId: documentId,
            userId: targetUserId
          });

          const hasReadPermission = pagePermission.read;

          if (!hasReadPermission) {
            continue;
          }

          const { id } = await saveDocumentNotification({
            type: 'application_comment.mention.created',
            createdAt: webhookData.createdAt,
            createdBy: applicationCommentAuthorId,
            mentionId: extractedMention.id,
            pageId: documentId,
            spaceId,
            userId: targetUserId,
            content: extractedMention.parentNode ?? null,
            applicationCommentId
          });
          ids.push(id);
          notificationSentUserIds.add(targetUserId);
        }
      }

      break;
    }

    default:
      break;
  }
  return ids;
}
