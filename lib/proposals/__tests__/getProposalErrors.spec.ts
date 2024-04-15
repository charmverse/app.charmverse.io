import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';

import { getProposalErrors } from '../getProposalErrors';

describe('getProposalErrors', () => {
  it(`Should return true for the default state`, async () => {
    const proposal = createMockProposal({
      workflowId: 'test'
    });
    const input = getFunctionInput({ proposal });
    const errors = getProposalErrors(input);

    expect(errors).toHaveLength(0);
  });

  it(`Should return false for a title with whitespace only`, async () => {
    const proposal = createMockProposal();
    const page = createMockPage({
      title: ' '
    });
    const input = getFunctionInput({ proposal, page });
    const errors = getProposalErrors(input);

    expect(errors).toContain('Title is required');
  });

  it(`Should return false when rubric criteria is missing a title`, async () => {
    const proposal = createMockProposal({
      evaluations: [
        {
          type: 'rubric',
          title: 'Test',
          reviewers: [{ userId: 'someone' }] as any[],
          rubricCriteria: [{ title: '' }] as any[]
        }
      ],
      workflowId: 'test'
    });
    const input = getFunctionInput({
      proposal
    });
    const errors = getProposalErrors(input);

    expect(errors).toContain('Rubric criteria is missing a label in the "Test" step');
  });
});

type GetProposalErrorsInput = Parameters<typeof getProposalErrors>[0];

function getFunctionInput({
  proposal,
  page = createMockPage({ title: 'dummy title' })
}: {
  proposal: ReturnType<typeof createMockProposal>;
  page?: ReturnType<typeof createMockPage>;
}): GetProposalErrorsInput {
  return {
    isDraft: false,
    proposalType: 'free_form',
    requireTemplates: false,
    proposal: {
      ...proposal,
      authors: proposal.authors.map((author) => author.userId),
      evaluations: proposal.evaluations.map((evaluation) => ({
        ...evaluation,
        voteSettings: evaluation.voteSettings as any
      }))
    },
    page
  };
}
