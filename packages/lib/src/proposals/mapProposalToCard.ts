import type { Card } from '@packages/databases/card';

import {
  AUTHORS_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_EVALUATION_TYPE_ID,
  PROPOSAL_PUBLISHED_AT_ID,
  PROPOSAL_EVALUATION_DUE_DATE_ID
} from './blocks/constants';
import type { ProposalPropertyValue } from './blocks/interfaces';
import type { ProposalWithUsersLite } from './getProposals';
import type { ProposalFields } from './interfaces';

// build mock card from proposal and page data
export function mapProposalToCard({
  proposal,
  spaceId
}: {
  proposal: ProposalWithUsersLite;
  spaceId?: string;
}): Card<ProposalPropertyValue> {
  const proposalFields: ProposalFields = proposal.fields || { properties: {} };
  const proposalSpaceId = spaceId || '';
  proposalFields.properties = {
    ...proposalFields.properties,
    // [Constants.titleColumnId]: proposal.title,
    // add default field values on the fly
    [PROPOSAL_PUBLISHED_AT_ID]: proposal.publishedAt ? new Date(proposal.publishedAt).getTime() : '',
    [PROPOSAL_STATUS_BLOCK_ID]: proposal.archived ? 'archived' : (proposal.currentStep?.result ?? 'in_progress'),
    [AUTHORS_BLOCK_ID]: (proposal && 'authors' in proposal && proposal.authors?.map((a) => a.userId)) || '',
    [PROPOSAL_STEP_BLOCK_ID]: proposal.currentStep?.title ?? 'Draft',
    [PROPOSAL_EVALUATION_TYPE_ID]: proposal.currentStep?.step ?? 'draft',
    [PROPOSAL_REVIEWERS_BLOCK_ID]:
      proposal && 'reviewers' in proposal
        ? proposal.reviewers.map(({ userId, roleId, systemRole }) => ({ userId, roleId, systemRole }))
        : [],
    [PROPOSAL_EVALUATION_DUE_DATE_ID]: proposal.currentStep?.dueDate
      ? new Date(proposal.currentStep.dueDate).getTime()
      : ''
  };
  const card: Card<ProposalPropertyValue> = {
    id: proposal.id,
    spaceId: proposalSpaceId,
    title: proposal.title,
    rootId: proposalSpaceId,
    type: 'card' as const,
    updatedBy: proposal.updatedBy,
    createdBy: proposal.createdBy,
    createdAt: new Date(proposal.createdAt).getTime(),
    updatedAt: new Date(proposal.updatedAt).getTime(),
    fields: { properties: {}, ...proposalFields, contentOrder: [] }
  };

  return card;
}
