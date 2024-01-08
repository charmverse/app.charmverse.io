import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { archiveProposal } from '../archiveProposal';

describe('archiveProposal()', () => {
  it('should update the proposal archived status and return the proposal with full data', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      archived: false,
      authors: [user.id]
    });
    const archived = await archiveProposal({
      archived: true,
      proposalId: proposal.id
    });

    expect(archived.archived).toBe(true);

    const unarchived = await archiveProposal({
      archived: false,
      proposalId: proposal.id
    });

    expect(unarchived.archived).toBe(false);
  });
});
