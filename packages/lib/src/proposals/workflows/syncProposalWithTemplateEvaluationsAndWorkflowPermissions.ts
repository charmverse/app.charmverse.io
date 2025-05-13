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
import { v4 as uuid } from 'uuid';

import { syncProposalPermissionsWithWorkflowPermissions } from './syncProposalPermissionsWithWorkflowPermissions';

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
          sourceTemplateId: true,
          type: true
        }
      },
      evaluations: {
        select: {
          reviews: true,
          appealReviews: true,
          rubricAnswers: true,
          vote: {
            select: {
              userVotes: true
            }
          }
        }
      }
    }
  });

  if (proposal.page?.type !== 'proposal') {
    throw new InvalidInputError(`This method can only be used for proposals, not proposal templates`);
  }

  const proposalHasReceivedReviews = proposal.evaluations.some(
    (ev) => ev.reviews.length || ev.appealReviews.length || ev.rubricAnswers.length || ev.vote?.userVotes.length
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
    (templateEvaluation) => {
      const {
        decidedBy,
        proposalId: evaluationProposalId,
        voteId,
        appealedBy,
        ...cleanTemplateEvaluation
      } = templateEvaluation;

      const newEvaluation: Prisma.ProposalEvaluationCreateInput = {
        ...cleanTemplateEvaluation,
        id: uuid(),
        decider: decidedBy
          ? {
              connect: {
                id: decidedBy
              }
            }
          : undefined,
        voteSettings: cleanTemplateEvaluation.voteSettings as any,
        actionLabels: cleanTemplateEvaluation.actionLabels as any,
        notificationLabels: cleanTemplateEvaluation.notificationLabels as any,
        proposal: {
          connect: {
            id: proposalId
          }
        },
        rubricCriteria: {
          createMany: {
            data: cleanTemplateEvaluation.rubricCriteria.map((criteria) => ({
              ...criteria,
              id: uuid(),
              proposalId,
              evaluationId: undefined
            })) as Prisma.ProposalRubricCriteriaCreateManyEvaluationInput[]
          }
        },
        reviewers: {
          createMany: {
            data: cleanTemplateEvaluation.reviewers.map(
              (r) =>
                ({
                  systemRole: r.systemRole,
                  userId: r.userId,
                  roleId: r.roleId,
                  proposalId
                }) as Omit<Prisma.ProposalReviewerCreateManyInput, 'evaluationId'>
            )
          }
        },
        appealReviewers: {
          createMany: {
            data: cleanTemplateEvaluation.appealReviewers.map(
              (r) =>
                ({
                  userId: r.userId,
                  roleId: r.roleId,
                  proposalId
                }) as Omit<Prisma.ProposalAppealReviewerCreateManyInput, 'evaluationId'>
            )
          }
        },
        evaluationApprovers: {
          createMany: {
            data: cleanTemplateEvaluation.evaluationApprovers.map(
              (r) =>
                ({
                  userId: r.userId,
                  roleId: r.roleId,
                  proposalId
                }) as Omit<Prisma.ProposalEvaluationApproverCreateManyInput, 'evaluationId'>
            )
          }
        }
      };

      return newEvaluation;
    }
  );

  await prisma.$transaction(
    async (tx) => {
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

      // If the proposal template is not entirely in sync with the workflow, this will fail
      await syncProposalPermissionsWithWorkflowPermissions({
        proposalId,
        tx
      });
    },
    {
      timeout: 120000
    }
  );

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
