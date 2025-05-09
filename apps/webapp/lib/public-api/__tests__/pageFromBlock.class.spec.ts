import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

import type { PageProperty } from '../interfaces';
import { PageFromBlock } from '../pageFromBlock.class';

const exampleBoardSchema: PageProperty[] = [
  {
    id: '87b42bed-1dbe-4491-9b6e-fc4c45caa81e',
    name: 'Status',
    type: 'select',
    options: [
      {
        id: '7154c7b1-9370-4177-8d32-5aec591b158b',
        color: 'propColorTeal',
        value: 'Completed'
      },
      {
        id: '629f8134-058a-4998-9733-042d9e75f2b0',
        color: 'propColorYellow',
        value: 'In progress'
      },
      {
        id: '62f3d1a5-68bc-4c4f-ac99-7cd8f6ceb6ea',
        color: 'propColorRed',
        value: 'Not started'
      }
    ]
  },
  {
    id: '024caba8-addb-4b59-9522-2f1ea1371f43',
    name: 'Text',
    type: 'text',
    options: []
  }
];

describe('PageFromBlock', () => {
  it('should preserve block data and convert properties to human-readable format', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    const createdBlock = await prisma?.block.create({
      data: {
        title: 'Example title',
        id: v4(),
        type: 'card',
        schema: 1,
        updatedBy: user.id,
        parentId: v4(),
        rootId: v4(),
        user: {
          connect: {
            id: user.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        },
        fields: {
          icon: '',
          isTemplate: false,
          properties: {
            '87b42bed-1dbe-4491-9b6e-fc4c45caa81e': '7154c7b1-9370-4177-8d32-5aec591b158b',
            '024caba8-addb-4b59-9522-2f1ea1371f43': 'text value'
          },
          headerImage: null,
          contentOrder: ['650c5f99-872e-4523-96e1-b76317e92ac2']
        }
      }
    });

    const converted = new PageFromBlock(createdBlock, exampleBoardSchema);

    expect(converted.title).toEqual(createdBlock.title);
    expect(converted.properties.Status).toEqual('Completed');
    expect(converted.properties.Text).toEqual('text value');
  });
});
