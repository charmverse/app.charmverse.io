import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { computeGroupSpacePermissions } from '../../spaces/computeGroupSpacePermissions';
import { updateSpacePermissionConfigurationMode } from '../updateSpacePermissionConfigurationMode';

describe('updateSpacePermissionConfigurationMode', () => {
  it('should set the new mode and return the updated space', async () => {
    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const updatedSpace = await updateSpacePermissionConfigurationMode({
      permissionConfigurationMode: 'custom',
      spaceId: space.id
    });

    expect(updatedSpace.permissionConfigurationMode).toBe('custom');
  });

  it('should update individual settings to match the readOnly template', async () => {
    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const updatedSpace = await updateSpacePermissionConfigurationMode({
      permissionConfigurationMode: 'readOnly',
      spaceId: space.id
    });

    expect(updatedSpace.permissionConfigurationMode).toBe('readOnly');
    expect(updatedSpace.defaultPagePermissionGroup).toBe('view');
    expect(updatedSpace.defaultPublicPages).toBe(false);

    const spacePermissions = await computeGroupSpacePermissions({
      group: 'space',
      id: space.id,
      resourceId: space.id
    });

    expect(spacePermissions.createBounty).toBe(false);
    expect(spacePermissions.createPage).toBe(false);

    const { publicBountyBoard } = (await prisma.space.findUnique({
      where: {
        id: space.id
      },
      select: {
        publicBountyBoard: true
      }
    })) as Space;

    expect(publicBountyBoard).toBe(false);
  });

  it('should update individual settings to match the collaborative template', async () => {
    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const updatedSpace = await updateSpacePermissionConfigurationMode({
      permissionConfigurationMode: 'collaborative',
      spaceId: space.id
    });

    expect(updatedSpace.permissionConfigurationMode).toBe('collaborative');
    expect(updatedSpace.defaultPagePermissionGroup).toBe('full_access');
    expect(updatedSpace.defaultPublicPages).toBe(false);

    const spacePermissions = await computeGroupSpacePermissions({
      group: 'space',
      id: space.id,
      resourceId: space.id
    });

    expect(spacePermissions.createBounty).toBe(true);
    expect(spacePermissions.createPage).toBe(true);

    const { publicBountyBoard } = (await prisma.space.findUnique({
      where: {
        id: space.id
      },
      select: {
        publicBountyBoard: true
      }
    })) as Space;

    expect(publicBountyBoard).toBe(false);
  });

  it('should update individual settings to match the public template', async () => {
    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const updatedSpace = await updateSpacePermissionConfigurationMode({
      permissionConfigurationMode: 'open',
      spaceId: space.id
    });

    expect(updatedSpace.permissionConfigurationMode).toBe('open');
    expect(updatedSpace.defaultPagePermissionGroup).toBe('full_access');
    expect(updatedSpace.defaultPublicPages).toBe(true);

    const spacePermissions = await computeGroupSpacePermissions({
      group: 'space',
      id: space.id,
      resourceId: space.id
    });

    expect(spacePermissions.createBounty).toBe(true);
    expect(spacePermissions.createPage).toBe(true);

    const { publicBountyBoard } = (await prisma.space.findUnique({
      where: {
        id: space.id
      },
      select: {
        publicBountyBoard: true
      }
    })) as Space;

    expect(publicBountyBoard).toBe(true);
  });

  it('should fail if the new mode is invalid', async () => {
    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);
    try {
      await updateSpacePermissionConfigurationMode({
        permissionConfigurationMode: 'invalid-setting' as any,
        spaceId: space.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if the space does not exist', async () => {
    try {
      await updateSpacePermissionConfigurationMode({
        permissionConfigurationMode: 'open',
        spaceId: v4()
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
