import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';
import { createProposal } from '../createProposal';

describe('createProposal - creates all the data for a new proposal', () => {

  it('should create an empty proposal and return it in draft status along with the page permissions', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const updatedSpace = await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        defaultPagePermissionGroup: 'view_comment'
      }
    });

    const proposalPage = await createProposal({
      spaceId: space.id,
      userId: user.id
    });

    expect(proposalPage.permissions.length).toBe(2);
    expect(proposalPage.permissions.some(p => p.userId === user.id && p.permissionLevel === 'full_access')).toBe(true);
    // Same value as the space default
    expect(proposalPage.permissions.some(p => p.spaceId === space.id && p.permissionLevel === updatedSpace.defaultPagePermissionGroup)).toBe(true);
    expect(proposalPage.proposal.status === 'draft').toBe(true);
  });
});
