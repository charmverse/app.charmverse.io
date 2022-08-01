import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { createProposal } from '../createProposal';

describe('createProposal - creates all the data for a new proposal', () => {

  it('should create an empty proposal and return it in draft status along with the page permissions', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const proposalPage = await createProposal({
      spaceId: space.id,
      userId: user.id
    });

    expect(proposalPage.permissions.length).toBe(2);
    expect(proposalPage.permissions.some(p => p.userId === user.id && p.permissionLevel === 'full_access'));
    expect(proposalPage.permissions.some(p => p.spaceId === space.id && p.permissionLevel === 'view'));
    expect(proposalPage.proposal.status === 'draft').toBe(true);
  });
});
