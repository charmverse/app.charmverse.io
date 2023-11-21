import { v4 } from 'uuid';

import type { PropertyType } from 'lib/focalboard/board';
import { getBlocks } from 'lib/proposal/blocks/getBlocks';
import { upsertBlock } from 'lib/proposal/blocks/upsertBlock';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('proposal blocks - upsertBlock', () => {
  it('Should update properties block', async () => {
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

    const block = await upsertBlock({
      userId: user.id,
      data: propertiesData,
      spaceId: space.id
    });

    const propertiesUpdateData = {
      id: block.id,
      spaceId: space.id,
      title: 'Update',
      type: 'board',
      fields: {
        cardProperties: [
          {
            id: v4(),
            name: 'tagz',
            type: 'select' as PropertyType,
            options: [
              { id: v4(), color: 'red', value: 'apple' },
              { id: v4(), color: 'blue', value: 'orange' }
            ]
          }
        ]
      }
    };

    const updatedBlock = await upsertBlock({ data: propertiesUpdateData, userId: user.id, spaceId: space.id });

    expect(updatedBlock).toMatchObject(propertiesUpdateData);

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks).toMatchObject([propertiesUpdateData]);
  });

  it('Should update properties block if it already exists', async () => {
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

    const propertiesData2 = {
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

    const properties = await upsertBlock({
      userId: user.id,
      data: propertiesData,
      spaceId: space.id
    });

    const properties2 = await upsertBlock({
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
});
