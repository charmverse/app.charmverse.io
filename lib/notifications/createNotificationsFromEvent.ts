/* eslint-disable no-continue */
import { prisma } from '@charmverse/core/prisma-client';

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

import { createInlineCommentNotification } from './createInlineCommentNotification';
import {
  createDocumentNotification,
  createCardNotification,
  createBountyNotification,
  createPostNotification,
  createProposalNotification,
  createVoteNotification
} from './createNotification';

export async function createNotificationsFromEvent(webhookData: {
  createdAt: string;
  event: WebhookEvent;
  spaceId: string;
}) {
  switch (webhookData.event.scope) {
    case WebhookEventNames.DocumentMentionCreated: {
      const mentionedUserId = webhookData.event.mention.value;
      const mentionAuthorId = webhookData.event.user.id;

      if (mentionedUserId !== mentionAuthorId) {
        await createDocumentNotification({
          type: 'mention.created',
          createdBy: mentionAuthorId,
          mentionId: webhookData.event.mention.id,
          pageId: webhookData.event.document.id,
          spaceId: webhookData.spaceId,
          userId: mentionedUserId
        });
      }

      break;
    }

    case WebhookEventNames.DocumentInlineCommentCreated: {
      await createInlineCommentNotification(webhookData.event);
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
          if (postAuthorId !== userId) {
            await createPostNotification({
              createdBy: postAuthorId,
              postId,
              spaceId,
              userId,
              type: 'created'
            });
          }

          for (const userMention of userMentions) {
            if (postAuthorId !== userMention.value) {
              await createPostNotification({
                createdBy: post.author.id,
                mentionId: userMention.id,
                postId,
                spaceId,
                userId,
                type: 'mention.created'
              });
            }
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
      const extractedMentions = extractMentions(postCommentContent);
      for (const userMention of extractedMentions) {
        if (userMention.value !== postCommentAuthor) {
          await createPostNotification({
            commentId: postComment.id,
            createdBy: postComment.createdBy,
            mentionId: userMention.id,
            postId,
            spaceId,
            userId: userMention.value,
            type: 'comment.mention.created'
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
          type: 'comment.created'
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
          type: 'comment.replied'
        });
      }

      break;
    }

    case WebhookEventNames.ProposalMentionCreated: {
      const mentionedUserId = webhookData.event.mention.value;
      const mentionAuthorId = webhookData.event.user.id;

      if (mentionedUserId !== mentionAuthorId) {
        await createProposalNotification({
          type: 'mention.created',
          createdBy: mentionAuthorId,
          mentionId: webhookData.event.mention.id,
          proposalId: webhookData.event.proposal.id,
          spaceId: webhookData.spaceId,
          userId: mentionedUserId
        });
      }

      break;
    }

    case WebhookEventNames.ProposalCommentCreated: {
      const spaceId = webhookData.spaceId;
      const commentAuthorId = webhookData.event.comment.author.id;
      const proposalId = webhookData.event.proposal.id;
      const commentId = webhookData.event.comment.id;
      const proposalAuthorIds = webhookData.event.proposal.authors.map(({ id }) => id);

      const pageComment = await prisma.pageComment.findFirstOrThrow({
        where: {
          id: commentId
        },
        select: {
          parentId: true,
          content: true
        }
      });

      // Send notification only for top-level comments
      if (!pageComment.parentId) {
        for (const proposalAuthorId of proposalAuthorIds) {
          if (proposalAuthorId !== commentAuthorId) {
            await createProposalNotification({
              type: 'comment.created',
              createdBy: commentAuthorId,
              commentId,
              proposalId,
              spaceId,
              userId: proposalAuthorId
            });
          }
        }
      } else {
        const parentComment = await prisma.pageComment.findUniqueOrThrow({
          where: {
            id: pageComment.parentId
          },
          select: {
            createdBy: true
          }
        });
        const parentCommentAuthorId = parentComment.createdBy;
        if (parentCommentAuthorId !== commentAuthorId) {
          await createProposalNotification({
            type: 'comment.replied',
            createdBy: commentAuthorId,
            commentId,
            proposalId,
            spaceId,
            userId: parentCommentAuthorId
          });
        }
      }

      const pageCommentContent = pageComment.content as PageContent;

      const extractedMentions = extractMentions(pageCommentContent);
      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        await createProposalNotification({
          type: 'comment.mention.created',
          createdBy: commentAuthorId,
          commentId,
          mentionId: extractedMention.id,
          proposalId,
          spaceId,
          userId: mentionedUserId
        });
      }

      break;
    }

    case WebhookEventNames.ProposalInlineCommentCreated: {
      await createInlineCommentNotification(webhookData.event);
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
        // We should not send role-based notifications for free spaces
        const roleIds = space.paidTier === 'free' ? [] : spaceRole.spaceRoleToRole.map(({ role }) => role.id);

        const accessibleProposalCategories =
          await spacePermissionsClient.client.proposals.getAccessibleProposalCategories({
            spaceId,
            userId
          });
        const accessibleProposalCategoryIds = accessibleProposalCategories.map(({ id }) => id);
        // The user who triggered the event should not receive a notification
        if (spaceRole.userId === userId) {
          continue;
        }

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
        break;
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

    case WebhookEventNames.BountyMentionCreated: {
      const mentionedUserId = webhookData.event.mention.value;
      const mentionAuthorId = webhookData.event.user.id;

      if (mentionedUserId !== mentionAuthorId) {
        await createBountyNotification({
          type: 'mention.created',
          createdBy: mentionAuthorId,
          mentionId: webhookData.event.mention.id,
          bountyId: webhookData.event.bounty.id,
          spaceId: webhookData.spaceId,
          userId: mentionedUserId
        });
      }

      break;
    }

    case WebhookEventNames.BountyInlineCommentCreated: {
      await createInlineCommentNotification(webhookData.event);
      break;
    }

    case WebhookEventNames.BountyApplicationCreated: {
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
        await createBountyNotification({
          bountyId,
          createdBy: application.createdBy,
          spaceId,
          type: 'application.pending',
          userId: bountyReviewerId,
          applicationId
        });
      }

      break;
    }

    case WebhookEventNames.BountyApplicationAccepted: {
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
          type: 'application.accepted',
          userId: application.createdBy,
          applicationId
        });
      }

      break;
    }

    case WebhookEventNames.BountyApplicationRejected: {
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

    case WebhookEventNames.BountyApplicationSubmitted: {
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
        await createBountyNotification({
          bountyId,
          createdBy: application.createdBy,
          spaceId,
          type: 'application.submitted',
          userId: bountyReviewerId,
          applicationId
        });
      }

      break;
    }

    case WebhookEventNames.BountyApplicationApproved: {
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
        type: 'application.approved',
        userId: application.createdBy,
        applicationId
      });

      const bountyReviewerIds = await getBountyReviewerIds(bountyId);

      for (const bountyReviewerId of bountyReviewerIds) {
        await createBountyNotification({
          bountyId,
          createdBy: userId,
          spaceId,
          type: 'application.payment_pending',
          userId: bountyReviewerId,
          applicationId
        });
      }

      break;
    }

    case WebhookEventNames.BountyApplicationPaymentCompleted: {
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

    case WebhookEventNames.BountySuggestionCreated: {
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
        await createBountyNotification({
          bountyId,
          createdBy: bounty.createdBy,
          spaceId,
          type: 'suggestion.created',
          userId: spaceAdminUserId
        });
      }

      break;
    }

    case WebhookEventNames.CardBlockCommentCreated: {
      const spaceId = webhookData.spaceId;
      const commentAuthorId = webhookData.event.blockComment.author.id;
      const cardId = webhookData.event.card.id;
      const blockCommentId = webhookData.event.blockComment.id;
      const cardAuthorId = webhookData.event.card.author.id;

      const blockComment = await prisma.block.findFirstOrThrow({
        where: {
          id: blockCommentId
        },
        select: {
          parentId: true,
          fields: true
        }
      });

      const blockCommentContent: PageContent = (blockComment.fields as any).content;

      const previousComment = await prisma.block.findFirst({
        where: {
          parentId: blockComment.parentId,
          type: 'comment'
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: 1,
        take: 1,
        select: {
          id: true,
          createdBy: true
        }
      });

      if (previousComment && previousComment.createdBy !== commentAuthorId && previousComment.id !== blockCommentId) {
        await createCardNotification({
          type: 'block_comment.replied',
          createdBy: commentAuthorId,
          cardId,
          spaceId,
          userId: previousComment.createdBy,
          blockCommentId
        });
      }

      if (commentAuthorId !== cardAuthorId) {
        await createCardNotification({
          type: 'block_comment.created',
          createdBy: commentAuthorId,
          cardId,
          spaceId,
          userId: cardAuthorId,
          blockCommentId
        });
      }

      const extractedMentions = extractMentions(blockCommentContent);

      for (const extractedMention of extractedMentions) {
        const mentionedUserId = extractedMention.value;
        await createCardNotification({
          type: 'block_comment.mention.created',
          createdBy: commentAuthorId,
          cardId,
          mentionId: extractedMention.id,
          spaceId,
          userId: mentionedUserId,
          blockCommentId
        });
      }

      break;
    }

    case WebhookEventNames.CardPersonPropertyAssigned: {
      const spaceId = webhookData.spaceId;
      const assignedUserId = webhookData.event.assignedUser.id;
      const cardId = webhookData.event.card.id;

      await createCardNotification({
        type: 'person_assigned',
        personPropertyId: webhookData.event.personProperty.id,
        cardId,
        spaceId,
        userId: assignedUserId,
        createdBy: webhookData.event.user.id
      });
      break;
    }

    default:
      break;
  }
}
