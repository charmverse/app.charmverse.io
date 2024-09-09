import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalWithUsersAndRubric } from '@root/lib/proposals/interfaces';
import type { OptionalNullable } from '@root/lib/utils/types';
import { v4 as uuid } from 'uuid';

type ProposalInput = Partial<Omit<ProposalWithUsersAndRubric, 'evaluations' | 'fields'>> & {
  evaluations?: Partial<ProposalWithUsersAndRubric['evaluations'][number]>[];
  fields?: Partial<ProposalWithUsersAndRubric['fields']>;
};

export function createMockProposal(input: ProposalInput = {}): OptionalNullable<ProposalWithUsersAndRubric> {
  const id = uuid();
  return {
    workflowId: 'test',
    issuedCredentials: [],
    isPublic: false,
    publishToLens: null,
    archived: false,
    createdBy: '',
    selectedCredentialTemplates: [],
    id,
    authors: [{ proposalId: 'id', userId: 'someone' }],
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
      move: true,
      evaluate_appeal: true,
      complete_evaluation: true
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
      totalReviews: 0,
      draftRubricAnswers: [],
      rubricCriteria: [],
      reviewers: [],
      permissions: [],
      requiredReviews: 1,
      declineReasonOptions: [],
      ...evaluation
    }))
  };
}

export const mockPermissions: ProposalPermissionFlags = {
  evaluate: true,
  comment: true,
  edit: true,
  delete: true,
  view: false,
  view_notes: false,
  view_private_fields: true,
  create_vote: false,
  make_public: false,
  archive: false,
  unarchive: false,
  move: false,
  evaluate_appeal: false,
  complete_evaluation: false
};
