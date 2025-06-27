import type { ProposalEvaluationResult, ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@packages/core/proposals';

type CurrentEvaluation = {
  id: string;
  type: ProposalEvaluationType;
  title: string;
  result: ProposalEvaluationResult | null;
};

export type ReviewerProposal = {
  id: string;
  title: string;
  updatedAt: Date;
  currentEvaluation: CurrentEvaluation;
  path: string;
};

export type GetProposalsReviewersResponse = {
  userId: string;
  reviewsLeft: number;
  proposals: ReviewerProposal[];
}[];

export async function getProposalsReviewers({ spaceId }: { spaceId: string }): Promise<GetProposalsReviewersResponse> {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    select: {
      userId: true,
      spaceRoleToRole: {
        select: {
          roleId: true
        }
      }
    }
  });

  const proposals = await prisma.proposal.findMany({
    where: {
      spaceId,
      status: 'published',
      page: {
        type: 'proposal',
        deletedAt: null
      },
      archived: false
    },
    select: {
      id: true,
      status: true,
      authors: {
        select: {
          userId: true
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        select: {
          id: true,
          index: true,
          appealedAt: true,
          result: true,
          type: true,
          title: true,
          reviews: {
            select: {
              reviewerId: true,
              completedAt: true
            }
          },
          appealReviews: {
            select: {
              reviewerId: true,
              completedAt: true
            }
          },
          rubricAnswers: {
            select: {
              userId: true
            }
          },
          vote: {
            select: {
              id: true,
              userVotes: {
                select: {
                  userId: true,
                  updatedAt: true
                }
              }
            }
          },
          appealReviewers: {
            select: {
              userId: true,
              roleId: true
            }
          },
          reviewers: {
            select: {
              userId: true,
              roleId: true,
              systemRole: true
            }
          }
        }
      },
      page: {
        select: {
          title: true,
          updatedAt: true,
          path: true
        }
      }
    }
  });

  const proposalsReviewers: GetProposalsReviewersResponse = [];

  for (const spaceRole of spaceRoles) {
    const userRoles = spaceRole.spaceRoleToRole.map((r) => r.roleId);
    let reviewsCompleted = 0;
    let totalReviews = 0;
    const reviewerProposals: ReviewerProposal[] = [];
    for (const proposal of proposals) {
      const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
      if (proposal.page && currentEvaluation) {
        const isAuthor = proposal.authors.some((author) => author.userId === spaceRole.userId);
        const isReviewer = currentEvaluation?.reviewers.some(
          (reviewer) =>
            reviewer.userId === spaceRole.userId ||
            (reviewer.roleId && userRoles.includes(reviewer.roleId)) ||
            reviewer.systemRole === 'space_member' ||
            (reviewer.systemRole === 'author' && isAuthor)
        );
        const isAppealReviewer = currentEvaluation?.appealReviewers.some(
          (reviewer) => reviewer.userId === spaceRole.userId || (reviewer.roleId && userRoles.includes(reviewer.roleId))
        );

        let proposalAdded = false; // in case they are a reviewer and the proposal is not appealed

        if (isReviewer && !currentEvaluation.result) {
          totalReviews += 1;
          const currentReview =
            currentEvaluation.reviews.some((review) => review.reviewerId === spaceRole.userId) ||
            currentEvaluation.rubricAnswers.some((answer) => answer.userId === spaceRole.userId);
          const currentVote = currentEvaluation.vote?.userVotes.some((vote) => vote.userId === spaceRole.userId);
          const hasReviewed = currentReview || currentVote;

          if (hasReviewed) {
            reviewsCompleted += 1;
          } else {
            proposalAdded = true;
            reviewerProposals.push({
              id: proposal.id,
              title: proposal.page.title,
              updatedAt: proposal.page.updatedAt,
              currentEvaluation: {
                id: currentEvaluation.id,
                type: currentEvaluation.type,
                title: currentEvaluation.title,
                result: currentEvaluation.result || null
              },
              path: proposal.page.path
            });
          }
        }
        if (isAppealReviewer && !currentEvaluation.result && currentEvaluation.appealedAt && !proposalAdded) {
          totalReviews += 1;
          const currentAppealReview = currentEvaluation.appealReviews.some(
            (review) => review.reviewerId === spaceRole.userId
          );
          const hasReviewed = currentAppealReview;
          if (hasReviewed) {
            reviewsCompleted += 1;
          } else {
            reviewerProposals.push({
              id: proposal.id,
              title: proposal.page.title,
              updatedAt: proposal.page.updatedAt,
              currentEvaluation: {
                id: currentEvaluation.id,
                type: currentEvaluation.type,
                title: currentEvaluation.title,
                result: currentEvaluation.result || null
              },
              path: proposal.page.path
            });
          }
        }
      }
    }

    if (totalReviews) {
      proposalsReviewers.push({
        userId: spaceRole.userId,
        reviewsLeft: totalReviews - reviewsCompleted,
        proposals: reviewerProposals
      });
    }
  }

  return proposalsReviewers.sort((a, b) => b.reviewsLeft - a.reviewsLeft);
}
