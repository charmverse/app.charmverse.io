import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import type { ProposalWithUsersLite } from '../getProposals';
import { getProposals } from '../getProposals';

describe('getProposals', () => {
  it('should filter out deleted proposals and templates', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });

    const deletedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      deletedAt: new Date()
    });

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: user.id
    });

    const list = await getProposals({
      ids: [proposal.id, deletedProposal.id, proposalTemplate.id],
      spaceId: space.id,
      userId: user.id
    });

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsersLite>>({
        id: proposal.id
      })
    );
  });
});
