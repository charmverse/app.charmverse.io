import { getBounty } from 'lib/bounties';
import type { BountyWithDetails } from 'lib/bounties';
import { getSpaceMembers } from 'lib/members/getSpaceMembers';
import { assignRole } from 'lib/roles';
import {
  generateBounty,
  generateRole,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

import type { BountyPermissionGroup } from '../bounties';
import { queryBountyPermissions } from '../bounties';
import { compareBountyPagePermissions } from '../compareBountyPagePermissions';

describe('compareBountyPagePermissions', () => {
  it('should return the users and roles which have both sets of permissions', async () => {
    const { user: firstUser, space } = await generateUserAndSpaceWithApiToken();
    const secondUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    const thirdUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      spaceId: space.id,
      createdBy: firstUser.id
    });

    await assignRole({
      roleId: role.id,
      userId: secondUser.id
    });

    await assignRole({
      roleId: role.id,
      userId: thirdUser.id
    });

    // Create the bounty page

    const createdBounty = await generateBounty({
      spaceId: space.id,
      approveSubmitters: true,
      createdBy: firstUser.id,
      status: 'open',
      bountyPermissions: {
        creator: [
          {
            group: 'user',
            id: firstUser.id
          }
        ],
        submitter: [
          {
            group: 'role',
            id: role.id
          }
        ]
      },
      pagePermissions: [
        {
          permissionLevel: 'editor',
          roleId: role.id
        },
        {
          permissionLevel: 'full_access',
          userId: secondUser.id
        }
      ]
    });

    const members = await getSpaceMembers({ spaceId: space.id });
    const roleMembers = members.filter((member) => member.roles.some((r) => r.id === role.id));

    const bountyPermissions = await queryBountyPermissions({
      bountyId: createdBounty.id
    });

    const bounty = (await getBounty(createdBounty.id)) as BountyWithDetails;

    const intersection = compareBountyPagePermissions({
      bountyOperations: ['work'],
      pageOperations: ['edit_content'],
      bountyPermissions,
      pagePermissions: bounty.page.permissions,
      members: roleMembers
    });

    expect(intersection.missingPermissions.length).toBe(1);
    expect((intersection.missingPermissions[0] as BountyPermissionGroup).id).toBe(firstUser.id);

    expect(intersection.hasPermissions.length).toBe(2);
    expect(intersection.hasPermissions.some((assignee) => (assignee as BountyPermissionGroup).id === role.id)).toBe(
      true
    );
    expect(
      intersection.hasPermissions.some((assignee) => (assignee as BountyPermissionGroup).id === secondUser.id)
    ).toBe(true);
    // Third user was never explicitly assigned a permission, only via their role. So they shouldn't show up
    expect(
      intersection.hasPermissions.every((assignee) => (assignee as BountyPermissionGroup).id !== thirdUser.id)
    ).toBe(true);
  });
});
