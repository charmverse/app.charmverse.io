import { InvalidInputError } from '@charmverse/core/errors';
import type {
  Prisma,
  Proposal,
  ProposalAppealReviewer,
  ProposalEvaluation,
  ProposalEvaluationApprover,
  ProposalReviewer,
  ProposalRubricCriteria
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { permissionsApiClient } from '@root/lib/permissions/api/client';
import { v4 as uuid } from 'uuid';

import { getProposal, proposalWithUsersAndRubricInclude } from '../getProposal';
import type { ProposalWithUsersAndRubric } from '../interfaces';

export async function syncProposalWithTemplateEvaluationsAndWorkflowPermissions({
  proposalId
}: {
  proposalId: string;
}): Promise<
  Proposal & {
    evaluations: (ProposalEvaluation & {
      reviewers: ProposalReviewer[];
      appealReviewers: ProposalAppealReviewer[];
      evaluationApprovers: ProposalEvaluationApprover[];
      rubricCriteria: ProposalRubricCriteria[];
    })[];
  }
> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      page: {
        select: {
          sourceTemplateId: true
        }
      },
      evaluations: {
        select: {
          reviews: true,
          appealReviews: true,
          rubricAnswers: true
        }
      }
    }
  });

  const proposalHasReceivedReviews = proposal.evaluations.some(
    (ev) => ev.reviews.length || ev.appealReviews.length || ev.rubricAnswers.length
  );

  if (proposalHasReceivedReviews) {
    throw new InvalidInputError(`Cannot update proposal as it already has reviews`);
  }

  const templateId = proposal.page?.sourceTemplateId;

  if (!templateId) {
    throw new InvalidInputError(`Proposal ${proposalId} does not have a source template`);
  }

  const sourceProposalTemplate = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        id: templateId
      }
    },
    include: {
      authors: true,
      workflow: true,
      evaluations: {
        include: {
          reviewers: true,
          appealReviewers: true,
          evaluationApprovers: true,
          rubricCriteria: true
        }
      }
    }
  });

  // Sync evaluations from template
  const updatedEvaluations: Prisma.ProposalEvaluationCreateInput[] = sourceProposalTemplate.evaluations.map(
    (evaluation) => {
      const newEvaluation: Prisma.ProposalEvaluationCreateInput = {
        ...evaluation,
        id: uuid(),
        voteSettings: evaluation.voteSettings as any,
        actionLabels: evaluation.actionLabels as any,
        notificationLabels: evaluation.notificationLabels as any,
        proposal: {
          connect: {
            id: proposalId
          }
        },
        rubricCriteria: {
          createMany: {
            data: evaluation.rubricCriteria.map((criteria) => ({
              ...criteria,
              proposalId,
              evaluationId: undefined
            })) as Prisma.ProposalRubricCriteriaCreateManyEvaluationInput[]
          }
        },
        reviewers: {
          createMany: {
            data: evaluation.reviewers.map(
              (r) =>
                ({
                  systemRole: r.systemRole,
                  userId: r.userId,
                  roleId: r.roleId,
                  proposalId
                } as Omit<Prisma.ProposalReviewerCreateManyInput, 'evaluationId'>)
            )
          }
        },
        appealReviewers: {
          createMany: {
            data: evaluation.appealReviewers.map(
              (r) =>
                ({
                  userId: r.userId,
                  roleId: r.roleId,
                  proposalId
                } as Omit<Prisma.ProposalAppealReviewerCreateManyInput, 'evaluationId'>)
            )
          }
        },
        evaluationApprovers: {
          createMany: {
            data: evaluation.evaluationApprovers.map(
              (r) =>
                ({
                  userId: r.userId,
                  roleId: r.roleId,
                  proposalId
                } as Omit<Prisma.ProposalEvaluationApproverCreateManyInput, 'evaluationId'>)
            )
          }
        }
      };

      return newEvaluation;
    }
  );

  await prisma.$transaction(async (tx) => {
    await tx.proposalEvaluation.deleteMany({
      where: {
        proposalId
      }
    });

    for (const evaluation of updatedEvaluations) {
      await tx.proposalEvaluation.create({
        data: evaluation
      });
    }
  });

  return prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      evaluations: {
        include: {
          reviewers: true,
          appealReviewers: true,
          evaluationApprovers: true,
          rubricCriteria: true
        }
      }
    }
  });
}
