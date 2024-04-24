import { v4 as uuid } from 'uuid';

import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';
import type { OptionalNullable } from 'lib/utils/types';

type ProposalInput = Partial<Omit<ProposalWithUsersAndRubric, 'evaluations'>> & {
  evaluations?: Partial<ProposalWithUsersAndRubric['evaluations'][number]>[];
};

export function createMockProposal(input: ProposalInput = {}): OptionalNullable<ProposalWithUsersAndRubric> {
  const id = uuid();
  return {
    issuedCredentials: [],
    publishToLens: null,
    archived: false,
    createdBy: '',
    selectedCredentialTemplates: [],
    id,
    authors: [],
    reviewedAt: null,
    reviewedBy: null,
    spaceId: '',
    status: 'draft',
    fields: null,
    form: {
      id: '',
      formFields: []
    },
    permissions: {
      view: true,
      view_notes: true,
      view_private_fields: true,
      comment: true,
      edit: true,
      delete: true,
      create_vote: true,
      evaluate: true,
      make_public: true,
      archive: true,
      unarchive: true,
      move: true
    },
    ...input,
    evaluations: (input.evaluations || []).map((evaluation) => ({
      id: uuid(),
      index: 0,
      proposalId: id,
      type: 'rubric',
      title: 'Rubric',
      result: null,
      rubricAnswers: [],
      draftRubricAnswers: [],
      rubricCriteria: [],
      reviewers: [],
      permissions: [],
      ...evaluation
    }))
  };
}
