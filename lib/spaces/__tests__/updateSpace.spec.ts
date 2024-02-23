import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { generateDefaultPropertiesInput } from 'lib/members/generateDefaultPropertiesInput';
import { DuplicateDataError, InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { uid } from 'lib/utilities/strings';
import { generateUserAndSpace } from 'testing/setupDatabase';

import type { UpdateableSpaceFields } from '../updateSpace';
import { updateSpace } from '../updateSpace';

let firstUser: User;
let secondUser: User;

let mockedMixpanelFn: jest.Mock;

jest.mock('lib/snapshot/getSpace', () => ({
  getSnapshotSpace: jest.fn().mockReturnValueOnce({})
}));

beforeAll(async () => {
  firstUser = await prisma.user.create({
    data: {
      path: uid(),
      username: 'firstUser'
    }
  });
  secondUser = await prisma.user.create({
    data: {
      path: uid(),
      username: 'secondUser'
    }
  });
});

afterAll(() => {
  jest.unmock('lib/metrics/mixpanel/updateTrackGroupProfile');
  jest.resetModules();
});

describe('updateSpace', () => {
  it('should only update the space name, domain and logo', async () => {
    const update: UpdateableSpaceFields = {
      name: 'New Space Name',
      domain: 'new-space-name',
      spaceImage: 'https://new-space-logo.png'
    };

    const droppedUpdate: Partial<Omit<Space, keyof UpdateableSpaceFields>> = {
      createdBy: secondUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: v4(),
      defaultPagePermissionGroup: 'view',
      updatedBy: secondUser.id,
      xpsEngineId: v4(),
      deletedAt: new Date(),
      publicBountyBoard: false,
      defaultPostCategoryId: v4(),
      defaultPublicPages: false,
      discordServerId: v4(),
      permissionConfigurationMode: 'readOnly',
      superApiTokenId: v4()
    };

    const space = await prisma.space.create({
      data: {
        domain: `space-domain-${v4()}`,
        name: 'Space Name',
        spaceImage: 'https://space-logo.png',
        updatedBy: firstUser.id,
        publicBountyBoard: true,
        defaultPublicPages: true,
        permissionConfigurationMode: 'collaborative',
        author: {
          connect: {
            id: firstUser.id
          }
        }
      }
    });

    const updatedSpace = await updateSpace(space.id, { ...update, ...droppedUpdate });

    typedKeys(update).forEach((key) => {
      expect(updatedSpace[key]).toEqual(update[key]);
    });

    typedKeys(droppedUpdate).forEach((key) => {
      expect(updatedSpace[key]).not.toEqual(droppedUpdate[key]);
    });
  });

  it('should reset required status of previous identity specific member property', async () => {
    const update: UpdateableSpaceFields = {
      primaryMemberIdentity: 'Discord'
    };

    const { space, user } = await generateUserAndSpace();
    await prisma.memberProperty.createMany({
      data: generateDefaultPropertiesInput({
        userId: user.id,
        spaceId: space.id,
        addNameProperty: true
      })
    });

    await updateSpace(space.id, update);

    const memberProperty = await prisma.memberProperty.findFirstOrThrow({
      where: {
        spaceId: space.id,
        type: 'discord'
      }
    });

    expect(memberProperty.required).toBe(true);

    await updateSpace(space.id, { primaryMemberIdentity: 'Google' });
    const updatedMemberProperty = await prisma.memberProperty.findFirstOrThrow({
      where: {
        spaceId: space.id,
        type: 'discord'
      }
    });
    const newMemberProperty = await prisma.memberProperty.findFirstOrThrow({
      where: {
        spaceId: space.id,
        type: 'google'
      }
    });
    expect(updatedMemberProperty.required).toBe(false);
    expect(newMemberProperty.required).toBe(true);
  });

  it('should update the snapshot and customDomain', async () => {
    const { space } = await generateUserAndSpace();

    const update: UpdateableSpaceFields = {
      customDomain: 'test.charmverse.fyi',
      snapshotDomain: 'snapshot-domain'
    };

    const updatedSpace = await updateSpace(space.id, update);

    expect(updatedSpace.customDomain).toEqual(update.customDomain);
    expect(updatedSpace.snapshotDomain).toEqual(update.snapshotDomain);
  });

  it('should throw an error if no space ID is provided', async () => {
    await expect(updateSpace(null as any, { name: 'New Space Name' })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if the domain is already in use', async () => {
    const firstSpace = await prisma.space.create({
      data: {
        domain: `space-domain-${v4()}`,
        name: 'Space Name',
        spaceImage: 'https://space-logo.png',
        updatedBy: firstUser.id,
        author: {
          connect: {
            id: firstUser.id
          }
        }
      }
    });

    const secondSpace = await prisma.space.create({
      data: {
        domain: `space-domain-${v4()}`,
        name: 'Space Name',
        spaceImage: 'https://space-logo.png',
        updatedBy: firstUser.id,
        author: {
          connect: {
            id: firstUser.id
          }
        }
      }
    });

    await expect(updateSpace(secondSpace.id, { domain: firstSpace.domain })).rejects.toBeInstanceOf(DuplicateDataError);

    // Make sure sending through the update with current space domain and name doesn't throw an error
    const { updatedAt, ...secondSpaceWithoutUpdatedAt } = secondSpace;

    await expect(
      updateSpace(secondSpace.id, {
        domain: secondSpace.domain,
        name: secondSpace.name,
        spaceImage: secondSpace.spaceImage
      })
    ).resolves.toMatchObject(secondSpaceWithoutUpdatedAt);
  });

  it('should update the space profile in mixpanel', async () => {
    const space = await prisma.space.create({
      data: {
        domain: `space-domain-${v4()}`,
        name: 'Space Name',
        spaceImage: 'https://space-logo.png',
        updatedBy: firstUser.id,
        author: {
          connect: {
            id: firstUser.id
          }
        }
      }
    });

    jest.resetModules();

    mockedMixpanelFn = jest.fn();

    jest.mock('lib/metrics/mixpanel/updateTrackGroupProfile', () => ({
      updateTrackGroupProfile: mockedMixpanelFn
    }));

    const { updateSpace: updateSpaceWithMockedMixpanel } = await import('../updateSpace');

    await updateSpaceWithMockedMixpanel(space.id, { name: 'New Space Name' });
    expect(mockedMixpanelFn).toHaveBeenCalled();
  });
});
