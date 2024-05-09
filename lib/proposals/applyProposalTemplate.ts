import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { applyProposalWorkflow } from './applyProposalWorkflow';
import type { RubricDataInput } from './rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from './rubric/upsertRubricCriteria';

export type ApplyTemplateRequest = {
  proposalId: string;
  templateId: string | null;
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

  const template = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: templateId
    },
    include: {
      authors: true,
      evaluations: {
        include: {
          reviewers: true,
          rubricCriteria: true
        },
        orderBy: {
          index: 'asc'
        }
      },
      page: true
    }
  });
  if (!template.workflowId) {
    throw new Error('Template does not have a workflow attached');
  }

  // apply worfklow first so that evaluations are correctly created
  await applyProposalWorkflow({
    actorId,
    workflowId: template.workflowId,
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
  const authorsFromTemplate = template?.authors.map(({ userId }) => userId) || [];
  const authorIds = [...new Set([actorId].concat(authorsFromTemplate))];

  // retrieve permissions and apply evaluation ids to reviewers
  const reviewersInput: Prisma.ProposalReviewerCreateManyInput[] = template.evaluations
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
        selectedCredentialTemplates: template.selectedCredentialTemplates,
        formId: template.formId
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
        content: template.page?.content as any,
        contentText: template.page?.contentText,
        sourceTemplateId: templateId
      }
    })
  ]);

  // update evaluation settings
  await Promise.all(
    template.evaluations.map(async (evaluation, index) => {
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
      // apply vote settings
      await prisma.proposalEvaluation.update({
        where: {
          id: proposal.evaluations[index].id
        },
        data: {
          actionLabels: evaluation.actionLabels as any,
          voteSettings: evaluation.voteSettings as any
        }
      });
    })
  );
}
