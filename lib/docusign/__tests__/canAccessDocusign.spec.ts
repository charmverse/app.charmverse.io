import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import { updateAllowedDocusignRolesAndUsers } from '../allowedDocusignRolesAndUsers';
import { canAccessDocusign } from '../canAccessDocusign';

describe('canAccessDocusign', () => {
  it('should return true for an admin user', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const result = await canAccessDocusign({ userId: admin.id, spaceId: space.id });
    expect(result).toBe(true);
  });

  it('should return true if docusignAllowedRoleOrUsers is empty', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const result = await canAccessDocusign({ userId: user.id, spaceId: space.id });
    expect(result).toBe(true);
  });

  it('should return true if user is explicitly allowed', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const allowedUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await updateAllowedDocusignRolesAndUsers({
      spaceId: space.id,
      allowedRolesAndUsers: [{ userId: allowedUser.id }]
    });

    const result = await canAccessDocusign({ userId: allowedUser.id, spaceId: space.id });
    expect(result).toBe(true);
  });

  it('should return true if user has an allowed role', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const userWithRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const role = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id,
      assigneeUserIds: [userWithRole.id]
    });

    await updateAllowedDocusignRolesAndUsers({
      spaceId: space.id,
      allowedRolesAndUsers: [{ roleId: role.id }]
    });

    const result = await canAccessDocusign({ userId: userWithRole.id, spaceId: space.id });
    expect(result).toBe(true);
  });

  it('should return false if userId is not provided', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const result = await canAccessDocusign({ userId: null, spaceId: space.id });
    expect(result).toBe(false);
  });

  it('should return false if user does not have any role in the space', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();
    const { user: userFromOtherSpace } = await testUtilsUser.generateUserAndSpace();

    const result = await canAccessDocusign({ userId: userFromOtherSpace.id, spaceId: space.id });
    expect(result).toBe(false);
  });

  it('should return false if user is neither explicitly allowed nor has an allowed role', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const anotherUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await updateAllowedDocusignRolesAndUsers({
      spaceId: space.id,
      allowedRolesAndUsers: [{ userId: user.id }]
    });

    const result = await canAccessDocusign({ userId: anotherUser.id, spaceId: space.id });
    expect(result).toBe(false);
  });

  it('should return false if user is not listed in docusignAllowedRoleOrUsers and does not have a role', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const role = await testUtilsMembers.generateRole({ createdBy: admin.id, spaceId: space.id });

    const otherUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await updateAllowedDocusignRolesAndUsers({
      spaceId: space.id,
      allowedRolesAndUsers: [{ roleId: role.id }]
    });

    const result = await canAccessDocusign({ userId: otherUser.id, spaceId: space.id });
    expect(result).toBe(false);
  });
});
