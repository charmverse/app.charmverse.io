import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { applyProposalWorkflow } from './applyProposalWorkflow';
import type { RubricDataInput } from './rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from './rubric/upsertRubricCriteria';

export type ApplyTemplateRequest = {
  proposalId: string;
  templateId: string | null; // note that templateId belongs to the pages db and NOT proposals
};

export async function applyProposalTemplate({
  actorId,
  proposalId,
  templateId
}: ApplyTemplateRequest & { actorId: string }) {
  if (!templateId) {
    return prisma.page.updateMany({
      where: {
        proposal: {
          id: proposalId
        }
      },
      data: {
        sourceTemplateId: null
      }
    });
  }

  const template = await prisma.page.findUniqueOrThrow({
    where: {
      id: templateId
    },
    include: {
      proposal: {
        include: {
          authors: true,
          evaluations: {
            include: {
              reviewers: true,
              rubricCriteria: {
                orderBy: {
                  index: 'asc'
                }
              }
            },
            orderBy: {
              index: 'asc'
            }
          }
        }
      }
    }
  });
  if (!template.proposal) {
    throw new Error('Template does not have a proposal attached');
  }
  if (!template.proposal.workflowId) {
    throw new Error('Template does not have a workflow attached');
  }

  // apply worfklow first so that evaluations are correctly created
  await applyProposalWorkflow({
    actorId,
    workflowId: template.proposal.workflowId,
    proposalId
  });

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    include: {
      evaluations: {
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  // authors should be empty by default for new templates
  // but include authors from templates if they were added
  const authorsFromTemplate = template.proposal.authors.map(({ userId }) => userId) || [];
  const authorIds = [...new Set([actorId].concat(authorsFromTemplate))];

  // retrieve permissions and apply evaluation ids to reviewers
  const reviewersInput: Prisma.ProposalReviewerCreateManyInput[] = template.proposal.evaluations
    .map(({ reviewers: evalReviewers }, index) => {
      return evalReviewers.map((reviewer) => ({
        roleId: reviewer.roleId,
        systemRole: reviewer.systemRole,
        userId: reviewer.userId,
        proposalId,
        evaluationId: proposal.evaluations[index].id
      }));
    })
    .flat();

  await prisma.$transaction([
    prisma.proposal.update({
      where: {
        id: proposalId
      },
      data: {
        fields: { properties: {} },
        selectedCredentialTemplates: template.proposal.selectedCredentialTemplates,
        formId: template.proposal.formId
      }
    }),
    prisma.proposalAuthor.deleteMany({
      where: {
        proposalId
      }
    }),
    prisma.proposalAuthor.createMany({
      data: authorIds.map((userId) => ({
        userId,
        proposalId
      }))
    }),
    prisma.proposalReviewer.deleteMany({
      where: {
        proposalId
      }
    }),
    prisma.proposalReviewer.createMany({
      data: reviewersInput
    }),
    prisma.formFieldAnswer.deleteMany({
      where: {
        proposalId
      }
    }),
    prisma.page.updateMany({
      where: {
        proposal: {
          id: proposalId
        }
      },
      data: {
        content: template.content as any,
        contentText: template.contentText,
        sourceTemplateId: templateId
      }
    })
  ]);

  // update evaluation settings
  await Promise.all(
    template.proposal.evaluations.map(async (evaluation, index) => {
      if (evaluation.type === 'rubric') {
        await prisma.proposalRubricCriteria.deleteMany({
          where: {
            evaluationId: proposal.evaluations[index].id
          }
        });
        await upsertRubricCriteria({
          actorId,
          evaluationId: proposal.evaluations[index].id,
          proposalId: proposal.id,
          rubricCriteria: evaluation.rubricCriteria.map((criteria) => ({
            ...criteria,
            parameters: criteria.parameters as RubricDataInput['parameters']
          }))
        });
      }
      await prisma.proposalEvaluation.update({
        where: {
          id: proposal.evaluations[index].id
        },
        data: {
          requiredReviews: evaluation.requiredReviews,
          actionLabels: evaluation.actionLabels as any,
          voteSettings: evaluation.voteSettings as any,
          showAuthorResultsOnRubricFail: evaluation.showAuthorResultsOnRubricFail
        }
      });
    })
  );
}
