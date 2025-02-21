import { createMockPage } from '@packages/testing/mocks/page';
import { createMockProposal } from '@packages/testing/mocks/proposal';

import { getProposalErrors } from '../getProposalErrors';
import type { ProposalFields } from '../interfaces';

describe('getProposalErrors', () => {
  it(`Should return true for the default state`, async () => {
    const proposal = createMockProposal();
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

  it(`Should return false when appealable pass_fail step is missing reviewers`, async () => {
    const proposal = createMockProposal({
      evaluations: [
        {
          type: 'pass_fail',
          title: 'Test',
          reviewers: [{ userId: 'someone' }] as any[],
          appealable: true
        }
      ],
      workflowId: 'test'
    });
    const input = getFunctionInput({
      proposal
    });
    const errors = getProposalErrors(input);

    expect(errors).toContain('Appeal reviewers are required for the "Test" step');
  });

  it(`Should return false when token amount is missing`, async () => {
    const proposal = createMockProposal({
      fields: {
        pendingRewards: [
          {
            draftId: 'draftId',
            page: { content: null, contentText: '' },
            reward: {
              chainId: 1,
              rewardType: 'token',
              rewardToken: 'ETH',
              rewardAmount: null
            }
          }
        ]
      },
      workflowId: 'workflowId'
    });
    const errors = getProposalErrors(
      getFunctionInput({
        proposal
      })
    );

    expect(errors).toContain('Token amount is required for milestones');
  });

  it(`Should return true when token amount is valid`, async () => {
    const proposal = createMockProposal({
      fields: {
        pendingRewards: [
          {
            draftId: 'draftId',
            page: { content: null, contentText: '' },
            reward: {
              chainId: 1,
              rewardType: 'token',
              rewardToken: 'ETH',
              rewardAmount: 0.002
            }
          }
        ]
      },
      workflowId: 'workflowId'
    });
    const errors = getProposalErrors(
      getFunctionInput({
        proposal
      })
    );

    expect(errors).toHaveLength(0);
  });
});

type GetProposalErrorsInput = Parameters<typeof getProposalErrors>[0];

function getFunctionInput({
  proposal,
  page = createMockPage({ type: 'proposal', title: 'dummy title' })
}: {
  proposal: ReturnType<typeof createMockProposal>;
  page?: ReturnType<typeof createMockPage>;
}): GetProposalErrorsInput {
  return {
    isDraft: false,
    contentType: 'free_form',
    requireTemplates: false,
    proposal: {
      ...proposal,
      fields: proposal.fields as ProposalFields,
      authors: proposal.authors.map((author) => author.userId),
      evaluations: proposal.evaluations.map((evaluation) => ({
        ...evaluation,
        voteSettings: evaluation.voteSettings as any
      }))
    } as any,
    page
  };
}
