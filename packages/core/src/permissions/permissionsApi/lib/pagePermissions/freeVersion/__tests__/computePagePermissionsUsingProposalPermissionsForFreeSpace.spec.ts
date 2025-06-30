import type { Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { computePagePermissionsUsingProposalPermissionsForFreeSpace } from '../computePagePermissionsUsingProposalPermissionsForFreeSpace';

let authorUser: User;
let memberUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: false
  });
  space = generated.space;

  authorUser = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
  memberUser = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
});

describe('computePagePermissionsUsingProposalPermissionsForFreeSpace', () => {
  it('should convert proposal permissions', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: authorUser.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          permissions: [{ assignee: { group: 'author' }, operation: 'edit' }],
          reviewers: []
        }
      ]
    });

    const authorPermissions = await computePagePermissionsUsingProposalPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: authorUser.id
    });

    expect(authorPermissions.edit_content).toBe(true);
    expect(authorPermissions.delete).toBe(true);
    expect(authorPermissions.read).toBe(true);

    const memberPermissions = await computePagePermissionsUsingProposalPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: memberUser.id
    });

    expect(memberPermissions.edit_content).toBe(false);
    expect(memberPermissions.delete).toBe(false);
    expect(memberPermissions.read).toBe(true);
  });
});
