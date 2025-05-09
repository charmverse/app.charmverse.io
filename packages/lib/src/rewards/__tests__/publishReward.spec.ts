import { InvalidInputError } from '@charmverse/core/errors';
import { testUtilsBounties, testUtilsUser } from '@charmverse/core/test';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';

import { publishReward } from '../publishReward';

describe('publishReward', () => {
  it(`Should throw an error if the reward a open reward is published`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const bounty = await testUtilsBounties.generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    await expect(publishReward(bounty.id)).rejects.toThrowError(InvalidInputError);
  });

  it(`Should throw an error if the reward has no reviewers`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const bounty = await testUtilsBounties.generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });
    // No reviewers added
    await expect(publishReward(bounty.id)).rejects.toThrowError(InvalidInputError);
  });

  it(`Should update reward status and return reward`, async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const bounty = await testUtilsBounties.generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5,
      status: 'draft',
      permissions: [
        {
          permissionLevel: 'reviewer',
          userId: user.id,
          spaceId: space.id
        }
      ]
    });

    const reward = await publishReward(bounty.id);
    const authorPermission = await permissionsApiClient.pages.computePagePermissions({
      resourceId: bounty.page.id,
      userId: user.id
    });
    const spaceMemberPermission = await permissionsApiClient.pages.computePagePermissions({
      resourceId: bounty.page.id,
      userId: spaceMember.id
    });

    expect(authorPermission.edit_content).toBeTruthy();
    expect(spaceMemberPermission.edit_content).toBeFalsy();
    expect(spaceMemberPermission.read).toBeTruthy();

    expect(reward.status).toBe('open');
  });
});
