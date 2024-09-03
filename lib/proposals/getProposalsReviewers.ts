import type { ProposalEvaluationResult, ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

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
          result: true,
          type: true,
          title: true,
          reviews: {
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

        if (isReviewer && !currentEvaluation.result) {
          totalReviews += 1;
          const currentReview =
            currentEvaluation.reviews.find((review) => review.reviewerId === spaceRole.userId) ||
            currentEvaluation.rubricAnswers.find((answer) => answer.userId === spaceRole.userId);
          const currentVote = currentEvaluation.vote?.userVotes.find((vote) => vote.userId === spaceRole.userId);
          const hasReviewed = currentReview || currentVote;

          if (hasReviewed) {
            reviewsCompleted += 1;
          }

          if (!hasReviewed) {
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
