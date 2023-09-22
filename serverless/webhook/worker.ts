import { log } from '@charmverse/core/log';
import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';

import { getPostCategoriesUsersRecord } from 'lib/forums/categories/getPostCategoriesUsersRecord';
import {
  createPageNotification,
  createPostNotification,
  createVoteNotification
} from 'lib/notifications/createNotification';
import { getPermissionsClient } from 'lib/permissions/api';
import { publicPermissionsClient } from 'lib/permissions/api/client';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { getProposalAction } from 'lib/proposal/getProposalAction';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { signJwt } from 'lib/webhookPublisher/authentication';
import { WebhookEventNames, type WebhookPayload } from 'lib/webhookPublisher/interfaces';

/**
 * SQS worker, message are executed one by one
 */
export const webhookWorker = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  // Store failed messageIDs
  const batchItemFailures: SQSBatchItemFailure[] = [];

  log.debug('Webhook worker initiated');

  // Execute messages
  await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      const body = record.body;

      try {
        // Gets message information
        const { webhookURL, signingSecret, ...webhookData } = JSON.parse(body) as WebhookPayload;

        switch (webhookData.event.scope) {
          case WebhookEventNames.PageMentionCreated: {
            const mentionedUserId = webhookData.event.mention.value;
            const mentionAuthorId = webhookData.event.user.id;

            await createPageNotification({
              type: 'mention.created',
              createdBy: mentionAuthorId,
              mentionId: webhookData.event.mention.id,
              pageId: webhookData.event.page.id,
              spaceId: webhookData.spaceId,
              userId: mentionedUserId
            });

            break;
          }

          case WebhookEventNames.PageInlineCommentCreated: {
            const pageAuthorId = webhookData.event.page.author.id;
            const pageId = webhookData.event.page.id;
            const spaceId = webhookData.spaceId;
            const inlineCommentId = webhookData.event.inlineComment.id;
            const inlineCommentAuthorId = webhookData.event.inlineComment.author.id;
            const inlineComment = await prisma.comment.findFirstOrThrow({
              where: {
                id: inlineCommentId
              },
              select: {
                content: true,
                threadId: true
              }
            });
            const threadId = inlineComment.threadId;
            const inlineCommentContent = inlineComment.content as PageContent;
            if (inlineCommentAuthorId !== pageAuthorId) {
              await createPageNotification({
                type: 'inline_comment.created',
                createdBy: inlineCommentAuthorId,
                inlineCommentId,
                pageId,
                spaceId,
                userId: pageAuthorId
              });
            }

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

            if (previousInlineComment && previousInlineComment?.id !== inlineCommentId) {
              await createPageNotification({
                type: 'inline_comment.replied',
                createdBy: inlineCommentAuthorId,
                inlineCommentId,
                pageId,
                spaceId,
                userId: previousInlineComment.userId
              });
            }

            const extractedMentions = extractMentions(inlineCommentContent);
            for (const extractedMention of extractedMentions) {
              const mentionedUserId = extractedMention.value;
              if (mentionedUserId !== inlineCommentAuthorId) {
                await createPageNotification({
                  type: 'inline_comment.mention.created',
                  createdBy: inlineCommentAuthorId,
                  inlineCommentId,
                  mentionId: extractedMention.id,
                  pageId,
                  spaceId,
                  userId: mentionedUserId
                });
              }
            }

            break;
          }

          case WebhookEventNames.PageCommentCreated: {
            const pageAuthorId = webhookData.event.page.author.id;
            const pageId = webhookData.event.page.id;
            const spaceId = webhookData.spaceId;
            const commentId = webhookData.event.comment.id;
            const commentAuthorId = webhookData.event.comment.author.id;
            const comment = await prisma.pageComment.findFirstOrThrow({
              where: {
                id: commentId
              },
              select: {
                content: true,
                parentId: true
              }
            });
            const commentParentId = comment.parentId;
            const commentContent = comment.content as PageContent;
            if (commentAuthorId !== pageAuthorId) {
              await createPageNotification({
                type: 'comment.created',
                commentId,
                createdBy: commentAuthorId,
                pageId,
                spaceId,
                userId: pageAuthorId
              });
            }

            if (commentParentId) {
              const parentComment = await prisma.pageComment.findFirstOrThrow({
                where: {
                  parentId: commentParentId
                },
                select: {
                  createdBy: true
                }
              });

              await createPageNotification({
                type: 'comment.replied',
                commentId,
                createdBy: commentAuthorId,
                pageId,
                spaceId,
                userId: parentComment.createdBy
              });
            }

            const extractedMentions = extractMentions(commentContent);
            for (const extractedMention of extractedMentions) {
              const mentionedUserId = extractedMention.value;
              if (mentionedUserId !== commentAuthorId) {
                await createPageNotification({
                  type: 'comment.mention.created',
                  commentId,
                  createdBy: commentAuthorId,
                  mentionId: extractedMention.id,
                  pageId,
                  spaceId,
                  userId: mentionedUserId
                });
              }
            }

            break;
          }

          case WebhookEventNames.ForumPostCreated: {
            const spaceId = webhookData.spaceId;
            const postId = webhookData.event.post.id;
            const post = await prisma.post.findFirstOrThrow({
              where: {
                id: postId
              },
              select: {
                category: {
                  select: {
                    id: true
                  }
                },
                author: {
                  select: {
                    id: true
                  }
                },
                content: true,
                id: true
              }
            });
            const postAuthorId = post.author.id;
            const postCategoriesUsersRecord = await getPostCategoriesUsersRecord({
              spaceId
            });
            const extractedMentions = extractMentions(post.content as PageContent);
            const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);
            for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
              const userId = postCategoriesUserRecord.userId;
              const userMentions = extractedMentions.filter((mention) => mention.value === userId);
              if (
                postCategoriesUserRecord.visibleCategoryIds.includes(post.category.id) &&
                postCategoriesUserRecord.subscriptions[post.category.id]
              ) {
                await createPostNotification({
                  createdBy: postAuthorId,
                  postId,
                  spaceId,
                  userId,
                  type: 'post.created'
                });

                for (const userMention of userMentions) {
                  await createPostNotification({
                    createdBy: post.author.id,
                    mentionId: userMention.id,
                    postId,
                    spaceId,
                    userId,
                    type: 'post.mention.created'
                  });
                }
              }
            }
            break;
          }

          case WebhookEventNames.ForumCommentCreated: {
            const spaceId = webhookData.spaceId;
            const postComment = await prisma.postComment.findFirstOrThrow({
              where: {
                id: webhookData.event.comment.id
              },
              select: {
                parentId: true,
                id: true,
                createdBy: true,
                content: true,
                post: {
                  select: {
                    id: true,
                    createdBy: true
                  }
                }
              }
            });
            const postAuthor = postComment.post.createdBy;
            const postCommentContent = postComment.content as PageContent;
            const postCommentAuthor = postComment.createdBy;
            const postId = postComment.post.id;
            const postCategoriesUsersRecord = await getPostCategoriesUsersRecord({
              spaceId
            });
            const extractedMentions = extractMentions(postCommentContent);
            const postCategoriesUsersRecords = Object.values(postCategoriesUsersRecord);
            for (const postCategoriesUserRecord of postCategoriesUsersRecords) {
              const userMentions = extractedMentions.filter(
                (mention) => mention.value === postCategoriesUserRecord.userId
              );
              for (const userMention of userMentions) {
                await createPostNotification({
                  commentId: postComment.id,
                  createdBy: postComment.createdBy,
                  mentionId: userMention.id,
                  postId,
                  spaceId,
                  userId: postCategoriesUserRecord.userId,
                  type: 'post.comment.mention.created'
                });
              }
            }

            const parentId = postComment.parentId;
            if (!parentId && postCommentAuthor !== postAuthor) {
              await createPostNotification({
                commentId: postComment.id,
                createdBy: postComment.createdBy,
                postId,
                spaceId,
                userId: postAuthor,
                type: 'post.comment.created'
              });
            }

            if (parentId) {
              const parentComment = await prisma.postComment.findUniqueOrThrow({
                where: {
                  id: parentId
                },
                select: {
                  createdBy: true
                }
              });
              const parentCommentAuthor = parentComment.createdBy;
              await createPostNotification({
                commentId: postComment.id,
                createdBy: postComment.createdBy,
                postId,
                spaceId,
                userId: parentCommentAuthor,
                type: 'post.comment.replied'
              });
            }

            break;
          }

          case WebhookEventNames.ProposalStatusChanged: {
            const userId = webhookData.event.user.id;
            const spaceId = webhookData.spaceId;
            const proposalId = webhookData.event.proposal.id;
            const newStatus = webhookData.event.newStatus;
            if (newStatus === 'draft') {
              return;
            }

            const spaceRole = await prisma.spaceRole.findFirstOrThrow({
              where: {
                userId,
                spaceId
              },
              select: {
                spaceId: true,
                space: {
                  select: {
                    domain: true,
                    name: true,
                    paidTier: true,
                    notifyNewProposals: true
                  }
                },
                spaceRoleToRole: {
                  where: {
                    spaceRole: {
                      userId
                    }
                  },
                  select: {
                    role: {
                      select: {
                        id: true
                      }
                    }
                  }
                }
              }
            });

            // We should not send role-based notifications for free spaces
            const roleIds =
              spaceRole.space.paidTier === 'free' ? [] : spaceRole.spaceRoleToRole.map(({ role }) => role.id);
            const spacePermissionsClient = await getPermissionsClient({
              resourceId: spaceId,
              resourceIdType: 'space'
            });
            const accessibleProposalCategories =
              await spacePermissionsClient.client.proposals.getAccessibleProposalCategories({
                spaceId,
                userId
              });

            const accessibleProposalCategoryIds = accessibleProposalCategories.map(({ id }) => id);

            const categoryMap = accessibleProposalCategories.reduce((map, category) => {
              map.set(category.id, category);
              return map;
            }, new Map<string, ProposalCategoryWithPermissions>());

            const proposal = await prisma.proposal.findUnique({
              where: {
                archived: false,
                id: proposalId,
                status: {
                  in: ['discussion', 'review', 'reviewed', 'vote_active', 'evaluation_active', 'evaluation_closed']
                },
                OR: [
                  {
                    categoryId: {
                      in: accessibleProposalCategoryIds
                    }
                  },
                  {
                    createdBy: userId
                  },
                  {
                    authors: {
                      some: {
                        userId
                      }
                    }
                  },
                  {
                    reviewers: {
                      some: {
                        userId
                      }
                    }
                  },
                  {
                    reviewers: {
                      some: {
                        roleId: {
                          in: roleIds
                        }
                      }
                    }
                  }
                ]
              },
              include: {
                space: {
                  select: {
                    notifyNewProposals: true,
                    domain: true,
                    name: true
                  }
                },
                authors: true,
                reviewers: true,
                page: {
                  select: {
                    id: true,
                    path: true,
                    title: true,
                    deletedAt: true
                  }
                }
              }
            });

            if (!proposal || proposal.page?.deletedAt) {
              return;
            }

            const isAuthor = proposal.authors.some((author) => author.userId === userId);
            const isReviewer = proposal.reviewers.some((reviewer) =>
              reviewer.roleId ? roleIds.includes(reviewer.roleId) : reviewer.userId === userId
            );

            const notifyNewProposals = proposal.space.notifyNewProposals;

            // Check notifications are enabled for space-wide proposal notifications
            const notifyNewEvents = Boolean(notifyNewProposals && notifyNewProposals < new Date(webhookData.createdAt));

            const action = getProposalAction({
              currentStatus: proposal.status,
              isAuthor,
              isReviewer,
              notifyNewEvents
            });

            if (!action) {
              return;
            }

            // check category permissions
            const category = proposal.categoryId && categoryMap.get(proposal.categoryId);
            if (
              category &&
              ((action === 'discuss' && !category.permissions.comment_proposals) ||
                (action === 'vote' && !category.permissions.vote_proposals))
            ) {
              return;
            }

            break;
          }

          case WebhookEventNames.VoteCreated: {
            const voteId = webhookData.event.vote.id;
            const vote = await prisma.vote.findUnique({
              where: {
                id: voteId,
                status: 'InProgress'
              },
              include: {
                page: {
                  select: { id: true, path: true, title: true }
                },
                post: {
                  include: { category: true }
                },
                space: {
                  select: {
                    id: true,
                    name: true,
                    domain: true,
                    paidTier: true
                  }
                },
                userVotes: true,
                voteOptions: true,
                author: true
              }
            });

            if (!vote) {
              return;
            }

            const spaceId = vote.space.id;
            const spaceRoles = await prisma.spaceRole.findMany({
              where: {
                spaceId
              },
              select: {
                id: true,
                userId: true
              }
            });

            const spaceUserIds = spaceRoles.map(({ userId }) => userId).filter((userId) => userId !== vote.author.id);

            if (vote.page) {
              for (const spaceUserId of spaceUserIds) {
                const pagePermission =
                  vote.space.paidTier === 'free'
                    ? await publicPermissionsClient.pages.computePagePermissions({
                        resourceId: vote.page.id,
                        userId: spaceUserId
                      })
                    : await premiumPermissionsApiClient.pages.computePagePermissions({
                        resourceId: vote.page.id,
                        userId: spaceUserId
                      });
                if (pagePermission.comment) {
                  await createVoteNotification({
                    createdBy: vote.author.id,
                    spaceId,
                    type: 'vote.created',
                    userId: spaceUserId,
                    voteId
                  });
                }
              }
            } else if (vote.post) {
              for (const spaceUserId of spaceUserIds) {
                const commentablePostCategory =
                  vote.space.paidTier === 'free'
                    ? await publicPermissionsClient.forum.getPermissionedCategories({
                        postCategories: [vote.post.category],
                        userId: spaceUserId
                      })
                    : await premiumPermissionsApiClient.forum.getPermissionedCategories({
                        postCategories: [vote.post.category],
                        userId: spaceUserId
                      });

                if (commentablePostCategory[0].permissions.comment_posts) {
                  await createVoteNotification({
                    createdBy: vote.author.id,
                    spaceId,
                    type: 'vote.created',
                    userId: spaceUserId,
                    voteId
                  });
                }
              }
            }

            break;
          }

          default:
            break;
        }

        if (webhookURL && signingSecret) {
          const secret = Buffer.from(signingSecret, 'hex');

          const signedJWT = await signJwt('webhook', webhookData, secret);

          // Call their endpoint with the event's data
          const response = await fetch(webhookURL, {
            method: 'POST',
            body: JSON.stringify(webhookData),
            headers: {
              Signature: signedJWT
            }
          });

          log.debug('Webhook call response', response);

          // If not 200 back, we throw an error
          if (response.status !== 200) {
            // Add messageID to failed message array
            batchItemFailures.push({ itemIdentifier: record.messageId });

            // Throw the error so we can log it for debugging
            throw new Error(`Expect error 200 back. Received: ${response.status}`);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        log.error(`Error in processing SQS Worker`, { body, error: e, record });

        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    })
  );

  // Return failed events so they can be retried
  return {
    batchItemFailures
  };
};
