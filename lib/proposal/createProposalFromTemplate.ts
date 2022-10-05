import type { Prisma } from '@prisma/client';

import { DataNotFoundError, InsecureOperationError } from 'lib/utilities/errors';

import { createProposal } from './createProposal';
import { getProposal } from './getProposal';

export interface CreateProposalFromTemplateInput {
  spaceId: string;
  createdBy: string;
  templateId: string;
}

export async function createProposalFromTemplate ({ createdBy, spaceId, templateId }: CreateProposalFromTemplateInput) {

  const proposalTemplate = await getProposal({ proposalId: templateId });

  if (!proposalTemplate) {
    throw new DataNotFoundError(`Proposal template with id ${templateId} not found`);
  }
  else if (spaceId !== proposalTemplate.spaceId) {
    throw new InsecureOperationError('You cannot copy proposals from a different space');
  }

  const title = `Copy of ${proposalTemplate.title}`;

  return createProposal({
    contentText: proposalTemplate?.contentText ?? '',
    content: proposalTemplate?.content as Prisma.InputJsonValue ?? undefined,
    createdBy,
    spaceId,
    title
  }, {
    categoryId: proposalTemplate.proposal?.categoryId || null,
    reviewers: (proposalTemplate.proposal?.reviewers ?? []).map(r => {
      return {
        roleId: r.roleId ? r.roleId : undefined,
        userId: r.userId ? r.userId : undefined
      };
    })
  });
}
