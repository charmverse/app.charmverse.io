import { InvalidInputError } from '@charmverse/core/errors';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import { getAssignedRoleIds } from '../getAssignedRoleIds';

describe('getAssignedRoleIds', () => {
  let spaceId: string;
  let userIdWithRole: string;
  let userIdWithoutRole: string;
  let roleId: string;

  beforeAll(async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({});

    const memberWithoutRole = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      assigneeUserIds: [user.id]
    });

    spaceId = space.id;
    userIdWithRole = user.id;
    userIdWithoutRole = memberWithoutRole.id;

    roleId = role.id;
  });

  it('should return an array of role IDs for a valid user and space ID', async () => {
    const roleIds = await getAssignedRoleIds({ spaceId, userId: userIdWithRole });
    expect(roleIds).toEqual([roleId]);
  });

  it('should return an empty array when the user has no assigned roles', async () => {
    const roleIds = await getAssignedRoleIds({ spaceId, userId: userIdWithoutRole });
    expect(roleIds).toEqual([]);
  });

  it('should throw an InvalidInputError if the spaceId is not a valid UUID', async () => {
    await expect(getAssignedRoleIds({ spaceId: 'invalid-uuid', userId: userIdWithRole })).rejects.toThrow(
      InvalidInputError
    );
  });

  it('should return an empty array when no userId is provided', async () => {
    const roleIds = await getAssignedRoleIds({ spaceId });
    expect(roleIds).toEqual([]);
  });
});
