import { InvalidInputError } from '@charmverse/core/errors';
import { ProposalBlockType } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createBlock } from 'lib/proposal/blocks/createBlock';
import { getBlocks } from 'lib/proposal/blocks/getBlocks';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('proposal blocks - createBlock', () => {
  it('Should create properties block', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const propertiesData = {
      spaceId: space.id,
      title: 'Properties',
      type: ProposalBlockType.properties,
      fields: {
        properties: [
          {
            id: v4(),
            name: 'title',
            type: 'string',
            options: []
          },
          {
            id: v4(),
            name: 'tag',
            type: 'select',
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
      data: propertiesData
    });

    expect(block).toMatchObject(propertiesData);

    const blocks = await getBlocks({
      spaceId: space.id
    });

    expect(blocks).toMatchObject([propertiesData]);
  });

  it('Should update properties block if it already exists', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const propertiesData = {
      spaceId: space.id,
      title: 'Properties',
      type: ProposalBlockType.properties,
      fields: {
        properties: [
          {
            id: v4(),
            name: 'title',
            type: 'string',
            options: []
          },
          {
            id: v4(),
            name: 'tag',
            type: 'select',
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
      type: ProposalBlockType.properties,
      fields: {
        properties: [
          {
            id: v4(),
            name: 'title2',
            type: 'string',
            options: []
          },
          {
            id: v4(),
            name: 'tag2',
            type: 'select',
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
      data: propertiesData
    });

    const properties2 = await createBlock({
      userId: user.id,
      data: propertiesData2
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
      type: ProposalBlockType.properties,
      fields: {
        properties: [
          {
            id: v4(),
            name: 'title',
            type: 'string',
            options: []
          },
          {
            id: v4(),
            name: 'tag',
            type: 'select',
            options: [
              { id: v4(), color: 'red', value: 'apple' },
              { id: v4(), color: 'blue', value: 'orange' }
            ]
          }
        ]
      }
    };

    await expect(createBlock({ data: { ...propertiesData, spaceId: '' }, userId: '123' })).rejects.toBeInstanceOf(
      InvalidInputError
    );

    await expect(createBlock({ data: { ...propertiesData, type: '' } as any, userId: '123' })).rejects.toBeInstanceOf(
      InvalidInputError
    );

    await expect(
      createBlock({ data: { ...propertiesData, fields: null } as any, userId: '123' })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
