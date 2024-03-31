import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';

import { getProposalErrors } from '../getProposalErrors';

describe('getProposalErrors', () => {
  it(`Should false for a title with whitespace only`, async () => {
    const { proposal, page } = getProposalMock({ title: ' ' });
    const input = getFunctionInput({
      page,
      proposal
    });
    const errors = getProposalErrors(input);

    expect(errors).toContain('Title is required');
  });
});

function getProposalMock(options: { title?: string }) {
  const proposal = createMockProposal();
  const page = createMockPage({
    title: options.title
  });
  return { proposal, page };
}

type GetProposalErrorsInput = Parameters<typeof getProposalErrors>[0];

function getFunctionInput({
  proposal,
  ...options
}: {
  proposal: ReturnType<typeof createMockProposal>;
  page: ReturnType<typeof createMockPage>;
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
    ...options
  };
}
