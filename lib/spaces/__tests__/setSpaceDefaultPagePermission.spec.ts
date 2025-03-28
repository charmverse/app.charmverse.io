import type { Space } from '@charmverse/core/prisma';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { InvalidInputError } from '@packages/utils/errors';
import { SpaceNotFoundError } from '@root/lib/public-api';
import { v4 } from 'uuid';

import { setSpaceDefaultPagePermission } from '../setSpaceDefaultPagePermission';

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generated.space;
});

describe('setSpaceDefaultPagePermission', () => {
  it('should throw error if no space is found with the id', async () => {
    try {
      await setSpaceDefaultPagePermission({
        defaultPagePermissionGroup: 'editor',
        spaceId: v4()
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(SpaceNotFoundError);
    }
  });

  it('Should set the default page permission level for a space and return the updated space', async () => {
    const spaceWithPermission = await setSpaceDefaultPagePermission({
      defaultPagePermissionGroup: 'view',
      spaceId: space.id
    });
    expect(spaceWithPermission.defaultPagePermissionGroup).toBe('view');
  });

  // We don't yet use the custom option
  it('Should fail to set the default page permission level to custom', async () => {
    await expect(
      setSpaceDefaultPagePermission({
        defaultPagePermissionGroup: 'custom',
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
