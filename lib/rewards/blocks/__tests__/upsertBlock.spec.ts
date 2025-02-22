import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import type { PropertyType } from '@root/lib/databases/board';
import type { BoardViewFields } from '@root/lib/databases/boardView';
import { getBlocks } from '@root/lib/rewards/blocks/getBlocks';
import type { RewardBlockInput, RewardBlockUpdateInput } from '@root/lib/rewards/blocks/interfaces';
import { upsertBlock } from '@root/lib/rewards/blocks/upsertBlock';
import { v4 } from 'uuid';

describe('reward blocks - updateBlock', () => {
  it('Should create board block', async () => {
    const { user, space } = await generateUserAndSpace();

    const propertiesData: RewardBlockInput = {
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

    expect(block).toMatchObject(propertiesData);
    expect(block.id).toBe('__defaultBoard');

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks).toMatchObject([propertiesData]);
  });

  it('Should update board block', async () => {
    const { user, space } = await generateUserAndSpace();

    const propertiesData: RewardBlockInput = {
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

    const propertiesUpdateData: RewardBlockUpdateInput = {
      id: block.id,
      spaceId: space.id,
      title: 'Update',
      type: 'board',
      fields: {
        viewIds: [],
        icon: '',
        columnCalculations: {},
        description: null as any,
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
    const { user, space } = await generateUserAndSpace();

    const propertiesData: RewardBlockInput = {
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

    const propertiesData2: RewardBlockInput = {
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
    expect(properties2.fields).toMatchObject(propertiesData2.fields!);

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks.length).toBe(1);
  });

  it('Should update view block if it already exists', async () => {
    const { user, space } = await generateUserAndSpace();

    const propertiesData: RewardBlockInput = {
      spaceId: space.id,
      id: '__defaultView',
      title: 'Properties',
      type: 'view',
      fields: {
        sortOrder: [{ propertyId: '__title', reversed: true }]
      } as unknown as BoardViewFields
    };

    const propertiesData2: RewardBlockInput = {
      spaceId: space.id,
      title: 'Properties 2',
      id: '__defaultView',
      type: 'view',
      fields: {
        sortOrder: [{ propertyId: '__title', reversed: false }]
      } as unknown as BoardViewFields
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
    expect(properties2.fields).toMatchObject(propertiesData2.fields!);

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks.length).toBe(1);
  });
});
