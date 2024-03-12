import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { archiveProposals } from '../archiveProposals';

describe('archiveProposals()', () => {
  it('should update the proposal archived status and return the proposal', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      archived: false,
      authors: [user.id]
    });
    await archiveProposals({
      archived: true,
      proposalIds: [proposal.id],
      actorId: user.id
    });

    await archiveProposals({
      archived: false,
      proposalIds: [proposal.id],
      actorId: user.id
    });
  });
});
