import { InvalidInputError } from '@charmverse/core/errors';
import { v4 } from 'uuid';

import type { PropertyType } from 'lib/focalboard/board';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import { createBlock } from 'lib/rewards/blocks/createBlock';
import { getBlocks } from 'lib/rewards/blocks/getBlocks';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('reward blocks - createBlock', () => {
  it('Should create board block', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const propertiesData = {
      spaceId: space.id,
      title: 'Properties',
      type: 'board',
      fields: {
        cardProperties: [
          {
            id: v4(),
            name: 'title',
            type: 'string' as PropertyType,
            options: []
          },
          {
            id: v4(),
            name: 'tag',
            type: 'select' as PropertyType,
            options: [
              { id: v4(), color: 'red', value: 'apple' },
              { id: v4(), color: 'blue', value: 'orange' }
            ]
          }
        ]
      }
    };

    const block = await createBlock({
      userId: user.id,
      data: propertiesData,
      spaceId: space.id
    });

    expect(block).toMatchObject(propertiesData);
    expect(block.id).toBe('__defaultBoard');

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks).toMatchObject([propertiesData]);
  });

  it('Should update board block if it already exists', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const propertiesData = {
      id: '__defaultBoard',
      spaceId: space.id,
      title: 'Properties',
      type: 'board',
      fields: {
        cardProperties: [
          {
            id: v4(),
            name: 'title',
            type: 'string' as PropertyType,
            options: []
          },
          {
            id: v4(),
            name: 'tag',
            type: 'select' as PropertyType,
            options: [
              { id: v4(), color: 'red', value: 'apple' },
              { id: v4(), color: 'blue', value: 'orange' }
            ]
          }
        ]
      }
    };

    const propertiesData2 = {
      id: '__defaultBoard',
      spaceId: space.id,
      title: 'Properties 2',
      type: 'board',
      fields: {
        cardProperties: [
          {
            id: v4(),
            name: 'title2',
            type: 'string' as PropertyType,
            options: []
          },
          {
            id: v4(),
            name: 'tag2',
            type: 'select' as PropertyType,
            options: [
              { id: v4(), color: 'red', value: 'apple2' },
              { id: v4(), color: 'blue', value: 'orange2' }
            ]
          }
        ]
      }
    };

    const properties = await createBlock({
      userId: user.id,
      data: propertiesData,
      spaceId: space.id
    });

    const properties2 = await createBlock({
      userId: user.id,
      data: propertiesData2,
      spaceId: space.id
    });

    expect(properties2.id).toEqual(properties.id);
    expect(properties2.fields).toMatchObject(propertiesData2.fields);

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks.length).toBe(1);
  });

  it('Should update view block if it already exists', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const propertiesData = {
      spaceId: space.id,
      id: '__defaultView',
      title: 'Properties',
      type: 'view',
      fields: {
        sortOrder: [{ propertyId: '__title', reversed: true }]
      } as unknown as BoardViewFields
    };

    const propertiesData2 = {
      spaceId: space.id,
      title: 'Properties 2',
      id: '__defaultView',
      type: 'view',
      fields: {
        sortOrder: [{ propertyId: '__title', reversed: false }]
      } as unknown as BoardViewFields
    };

    const properties = await createBlock({
      userId: user.id,
      data: propertiesData,
      spaceId: space.id
    });

    const properties2 = await createBlock({
      userId: user.id,
      data: propertiesData2,
      spaceId: space.id
    });

    expect(properties2.id).toEqual(properties.id);
    expect(properties2.fields).toMatchObject(propertiesData2.fields);

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks.length).toBe(1);
  });
  it('Should throw error input data is missing required fields', async () => {
    const propertiesData = {
      spaceId: '123',
      title: 'Properties',
      type: 'board',
      fields: {
        properties: [
          {
            id: v4(),
            name: 'title',
            type: 'string' as PropertyType,
            options: []
          },
          {
            id: v4(),
            name: 'tag',
            type: 'select' as PropertyType,
            options: [
              { id: v4(), color: 'red', value: 'apple' },
              { id: v4(), color: 'blue', value: 'orange' }
            ]
          }
        ]
      }
    };

    await expect(
      createBlock({ data: { ...propertiesData, type: '' } as any, userId: '123', spaceId: '123' })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      createBlock({ data: { ...propertiesData, fields: null } as any, userId: '123', spaceId: '123' })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
