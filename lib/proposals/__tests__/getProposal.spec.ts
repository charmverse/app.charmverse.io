import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { getProposal } from '../getProposal';
import type { ProposalWithUsersAndRubric } from '../interfaces';

describe('getProposal', () => {
  it('should return a proposal', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });

    const result = await getProposal({
      id: proposal.id,
      permissionsByStep: {
        draft: {} as any
      }
    });
    expect(result).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsersAndRubric>>({
        id: proposal.id
      })
    );
  });
});
