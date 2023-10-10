/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';
import { DOMParser, DOMSerializer } from 'prosemirror-model';

import { getBountyReviewerIds } from 'lib/bounties/getBountyReviewerIds';
import { getPostCategoriesUsersRecord } from 'lib/forums/categories/getPostCategoriesUsersRecord';
import { getPermissionsClient } from 'lib/permissions/api';
import { publicPermissionsClient } from 'lib/permissions/api/client';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import { getProposalAction } from 'lib/proposal/getProposalAction';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { WebhookEvent } from 'lib/webhookPublisher/interfaces';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';

import {
  createDocumentNotification,
  createCardNotification,
  createBountyNotification,
  createPostNotification,
  createProposalNotification,
  createVoteNotification
} from './createNotification';

function convertDocumentToText(content: PageContent) {
  let text = '';

  function recurse(node: PageContent) {
    if (node.content) {
      node.content.forEach((childNode) => {
        recurse(childNode);
      });
    }

    if (node.text) {
      text += node.text;
    }
  }

  recurse(content);

  return text;
}

export async function createNotificationsFromEvent(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
  switch (webhookData.event.scope) {
    case WebhookEventNames.DocumentMentionCreated: {
      const mentionedUserId = webhookData.event.mention.value;
      const mentionAuthorId = webhookData.event.user.id;
      const mentionId = webhookData.event.mention.id;
      const documentId = webhookData.event.document.id;

      const document = await prisma.page.findUniqueOrThrow({
        where: {
          id: documentId
        },
        select: {
          content: true
        }
      });

      const documentContent = document.content as PageContent;
      const extractedMentions = extractMentions(documentContent);
      const targetMention = extractedMentions.find((mention) => mention.id === mentionId);

      if (mentionedUserId !== mentionAuthorId && targetMention) {
        await createDocumentNotification({
          type: 'mention.created',
          createdBy: mentionAuthorId,
          mentionId: webhookData.event.mention.id,
          pageId: webhookData.event.document.id,
          spaceId: webhookData.spaceId,
          userId: mentionedUserId,
          text: targetMention.text
        });
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
          threadId: true
        }
      });
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
      const inlineCommentText = convertDocumentToText(inlineComment.content as PageContent);

      const authorIds = data.document.authors.map((author) => author.id);
      const pageId = data.document.id;
      if (
        previousInlineComment &&
        previousInlineComment?.id !== inlineCommentId &&
        previousInlineComment.userId !== inlineCommentAuthorId
      ) {
        await createDocumentNotification({
          type: 'inline_comment.replied',
          createdBy: inlineCommentAuthorId,
          inlineCommentId,
          pageId,
          spaceId,
          userId: previousInlineComment.userId,
          text: inlineCommentText
        });
      }

      for (const authorId of authorIds) {
        if (inlineCommentAuthorId !== authorId && previousInlineComment?.userId !== authorId) {
          await createDocumentNotification({
            type: 'inline_comment.created',
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            pageId,
            spaceId,
            userId: authorId,
            text: inlineCommentText
          });
        }
      }

      const extractedMentions = extractMentions(inlineCommentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        if (mentionedUserId !== inlineCommentAuthorId) {
          await createDocumentNotification({
            type: 'inline_comment.mention.created',
            createdBy: inlineCommentAuthorId,
            inlineCommentId,
            mentionId: extractedMention.id,
            pageId,
            spaceId,
            userId: mentionedUserId,
            text: extractedMention.text
          });
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
        : webhookData.event.document?.authors.map(({ id }) => id) ?? [];
      const documentId = webhookData.event.document?.id;
      const postId = webhookData.event.post?.id;

      const comment = webhookData.event.post
        ? await prisma.postComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true,
              contentText: true
            }
          })
        : await prisma.pageComment.findFirstOrThrow({
            where: {
              id: commentId
            },
            select: {
              parentId: true,
              content: true,
              contentText: true
            }
          });

      // Send notification only for top-level comments
      if (!comment.parentId) {
        for (const authorId of authorIds) {
          if (authorId !== commentAuthorId) {
            await createDocumentNotification({
              type: 'comment.created',
              createdBy: commentAuthorId,
              commentId,
              pageId: documentId,
              postId,
              spaceId,
              pageCommentId: documentId ? commentId : undefined,
              postCommentId: postId ? commentId : undefined,
              userId: authorId,
              text: comment.contentText
            });
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
          await createDocumentNotification({
            type: 'comment.replied',
            createdBy: commentAuthorId,
            commentId,
            pageId: documentId,
            postId,
            spaceId,
            pageCommentId: documentId ? commentId : undefined,
            postCommentId: postId ? commentId : undefined,
            userId: parentCommentAuthorId,
            text: comment.contentText
          });
        }
      }

      const commentContent = comment.content as PageContent;

      const extractedMentions = extractMentions(commentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        await createDocumentNotification({
          type: 'comment.mention.created',
          createdBy: commentAuthorId,
          commentId,
          mentionId: extractedMention.id,
          pageId: documentId,
          postId,
          pageCommentId: documentId ? commentId : undefined,
          postCommentId: postId ? commentId : undefined,
          spaceId,
          userId: mentionedUserId,
          text: extractedMention.text
        });
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
        if (
          userId !== postAuthorId &&
          postCategoriesUserRecord.visibleCategoryIds.includes(post.category.id) &&
          postCategoriesUserRecord.subscriptions[post.category.id]
        ) {
          const userMentions = extractedMentions.filter((mention) => mention.value === userId);
          await createPostNotification({
            createdBy: postAuthorId,
            postId,
            spaceId,
            userId,
            type: 'created'
          });

          for (const userMention of userMentions) {
            await createDocumentNotification({
              createdBy: postAuthorId,
              mentionId: userMention.id,
              postId,
              spaceId,
              userId: userMention.value,
              type: 'mention.created',
              text: userMention.text
            });
          }
        }
      }
      break;
    }

    case WebhookEventNames.ProposalStatusChanged: {
      const userId = webhookData.event.user.id;
      const spaceId = webhookData.spaceId;
      const proposalId = webhookData.event.proposal.id;
      const newStatus = webhookData.event.newStatus;
      if (newStatus === 'draft') {
        break;
      }

      const proposal = await prisma.proposal.findUniqueOrThrow({
        where: {
          id: proposalId
        },
        select: {
          createdBy: true,
          categoryId: true,
          status: true,
          authors: {
            select: {
              userId: true
            }
          },
          reviewers: {
            select: {
              userId: true,
              role: {
                select: {
                  id: true
                }
              }
            }
          },
          page: {
            select: {
              deletedAt: true
            }
          }
        }
      });

      const isProposalDeleted = proposal.page?.deletedAt;
      if (isProposalDeleted) {
        break;
      }

      const proposalAuthorIds = proposal.authors.map(({ userId: authorId }) => authorId);
      const proposalReviewerIds = proposal.reviewers.map(({ userId: reviewerId }) => reviewerId);
      const proposalReviewerRoleIds = proposal.reviewers
        .map(({ role }) => role?.id)
        .filter((roleId) => roleId) as string[];

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          domain: true,
          name: true,
          paidTier: true,
          notifyNewProposals: true
        }
      });

      const notifyNewProposals = space.notifyNewProposals;

      const spaceRoles = await prisma.spaceRole.findMany({
        where: {
          spaceId
        },
        select: {
          userId: true,
          id: true,
          spaceRoleToRole: {
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

      const spacePermissionsClient = await getPermissionsClient({
        resourceId: spaceId,
        resourceIdType: 'space'
      });

      for (const spaceRole of spaceRoles) {
        // The user who triggered the event should not receive a notification
        if (spaceRole.userId === userId) {
          continue;
        }
        // We should not send role-based notifications for free spaces
        const roleIds = space.paidTier === 'free' ? [] : spaceRole.spaceRoleToRole.map(({ role }) => role.id);

        const accessibleProposalCategories =
          await spacePermissionsClient.client.proposals.getAccessibleProposalCategories({
            spaceId,
            userId
          });
        const accessibleProposalCategoryIds = accessibleProposalCategories.map(({ id }) => id);

        const isAuthor = proposalAuthorIds.includes(spaceRole.userId);
        const isReviewer = proposalReviewerIds.includes(spaceRole.userId);
        const isReviewerRole = proposalReviewerRoleIds.some((roleId) => roleIds.includes(roleId));
        const isProposalCategoryAccessible = proposal.categoryId
          ? accessibleProposalCategoryIds.includes(proposal.categoryId)
          : true;

        if (!isProposalCategoryAccessible) {
          continue;
        }
        const notifyNewEvents = Boolean(notifyNewProposals && notifyNewProposals < new Date(webhookData.createdAt));
        const action = getProposalAction({
          currentStatus: proposal.status,
          isAuthor,
          isReviewer: isReviewer || isReviewerRole,
          notifyNewEvents
        });

        if (!action) {
          continue;
        }

        const categoryPermission = accessibleProposalCategories.find(({ id }) => id === proposal.categoryId);

        if (
          categoryPermission &&
          ((action === 'start_discussion' && !categoryPermission.permissions.comment_proposals) ||
            (action === 'vote' && !categoryPermission.permissions.vote_proposals))
        ) {
          continue;
        }

        await createProposalNotification({
          createdBy: userId,
          proposalId,
          spaceId,
          userId: spaceRole.userId,
          type: action
        });
      }

      break;
    }

    case WebhookEventNames.VoteCreated: {
      const voteId = webhookData.event.vote.id;
      const vote = await prisma.vote.findUniqueOrThrow({
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
          if (pagePermission.comment && vote.author.id !== spaceUserId) {
            await createVoteNotification({
              createdBy: vote.author.id,
              spaceId,
              type: 'new_vote',
              userId: spaceUserId,
              voteId
            });
          }
        }
      } else if (vote.post) {
        for (const spaceUserId of spaceUserIds) {
          const categories =
            vote.space.paidTier === 'free'
              ? await publicPermissionsClient.forum.getPermissionedCategories({
                  postCategories: [vote.post.category],
                  userId: spaceUserId
                })
              : await premiumPermissionsApiClient.forum.getPermissionedCategories({
                  postCategories: [vote.post.category],
                  userId: spaceUserId
                });

          if (categories.length !== 0 && categories[0].permissions.comment_posts && vote.author.id !== spaceUserId) {
            await createVoteNotification({
              createdBy: vote.author.id,
              spaceId,
              type: 'new_vote',
              userId: spaceUserId,
              voteId
            });
          }
        }
      }

      break;
    }

    case WebhookEventNames.RewardApplicationCreated: {
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const applicationId = webhookData.event.application.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const bountyReviewerIds = await getBountyReviewerIds(bountyId);
      for (const bountyReviewerId of bountyReviewerIds) {
        if (application.createdBy !== bountyReviewerId) {
          await createBountyNotification({
            bountyId,
            createdBy: application.createdBy,
            spaceId,
            type: 'application.created',
            userId: bountyReviewerId,
            applicationId
          });
        }
      }

      break;
    }

    case WebhookEventNames.RewardApplicationApproved: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true,
          acceptedBy: true
        }
      });

      if (application.acceptedBy) {
        await createBountyNotification({
          bountyId,
          createdBy: application.acceptedBy,
          spaceId,
          type: 'application.approved',
          userId: application.createdBy,
          applicationId
        });
      }

      break;
    }

    case WebhookEventNames.RewardApplicationRejected: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const userId = webhookData.event.user.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      await createBountyNotification({
        bountyId,
        createdBy: userId,
        spaceId,
        type: 'application.rejected',
        userId: application.createdBy,
        applicationId
      });

      break;
    }

    case WebhookEventNames.RewardSubmissionCreated: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      const bountyReviewerIds = await getBountyReviewerIds(bountyId);

      for (const bountyReviewerId of bountyReviewerIds) {
        if (application.createdBy !== bountyReviewerId) {
          await createBountyNotification({
            bountyId,
            createdBy: application.createdBy,
            spaceId,
            type: 'submission.created',
            userId: bountyReviewerId,
            applicationId
          });
        }
      }

      break;
    }

    case WebhookEventNames.RewardSubmissionApproved: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const userId = webhookData.event.user.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      await createBountyNotification({
        bountyId,
        createdBy: userId,
        spaceId,
        type: 'submission.approved',
        userId: application.createdBy,
        applicationId
      });

      const bountyReviewerIds = await getBountyReviewerIds(bountyId);

      for (const bountyReviewerId of bountyReviewerIds) {
        if (userId !== bountyReviewerId) {
          await createBountyNotification({
            bountyId,
            createdBy: userId,
            spaceId,
            type: 'application.payment_pending',
            userId: bountyReviewerId,
            applicationId
          });
        }
      }

      break;
    }

    case WebhookEventNames.RewardApplicationPaymentCompleted: {
      const applicationId = webhookData.event.application.id;
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const userId = webhookData.event.user.id;

      const application = await prisma.application.findUniqueOrThrow({
        where: {
          id: applicationId
        },
        select: {
          createdBy: true
        }
      });

      await createBountyNotification({
        bountyId,
        createdBy: userId,
        spaceId,
        type: 'application.payment_completed',
        userId: application.createdBy,
        applicationId
      });

      break;
    }

    case WebhookEventNames.RewardSuggestionCreated: {
      const bountyId = webhookData.event.bounty.id;
      const spaceId = webhookData.spaceId;
      const spaceAdmins = await prisma.spaceRole.findMany({
        where: {
          spaceId,
          isAdmin: true
        },
        select: {
          userId: true
        }
      });

      const bounty = await prisma.bounty.findUniqueOrThrow({
        where: {
          id: bountyId
        },
        select: {
          createdBy: true
        }
      });

      const spaceAdminUserIds = spaceAdmins.map(({ userId }) => userId);

      for (const spaceAdminUserId of spaceAdminUserIds) {
        if (spaceAdminUserId !== bounty.createdBy) {
          await createBountyNotification({
            bountyId,
            createdBy: bounty.createdBy,
            spaceId,
            type: 'suggestion.created',
            userId: spaceAdminUserId
          });
        }
      }

      break;
    }

    case WebhookEventNames.CardPersonPropertyAssigned: {
      const spaceId = webhookData.spaceId;
      const assignedUserId = webhookData.event.assignedUser.id;
      const cardId = webhookData.event.card.id;

      if (webhookData.event.user.id !== assignedUserId) {
        await createCardNotification({
          type: 'person_assigned',
          personPropertyId: webhookData.event.personProperty.id,
          cardId,
          spaceId,
          userId: assignedUserId,
          createdBy: webhookData.event.user.id
        });
      }
      break;
    }

    default:
      break;
  }
}
