import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { PropertyType } from 'lib/databases/board';
import { getBlocks } from 'lib/proposals/blocks/getBlocks';
import { upsertBlock } from 'lib/proposals/blocks/upsertBlock';
import { upsertBlocks } from 'lib/proposals/blocks/upsertBlocks';

describe('proposal blocks - updateBlocks', () => {
  it('Should update properties block and proposal fields without internal properites', async () => {
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

    const block = await upsertBlock({
      userId: user.id,
      data: propertiesData,
      spaceId: space.id
    });

    const { page, ...proposal1 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'published'
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
      id: proposal1.id,
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

    const udpatedProposal = await prisma.proposal.findUnique({ where: { id: proposal1.id } });

    expect((udpatedProposal?.fields as any)?.properties).toMatchObject({ [textPropertId]: 'test1337' });

    expect(blocks).toMatchObject([propertiesUpdateData]);
  });
});
