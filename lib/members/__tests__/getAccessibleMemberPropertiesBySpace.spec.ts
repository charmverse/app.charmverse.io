
import { createMemberPropertyPermission } from 'lib/members/createMemberPropertyPermission';
import { getAccessibleMemberPropertiesBySpace } from 'lib/members/getAccessibleMemberPropertiesBySpace';
import { assignRole } from 'lib/roles';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateMemberProperty } from 'testing/utils/members';

describe('getAccessibleMemberPropertiesBySpace', () => {

  it('should return all properties if user is admin', async () => {

    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    await generateMemberProperty({ type: 'text', userId: adminUser.id, spaceId: space.id, name: 'test text1' });
    await generateMemberProperty({ type: 'text', userId: adminUser.id, spaceId: space.id, name: 'test text2' });

    const properties = await getAccessibleMemberPropertiesBySpace({ userId: adminUser.id, spaceId: space.id });

    expect(properties.length).toBe(2);

  });

  it('should return all properties without set up permissions for non-admin user', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space.id, name: 'test text1' });
    await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space.id, name: 'test text2' });

    const properties = await getAccessibleMemberPropertiesBySpace({ userId: nonAdminUser.id, spaceId: space.id });

    expect(properties.length).toBe(2);
  });

  it('should not return properties for public user', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space.id, name: 'test text1' });
    await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space.id, name: 'test text2' });

    const properties = await getAccessibleMemberPropertiesBySpace({ userId: undefined, spaceId: space.id });

    expect(properties.length).toBe(0);
  });

  it('should not return properties if user does not have access to space', async () => {

    const { user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const { user: nonAdminUser, space: space2 } = await generateUserAndSpaceWithApiToken(undefined, false);

    await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space2.id, name: 'test text1' });
    await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space2.id, name: 'test text2' });

    const properties = await getAccessibleMemberPropertiesBySpace({ userId: adminUser.id, spaceId: space2.id });

    expect(properties.length).toBe(0);

  });

  it('should return all properties that user has access according to role', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const role = await generateRole({ spaceId: space.id, roleName: 'test role 1', createdBy: nonAdminUser.id });
    const role2 = await generateRole({ spaceId: space.id, roleName: 'test role 2', createdBy: nonAdminUser.id });

    const prop1 = await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space.id, name: 'test text1' });
    const prop2 = await generateMemberProperty({ type: 'text', userId: nonAdminUser.id, spaceId: space.id, name: 'test text2' });

    await createMemberPropertyPermission({ memberPropertyId: prop1.id, roleId: role.id });
    await createMemberPropertyPermission({ memberPropertyId: prop2.id, roleId: role2.id });

    let properties = await getAccessibleMemberPropertiesBySpace({ userId: nonAdminUser.id, spaceId: space.id });
    expect(properties.length).toBe(0);

    await assignRole({
      roleId: role.id,
      userId: nonAdminUser.id
    });
    properties = await getAccessibleMemberPropertiesBySpace({ userId: nonAdminUser.id, spaceId: space.id });
    expect(properties.length).toBe(1);

    await assignRole({
      roleId: role2.id,
      userId: nonAdminUser.id
    });
    properties = await getAccessibleMemberPropertiesBySpace({ userId: nonAdminUser.id, spaceId: space.id });
    expect(properties.length).toBe(2);
  });
});
