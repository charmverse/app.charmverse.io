
import { createMemberPropertyPermission } from 'lib/members/createMemberPropertyPermission';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty } from 'testing/utils/members';

describe('createMemberPropertyPermission', () => {

  it('should create member property permission', async () => {
    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    const prop = await generateMemberProperty({ type: 'text', userId: adminUser.id, spaceId: space.id, name: 'test text1' });
    const role = await generateRole({ spaceId: space.id, roleName: 'test role', createdBy: adminUser.id });

    const permission = await createMemberPropertyPermission({ memberPropertyId: prop.id, roleId: role.id });

    expect(permission.memberPropertyId).toBe(prop.id);
    expect(permission.roleId).toBe(role.id);
  });

  it('should throw an error when trying to create permission for a property and role from different spaces', async () => {
    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const { user: adminUser2, space: space2 } = await generateUserAndSpaceWithApiToken(undefined, true);

    const prop = await generateMemberProperty({ type: 'text', userId: adminUser.id, spaceId: space.id, name: 'test text1' });
    const role = await generateRole({ spaceId: space2.id, roleName: 'test role', createdBy: adminUser2.id });

    await expect(createMemberPropertyPermission({ memberPropertyId: prop.id, roleId: role.id })).rejects.toBeInstanceOf(InvalidInputError);
  });
});
