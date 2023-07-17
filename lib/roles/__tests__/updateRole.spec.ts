import { InvalidInputError, UndesirableOperationError } from '@charmverse/core/errors';
import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { updateRole } from '../updateRole';

describe('updateRole', () => {
  let space: Space;
  let user: User;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    space = generated.space;
    user = generated.user;
  });

  it('should only update the role name', async () => {
    const newName = `New Role Name - ${uuid()}`;

    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const updateContent: Role = {
      name: newName,
      // All these updates should be ignored
      spaceId: uuid(),
      createdAt: new Date(),
      createdBy: uuid(),
      externalId: uuid(),
      id: uuid(),
      source: 'collabland',
      sourceId: uuid()
    };

    const updatedRole = await updateRole({
      id: role.id,
      update: updateContent
    });

    expect(updatedRole).toMatchObject({
      ...role,
      name: newName
    });
  });

  it('should throw an error if updating a role imported from guild.xyz', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      source: 'guild_xyz'
    });

    await expect(updateRole({ id: role.id, update: { name: `New Name` } })).rejects.toBeInstanceOf(
      UndesirableOperationError
    );
  });

  it('should throw an error if updating a role imported from summon', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      source: 'summon'
    });

    await expect(updateRole({ id: role.id, update: { name: `New Name` } })).rejects.toBeInstanceOf(
      UndesirableOperationError
    );
  });

  it('should throw an error if ID is invalid', async () => {
    await expect(updateRole({ id: 'invalid-id', update: { name: `New Name` } })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });
});
