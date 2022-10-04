import type { Space, SpaceOperation, SpacePermission } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { addSpaceOperations } from '../addSpaceOperations';
import { removeSpaceOperations } from '../removeSpaceOperations';

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  space = generated.space;
});

describe('removeSpaceOperations', () => {

  it('should remove the target operation from the stored operations for that group', async () => {

    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    await addSpaceOperations<'user'>({
      forSpaceId: space.id,
      operations: ['createPage', 'createBounty'],
      userId: extraUser.id
    });

    await removeSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    const spacePermission = await prisma.spacePermission.findUnique({
      where: {
        userId_forSpaceId: {
          forSpaceId: space.id,
          userId: extraUser.id
        }
      }
    }) as SpacePermission;

    expect(spacePermission.operations.length).toBe(1);
    expect(spacePermission.operations[0]).toBe('createBounty');
  });

  it('should delete a permission if it will have 0 operations after the operation is removed', async () => {

    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    await addSpaceOperations<'user'>({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    await removeSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    const inexistentPermission = await prisma.spacePermission.findUnique({
      where: {
        userId_forSpaceId: {
          forSpaceId: space.id,
          userId: extraUser.id
        }
      }
    });

    expect(inexistentPermission).toBeNull();

  });

  it('should remove a permission from actions group can perform', async () => {

    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    await addSpaceOperations<'user'>({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    const result = await removeSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    expect(result.createPage).toBe(false);
  });

  it('should return the current set of operations if no change happened', async () => {

    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    await addSpaceOperations<'user'>({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    const initialResult = await removeSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    const duplicateDeleteResult = await removeSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: extraUser.id
    });

    (Object.keys(initialResult) as SpaceOperation[]).forEach(op => {
      expect(duplicateDeleteResult[op]).toEqual(initialResult[op]);
    });

  });

});
