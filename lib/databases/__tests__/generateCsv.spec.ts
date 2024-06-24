import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsProposals } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { createMissingCards } from 'lib/databases/proposalsSource/createMissingCards';
import { generateBoard } from 'testing/setupDatabase';
import { generateProposalSourceDb } from 'testing/utils/proposals';

import type { IPropertyOption, IPropertyTemplate } from '../board';
import type { BoardViewFields } from '../boardView';
import { Constants } from '../constants';
import { loadAndGenerateCsv } from '../generateCsv';

describe('loadAndGenerateCsv()', () => {
  it('should throw an error if databaseId is not provided', async () => {
    await expect(loadAndGenerateCsv({ userId: 'test-user', databaseId: '' })).rejects.toThrow('databaseId is required');
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
      'Title\tText\tSelect',
      '"Card 1"\t"Card 1 Text"\t"Blue"',
      '"Card 2"\t"Card 2 Text"\t"Red"',
      '"Card 3"\t"Card 3 Text"\t""'
    ]);
  });

  it('Should return proposal properties', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const visibleProposal = await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: admin.id,
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          permissions: [],
          reviewers: []
        }
      ]
    });

    // create and attach a form
    const form = await prisma.form.create({
      data: {
        formFields: {
          createMany: {
            data: [
              {
                name: 'first field',
                type: 'project_profile',
                fieldConfig: { projectMember: {} }
              }
            ]
          }
        }
      }
    });

    // create and attach a test project
    const project = await prisma.project.create({
      data: {
        createdBy: admin.id,
        updatedBy: admin.id,
        name: 'Test project',
        projectMembers: {
          createMany: {
            data: [
              {
                name: 'first guy',
                updatedBy: admin.id
              },
              {
                name: 'second guy',
                updatedBy: admin.id
              }
            ]
          }
        }
      }
    });

    await prisma.proposal.update({
      where: {
        id: visibleProposal.id
      },
      data: {
        formId: form.id,
        projectId: project.id
      }
    });

    // set up proposal-as-a-source db
    const proposalsDatabase = await generateProposalSourceDb({
      createdBy: admin.id,
      spaceId: space.id
    });

    // generate cards
    await createMissingCards({ boardId: proposalsDatabase.id });

    const { csvData } = await loadAndGenerateCsv({ databaseId: proposalsDatabase.id, userId: admin.id });
    const firstRow = csvData.trim().split('\n')[1];
    expect(firstRow).toContain(visibleProposal.page.title);
    expect(firstRow).toContain('In Progress');
    expect(firstRow).toContain('Feedback');
    expect(firstRow).toContain('Test project');
    expect(firstRow).toContain('first guy,second guy');
  });
});
