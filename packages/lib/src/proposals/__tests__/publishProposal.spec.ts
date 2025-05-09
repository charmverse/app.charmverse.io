import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { voteSettings } from '@packages/lib/proposals/createDefaultProposal';

import { publishProposal } from '../publishProposal';

describe('publishProposal()', () => {
  it('Should move proposal from draft to published', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });
    const { id: proposalId } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'draft'
    });

    await publishProposal({
      proposalId,
      userId: user.id
    });

    const result = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposalId
      }
    });

    expect(result.status).toBe('published');
  });

  it('Should create a vote for the first evaluation step', async () => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });
    const { id: proposalId, evaluations } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          title: 'Vote',
          reviewers: [],
          permissions: []
        }
      ]
    });

    // TODO: add voteSettings to evaluationInputs in test generator
    await prisma.proposalEvaluation.update({
      where: {
        id: evaluations[0].id
      },
      data: {
        voteSettings
      }
    });

    await publishProposal({
      proposalId,
      userId: user.id
    });

    const result = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposalId
      },
      include: {
        evaluations: true,
        page: true
      }
    });

    expect(result.status).toBe('published');
    expect(result.evaluations[0].voteId).not.toBeNull();

    const vote = await prisma.vote.findUniqueOrThrow({
      where: {
        id: result.evaluations[0].voteId!
      },
      include: {
        voteOptions: true
      }
    });

    expect(vote.context).toBe('proposal');
    expect(vote.pageId).toBe(result.page!.id);
    expect(vote.maxChoices).toBe(voteSettings.maxChoices);
    expect(vote.threshold).toBe(voteSettings.threshold);
    expect(vote.type).toBe(voteSettings.type);
    expect(vote.voteOptions.map((opt) => opt.name)).toEqual(voteSettings.options);
    expect(vote.deadline.toDateString()).toEqual(
      new Date(Date.now() + voteSettings.durationDays * 24 * 60 * 60 * 1000).toDateString()
    );
  });
});
