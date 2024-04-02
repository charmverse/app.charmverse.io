import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { generateBoard } from 'testing/setupDatabase';

import type { IPropertyOption, IPropertyTemplate } from '../board';
import type { BoardViewFields } from '../boardView';
import { Constants } from '../constants';
import { loadAndGenerateCsv } from '../generateCsv';

describe('loadAndGenerateCsv()', () => {
  it('should throw an error if databaseId is not provided', async () => {
    await expect(loadAndGenerateCsv({ userId: 'test-user' })).rejects.toThrow('databaseId is required');
  });

  it('should return a csv string and childPageIds without hidden columns when generating csv for a database', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const selectOptions: IPropertyOption[] = [
      {
        color: 'blue',
        id: v4(),
        value: 'Blue'
      },
      {
        color: 'red',
        id: v4(),
        value: 'Red'
      }
    ];

    const propertyTemplates: IPropertyTemplate[] = [
      {
        type: 'text',
        id: v4(),
        name: 'Text',
        options: []
      },
      {
        type: 'checkbox',
        id: v4(),
        name: 'Checkbox',
        options: []
      },
      {
        type: 'select',
        id: v4(),
        name: 'Select',
        options: selectOptions
      }
    ];

    const generatedBoard = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      cardCount: 3,
      customProps: {
        cardPropertyValues: [
          {
            [Constants.titleColumnId]: 'Card 1',
            [propertyTemplates[0].id]: 'Card 1 Text',
            [propertyTemplates[1].id]: 'false',
            [propertyTemplates[2].id]: selectOptions[0].id
          },
          {
            [Constants.titleColumnId]: 'Card 2',
            [propertyTemplates[0].id]: 'Card 2 Text',
            [propertyTemplates[1].id]: 'false',
            [propertyTemplates[2].id]: selectOptions[1].id
          },
          {
            [Constants.titleColumnId]: 'Card 3',
            [propertyTemplates[0].id]: 'Card 3 Text',
            [propertyTemplates[1].id]: 'true'
          }
        ],
        propertyTemplates
      }
    });

    const view = await prisma.block.findFirstOrThrow({
      where: {
        type: 'view',
        parentId: generatedBoard.id
      },
      select: {
        fields: true,
        id: true
      }
    });

    const viewFields = view.fields as BoardViewFields;
    await prisma.block.update({
      where: {
        id: view.id
      },
      data: {
        fields: {
          ...viewFields,
          visiblePropertyIds: [Constants.titleColumnId, propertyTemplates[0].id, propertyTemplates[2].id]
        }
      }
    });

    const { csvData } = await loadAndGenerateCsv({ viewId: view.id, databaseId: generatedBoard.id, userId: user.id });
    expect(
      csvData
        .trim()
        .split('\n')
        .map((c) => c.trim())
    ).toStrictEqual([
      'Title,Text,Select',
      '"Card 1","Card 1 Text","Blue"',
      '"Card 2","Card 2 Text","Red"',
      '"Card 3","Card 3 Text",""'
    ]);
  });
});
