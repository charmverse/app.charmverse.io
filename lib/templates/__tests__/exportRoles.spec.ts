import type { Space } from '@charmverse/core/prisma-client';
import { testUtilsMembers } from '@charmverse/core/test';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';

import { exportRoles } from '../exportRoles';

describe('exportRoles', () => {
  let space: Space;

  beforeAll(async () => {
    ({ space } = await generateUserAndSpace());
  });

  it('should retrieve roles successfully', async () => {
    // Generate roles for the space
    const roles = await Promise.all([testUtilsMembers.generateRole({ createdBy: space.createdBy, spaceId: space.id })]);

    const result = await exportRoles({ spaceIdOrDomain: space.id });
    expect(result.roles).toHaveLength(roles.length);
    result.roles.forEach((role) => {
      expect(role.spaceId).toBe(space.id);
    });
  });

  it('should throw an error for an invalid spaceIdOrDomain', async () => {
    await expect(exportRoles({ spaceIdOrDomain: 'nonExistingSpaceId' })).rejects.toThrow();
  });

  it('should return an empty array if no roles found', async () => {
    const newSpace = await generateUserAndSpace();
    const result = await exportRoles({ spaceIdOrDomain: newSpace.space.id });
    expect(result.roles).toEqual([]);
  });
});
