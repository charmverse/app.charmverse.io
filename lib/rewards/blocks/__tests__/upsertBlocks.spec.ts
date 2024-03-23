import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsBounties } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { PropertyType } from 'lib/databases/board';
import { getBlocks } from 'lib/rewards/blocks/getBlocks';
import type { RewardBlockInput, RewardBlockUpdateInput } from 'lib/rewards/blocks/interfaces';
import { upsertBlock } from 'lib/rewards/blocks/upsertBlock';
import { upsertBlocks } from 'lib/rewards/blocks/upsertBlocks';

describe('reward blocks - updateBlocks', () => {
  it('Should update properties block and reward fields without internal properties', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const textPropertId = v4();

    const propertiesData: RewardBlockInput = {
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

    const block = await upsertBlock({
      userId: user.id,
      data: propertiesData,
      spaceId: space.id
    });

    const reward = await testUtilsBounties.generateBounty({
      spaceId: space.id,
      createdBy: adminUser.id,
      status: 'open',
      approveSubmitters: false
    });

    await prisma.bounty.update({
      where: {
        id: reward.id
      },
      data: {
        customReward: 't-shirt',
        fields: {
          properties: {
            [textPropertId]: 'test1',
            [v4()]: 'test2'
          }
        }
      }
    });

    const propertiesUpdateData: RewardBlockUpdateInput = {
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

    const proposalPropertiesUpdateData: RewardBlockUpdateInput = {
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

    const updatedBlock = await upsertBlocks({
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
