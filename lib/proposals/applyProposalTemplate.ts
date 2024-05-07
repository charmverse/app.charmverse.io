import { prisma } from '@charmverse/core/prisma-client';

import { updateProposalWorkflow } from './applyProposalWorkflow';

export type UpdateWorkflowTemplate = {
  proposalId: string;
  id: string;
};

export async function updateProposalTemplate({
  actorId,
  proposalId,
  id
}: UpdateWorkflowTemplate & { actorId: string }) {
  const template = await prisma.proposal.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      authors: true,
      page: true
    }
  });

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
  await updateProposalWorkflow({
    actorId,
    workflowId: template.workflowId!,
    proposalId
  });
}
