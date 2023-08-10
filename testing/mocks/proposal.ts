import { v4 as uuid } from 'uuid';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';

export function createMockProposal(input: Partial<ProposalWithUsersAndRubric> = {}): ProposalWithUsersAndRubric {
  const id = uuid();
  return {
    archived: false,
    category: null,
    createdBy: '',
    id,
    authors: [],
    categoryId: null,
    evaluationType: 'vote',
    reviewers: [],
    rubricCriteria: [],
    reviewedAt: null,
    reviewedBy: null,
    rubricAnswers: [],
    snapshotProposalExpiry: null,
    spaceId: '',
    status: 'draft',
    ...input
  };
}
