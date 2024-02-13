import { v4 as uuid } from 'uuid';

import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { OptionalNullable } from 'lib/utilities/types';

export function createMockProposal(
  input: Partial<ProposalWithUsersAndRubric> = {}
): OptionalNullable<ProposalWithUsersAndRubric> {
  const id = uuid();
  return {
    lensPostLink: null,
    publishToLens: null,
    archived: false,
    createdBy: '',
    selectedCredentialTemplates: [],
    id,
    authors: [],
    reviewers: [],
    evaluations: [],
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
    ...input
  };
}
