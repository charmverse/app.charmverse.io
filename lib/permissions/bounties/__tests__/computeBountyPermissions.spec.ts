import { BountyOperation } from '@charmverse/core/prisma';
import { testUtilsMembers } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { assignRole } from 'lib/roles';
import { typedKeys } from 'lib/utilities/objects';
import { generateBounty, generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { addBountyPermissionGroup } from '../addBountyPermissionGroup';
import { computeBountyPermissions } from '../computeBountyPermissions';
import type { BountyPermissionFlags } from '../interfaces';
import { bountyPermissionMapping } from '../mapping';

describe('computeBountyPermissions', () => {
  it('should combine permissions from user, role assignments and space membership', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });
    const otherUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: otherUser.id
    });

    await Promise.all([
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'creator',
        assignee: {
          group: 'user',
          id: otherUser.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'role',
          id: role.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'submitter',
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ]);

    const computed = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: otherUser.id
    });

    bountyPermissionMapping.creator.forEach((op) => {
      expect(computed[op]).toBe(true);
    });

    bountyPermissionMapping.submitter.forEach((op) => {
      expect(computed[op]).toBe(true);
    });

    bountyPermissionMapping.reviewer.forEach((op) => {
      expect(computed[op]).toBe(true);
    });
  });

  it('should give user permissions via their role', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });
    const otherUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: user.id,
      assigneeUserIds: [otherUser.id]
    });

    await addBountyPermissionGroup({
      resourceId: bounty.id,
      level: 'submitter',
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    const availableOperations = bountyPermissionMapping.submitter;

    const computed = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: otherUser.id
    });

    typedKeys(BountyOperation).forEach((op) => {
      if (availableOperations.indexOf(op) > -1) {
        expect(computed[op]).toBe(true);
      } else {
        expect(computed[op]).toBe(false);
      }
    });
  });

  it('should give user space permissions via their space membership', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });
    const otherUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await addBountyPermissionGroup({
      resourceId: bounty.id,
      level: 'reviewer',
      assignee: {
        group: 'space',
        id: space.id
      }
    });

    const computed = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: otherUser.id
    });

    expect(computed).toMatchObject<BountyPermissionFlags>({
      approve_applications: true,
      grant_permissions: false,
      lock: false,
      mark_paid: false,
      review: true,
      // No submitter permission exists in this space
      work: true
    });
  });

  it('should always give creator permissions to the bounty creator, even if this is not explicitly assigned', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const availableOperations = bountyPermissionMapping.creator;

    const computed = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: user.id
    });

    typedKeys(BountyOperation).forEach((op) => {
      if (availableOperations.indexOf(op) > -1) {
        expect(computed[op]).toBe(true);
      } else {
        expect(computed[op]).toBe(false);
      }
    });
  });

  it('should give user space permissions as an individual', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });
    const otherUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await addBountyPermissionGroup({
      resourceId: bounty.id,
      level: 'reviewer',
      assignee: {
        group: 'user',
        id: otherUser.id
      }
    });

    const availableOperations = bountyPermissionMapping.reviewer;

    const computed = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: otherUser.id
    });
    expect(computed).toMatchObject<BountyPermissionFlags>({
      approve_applications: true,
      grant_permissions: false,
      lock: false,
      mark_paid: false,
      review: true,
      // No submitter permission exists in this space
      work: true
    });
  });

  it('should return true to all operations if user is a space admin', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: true });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const computed = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: user.id
    });

    expect(computed).toMatchObject<BountyPermissionFlags>({
      approve_applications: true,
      grant_permissions: true,
      lock: true,
      mark_paid: true,
      review: true,
      work: true
    });
  });

  it('should contain all Bounty Operations as keys, with no additional or missing properties', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const computedPermissions = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: user.id
    });

    // Check the object has no extra keys
    typedKeys(computedPermissions).forEach((key) => {
      expect(BountyOperation[key]).toBeDefined();
    });

    // Check the object has no missing keys
    typedKeys(BountyOperation).forEach((key) => {
      expect(computedPermissions[key]).toBeDefined();
    });
  });

  it('should return false for all bounty operations if the the user is not a member of the space', async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: true });

    const { user: externalUser } = await generateUserAndSpace({ isAdmin: true });

    // Create a permission for the non space member which computeBountyPermissions should ignore
    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open',
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: externalUser.id
          }
        ]
      }
    });

    const computedPermissions = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: externalUser.id
    });

    // We should only have the view permission that was assigned to the public, not the one assigned to this user
    typedKeys(BountyOperation).forEach((op) => {
      expect(computedPermissions[op]).toBe(false);
    });
  });

  it('should delegate the bounty permissions calculation to the public version if the space is a free space', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false, paidTier: 'free' });
    const userWithRole = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [userWithRole.id]
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open',
      bountyPermissions: {
        reviewer: [{ group: 'role', id: role.id }]
      }
    });

    const userWithRolePermissions = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: userWithRole.id
    });

    // Simple way to check for behaviour, as in public mode, custom role permissions are ignored
    expect(userWithRolePermissions.review).toBe(false);
  });

  it('should return empty permissions if the bounty does not exist', async () => {
    const computed = await computeBountyPermissions({
      resourceId: v4()
    });

    typedKeys(BountyOperation).forEach((op) => {
      expect(computed[op]).toBe(false);
    });
  });

  it('should not allow admin to work on assigned reward', async () => {
    const { space, user } = await generateUserAndSpace({ isAdmin: false });
    const adminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await addBountyPermissionGroup({
      resourceId: bounty.id,
      level: 'submitter',
      assignee: {
        group: 'user',
        id: user.id
      }
    });

    const computed = await computeBountyPermissions({
      resourceId: bounty.id,
      userId: adminUser.id
    });

    typedKeys(computed).forEach((op) => {
      if (op === 'work') {
        expect(computed[op]).toBe(false);
      } else {
        expect(computed[op]).toBe(true);
      }
    });
  });
});
