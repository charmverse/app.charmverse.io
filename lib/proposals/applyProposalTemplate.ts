import { prisma } from '@charmverse/core/prisma-client';

import { applyProposalWorkflow } from './applyProposalWorkflow';

export type ApplyWorkflowTemplate = {
  proposalId: string;
  id: string;
};

export async function applyProposalTemplate({ actorId, proposalId, id }: ApplyWorkflowTemplate & { actorId: string }) {
  const template = await prisma.proposal.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      authors: true,
      page: true
    }
  });
  if (!template.workflowId) {
    throw new Error('Template does not have a workflow attached');
  }

  const authorIds = [...new Set([actorId].concat(template.authors.map(({ userId }) => userId) || []))];

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
        sourceTemplateId: id
      }
    })
  ]);

  await applyProposalWorkflow({
    actorId,
    workflowId: template.workflowId,
    proposalId
  });
}
