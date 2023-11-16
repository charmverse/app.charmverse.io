import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { PropertyType } from 'lib/focalboard/board';
import { createBlock } from 'lib/rewards/blocks/createBlock';
import { getBlocks } from 'lib/rewards/blocks/getBlocks';
import { updateBlocks } from 'lib/rewards/blocks/updateBlocks';
import { createReward } from 'lib/rewards/createReward';

describe('reward blocks - updateBlocks', () => {
  it('Should update properties block and reward fields without internal properites', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const textPropertId = v4();

    const propertiesData = {
      spaceId: space.id,
      title: 'Properties',
      type: 'board',
      fields: {
        cardProperties: [
          {
            id: textPropertId,
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

    const { reward } = await createReward({
      spaceId: space.id,
      userId: adminUser.id,
      customReward: 't-shirt',
      fields: {
        properties: {
          [textPropertId]: 'test1',
          [v4()]: 'test2'
        }
      }
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

    const proposalPropertiesUpdateData = {
      type: 'card',
      id: reward.id,
      fields: {
        properties: {
          __internal: '123',
          __view: 'table',
          [textPropertId]: 'test1337'
        }
      }
    };

    const updatedBlock = await updateBlocks({
      blocksData: [propertiesUpdateData, proposalPropertiesUpdateData],
      userId: user.id,
      spaceId: space.id
    });

    expect(updatedBlock[0]).toMatchObject(propertiesUpdateData);

    const blocks = await getBlocks({
      spaceId: space.id
    });

    const updatedReward = await prisma.bounty.findUnique({ where: { id: reward.id } });

    expect((updatedReward?.fields as any)?.properties).toMatchObject({ [textPropertId]: 'test1337' });

    expect(blocks).toMatchObject([propertiesUpdateData]);
  });
});
