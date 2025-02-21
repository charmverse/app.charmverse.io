import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generateMemberProperty } from '@packages/testing/utils/members';
import { InvalidInputError } from '@packages/utils/errors';

import { updateMemberProperty } from '../updateMemberProperty';

describe('updateMemberProperty', () => {
  it('Should throw duplicated option name error', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const property = await generateMemberProperty({
      index: 3,
      type: 'select',
      userId: user.id,
      spaceId: space.id,
      name: 'Select',
      options: [{ name: 'option 1' }]
    });
    await expect(
      updateMemberProperty({
        id: property.id,
        userId: user.id,
        data: {
          options: [{ name: 'option 1' }, { name: 'option 1' }]
        },
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('Should throw when space primary member identity is not required', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    await prisma.space.update({
      data: {
        primaryMemberIdentity: 'Discord'
      },
      where: {
        id: space.id
      }
    });

    const property = await prisma.memberProperty.create({
      data: {
        name: 'Discord',
        type: 'discord',
        space: { connect: { id: space.id } },
        createdBy: user.id,
        updatedBy: user.id
      }
    });

    await expect(
      updateMemberProperty({
        id: property.id,
        userId: user.id,
        data: {
          required: false
        },
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('Should update index of affected properties when moving a property upward', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const property1 = await generateMemberProperty({
      index: 0,
      type: 'number',
      userId: user.id,
      spaceId: space.id,
      name: 'test text1'
    });
    const property2 = await generateMemberProperty({
      index: 1,
      type: 'email',
      userId: user.id,
      spaceId: space.id,
      name: 'test text1'
    });
    const property3 = await generateMemberProperty({
      index: 2,
      type: 'phone',
      userId: user.id,
      spaceId: space.id,
      name: 'test text1'
    });
    const property4 = await generateMemberProperty({
      index: 3,
      type: 'select',
      userId: user.id,
      spaceId: space.id,
      name: 'Select',
      options: [{ name: 'option 1' }]
    });

    await updateMemberProperty({
      id: property3.id,
      userId: user.id,
      spaceId: space.id,
      data: {
        index: 0
      }
    });

    const memberProperties = await prisma.memberProperty.findMany({
      where: {
        spaceId: space.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    expect(memberProperties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: property3.id,
          index: 0
        }),
        expect.objectContaining({
          id: property1.id,
          index: 1
        }),
        expect.objectContaining({
          id: property2.id,
          index: 2
        }),
        expect.objectContaining({
          id: property4.id,
          index: 3
        })
      ])
    );
  });

  it('Should update index of affected properties when moving a property downward', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const property1 = await generateMemberProperty({
      index: 0,
      type: 'number',
      userId: user.id,
      spaceId: space.id,
      name: 'test text1'
    });
    const property2 = await generateMemberProperty({
      index: 1,
      type: 'email',
      userId: user.id,
      spaceId: space.id,
      name: 'test text1'
    });
    const property3 = await generateMemberProperty({
      index: 2,
      type: 'phone',
      userId: user.id,
      spaceId: space.id,
      name: 'test text1'
    });
    const property4 = await generateMemberProperty({
      index: 3,
      type: 'select',
      userId: user.id,
      spaceId: space.id,
      name: 'Select',
      options: [{ name: 'option 1' }]
    });

    await updateMemberProperty({
      id: property2.id,
      userId: user.id,
      spaceId: space.id,
      data: {
        index: 2
      }
    });

    const memberProperties = await prisma.memberProperty.findMany({
      where: {
        spaceId: space.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    expect(memberProperties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: property1.id,
          index: 0
        }),
        expect.objectContaining({
          id: property3.id,
          index: 1
        }),
        expect.objectContaining({
          id: property2.id,
          index: 2
        }),
        expect.objectContaining({
          id: property4.id,
          index: 3
        })
      ])
    );
  });
});
