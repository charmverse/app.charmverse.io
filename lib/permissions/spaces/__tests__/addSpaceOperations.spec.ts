import type { Space, User } from '@charmverse/core/prisma';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { InsecureOperationError, InvalidInputError, MissingDataError } from '@packages/utils/errors';

import { AssignableToRolesOnlyError, InvalidPermissionGranteeError } from '../../errors';
import { addSpaceOperations } from '../addSpaceOperations';
import { computeGroupSpacePermissions } from '../computeGroupSpacePermissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('addSpaceOperations', () => {
  it('should grant abilities to a specific user', async () => {
    await addSpaceOperations<'user'>({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: user.id
    });
    const createdPermission = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'user',
      id: user.id
    });

    expect(createdPermission.createPage).toBe(true);
    expect(createdPermission.createBounty).toBe(false);
  });

  it('should grant abilities to a specific role', async () => {
    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      roleId: role.id
    });
    const createdPermission = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'role',
      id: role.id
    });

    expect(createdPermission.createPage).toBe(true);
    expect(createdPermission.createBounty).toBe(false);
  });

  it('should grant abilities for a space to its members', async () => {
    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      spaceId: space.id
    });
    const createdPermission = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'space',
      id: space.id
    });

    expect(createdPermission.createPage).toBe(true);
    expect(createdPermission.createBounty).toBe(false);
  });

  it('should add new operations to an existing permission', async () => {
    const extraUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createBounty'],
      userId: extraUser.id
    });
    const updatedPermission = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'user',
      id: extraUser.id
    });

    // Ensures we modified existing record instead of creating new one
    expect(updatedPermission.createPage).toBe(true);
    expect(updatedPermission.createBounty).toBe(true);
  });

  it('should succeed if the assignee already has this permission', async () => {
    const extraUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });
    const createdPermission = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'user',
      id: extraUser.id
    });
    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });
    const updatedPermission = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'user',
      id: extraUser.id
    });

    // Nothing has changed
    expect(updatedPermission.createPage).toBe(createdPermission.createPage);
    expect(updatedPermission.createBounty).toBe(createdPermission.createBounty);
  });

  it('should only allow roles as assignees for moderateForums', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    // Test by adding multiple operations to make sure moderateForums doesn't slip through
    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage', 'moderateForums'],
      roleId: role.id
    });
    const createdPermission = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'role',
      id: role.id
    });

    expect(createdPermission.moderateForums).toBe(true);

    await expect(
      addSpaceOperations({
        forSpaceId: space.id,
        operations: ['createPage', 'moderateForums'],
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(AssignableToRolesOnlyError);

    await expect(
      addSpaceOperations({
        forSpaceId: space.id,
        operations: ['createPage', 'moderateForums'],
        userId: user.id
      })
    ).rejects.toBeInstanceOf(AssignableToRolesOnlyError);
  });

  it('should fail if 0 assignee groups are provided', async () => {
    try {
      await addSpaceOperations({
        forSpaceId: space.id,
        operations: ['createPage']
      } as any);
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidPermissionGranteeError);
    }
  });

  it('should fail if more than 1 assignee group is provided', async () => {
    try {
      await addSpaceOperations({
        forSpaceId: space.id,
        operations: ['createPage'],
        userId: user.id,
        spaceId: space.id as any
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidPermissionGranteeError);
    }
  });

  it('should fail if an invalid operation is provided', async () => {
    try {
      await addSpaceOperations({
        forSpaceId: space.id,
        operations: ['invalidOperation' as any],
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if no operations are provided', async () => {
    const extraUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    try {
      await addSpaceOperations({
        forSpaceId: space.id,
        operations: [],
        userId: extraUser.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(MissingDataError);
    }
  });

  // This is for now as a security measure. In future, we may allow cross-space permissions
  it('should fail if the assigned space ID is different from target space ID', async () => {
    const { space: otherSpace } = await generateUserAndSpaceWithApiToken();

    try {
      await addSpaceOperations({
        forSpaceId: space.id,
        operations: ['createPage'],
        spaceId: otherSpace.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should fail if the assigned role is not part of the target space', async () => {
    const { space: otherSpace } = await generateUserAndSpaceWithApiToken();

    const role = await generateRole({
      createdBy: user.id,
      spaceId: otherSpace.id
    });

    try {
      await addSpaceOperations({
        forSpaceId: space.id,
        operations: ['createPage'],
        roleId: role.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should fail if the assigned user is not a member of the target space', async () => {
    const { user: externalUser } = await generateUserAndSpaceWithApiToken();

    try {
      await addSpaceOperations({
        forSpaceId: space.id,
        operations: ['createPage'],
        userId: externalUser.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });
});
