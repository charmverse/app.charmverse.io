import { testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { generateBoard } from 'testing/setupDatabase';

import type { IPropertyOption, IPropertyTemplate } from '../board';
import { Constants } from '../constants';
import { loadAndGenerateCsv } from '../generateCsv';

describe('loadAndGenerateCsv()', () => {
  it('should throw an error if databaseId is not provided', async () => {
    await expect(loadAndGenerateCsv({ userId: 'test-user' })).rejects.toThrow('databaseId is required');
  });

  it('should return a csv string and childPageIds when generating csv for a database', async () => {
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

    const { csvData } = await loadAndGenerateCsv({ databaseId: generatedBoard.id, userId: user.id });
    expect(
      csvData
        .trim()
        .split('\n')
        .map((c) => c.trim())
    ).toStrictEqual([
      'Title,Text,Checkbox,Select',
      '"Card 1","Card 1 Text","false","Blue"',
      '"Card 2","Card 2 Text","false","Red"',
      '"Card 3","Card 3 Text","true",""'
    ]);
  });
});
