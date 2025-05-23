/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import type { BoardFields, IPropertyTemplate } from '@packages/databases/board';
import type { BoardViewFields } from '@packages/databases/boardView';
import { getDefaultBoard } from '@packages/lib/proposals/blocks/boardData';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBoard, generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 } from 'uuid';

describe('POST /api/pages/[id]/proposal-source', () => {
  it('Should assign proposal source to the database, responding 200', async () => {
    const { user, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });
    const databaseBoard = await generateBoard({
      createdBy: user.id,
      spaceId: testSpace.id,
      viewDataSource: 'proposals'
    });
    const sessionCookie = await loginUser(user.id);

    await request(baseUrl)
      .post(`/api/pages/${databaseBoard.id}/proposal-source`)
      .set('Cookie', sessionCookie)
      .expect(200);
  });

  it('Should fail if the user cannot access the database, responding 401', async () => {
    const { user, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });
    const databaseBoard = await generateBoard({
      createdBy: user.id,
      spaceId: testSpace.id,
      viewDataSource: 'proposals'
    });
    const outsideUser = await testUtilsUser.generateUser();
    const outsideUserCookie = await loginUser(outsideUser.id);
    await request(baseUrl)
      .post(`/api/pages/${databaseBoard.id}/proposal-source`)
      .set('Cookie', outsideUserCookie)
      .expect(401);
  });

  it(`should add custom proposal properties as card properties and add them to visible properties for all views as an admin`, async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });

    const defaultBoard = getDefaultBoard({
      evaluationStepTitles: []
    });

    const customProperties: IPropertyTemplate[] = [
      {
        id: v4(),
        name: 'Text',
        type: 'text',
        options: []
      },
      {
        id: v4(),
        name: 'Select',
        type: 'select',
        options: [
          {
            id: v4(),
            value: 'Option 1',
            color: 'propColorGray'
          },
          {
            id: v4(),
            value: 'Option 2',
            color: 'propColorGray'
          }
        ]
      }
    ];

    await prisma.proposalBlock.create({
      data: {
        fields: {
          ...defaultBoard.fields,
          cardProperties: [
            ...defaultBoard.fields.cardProperties,
            ...customProperties
          ] as unknown as Prisma.InputJsonArray
        },
        id: defaultBoard.id,
        spaceId: testSpace.id,
        createdBy: proposalAuthor.id,
        rootId: testSpace.id,
        updatedBy: proposalAuthor.id,
        type: 'board',
        title: 'Proposals',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        parentId: testSpace.id,
        schema: 1
      }
    });

    const databaseBoard = await generateBoard({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    const sessionCookie = await loginUser(proposalAuthor.id);

    await request(baseUrl)
      .post(`/api/pages/${databaseBoard.id}/proposal-source`)
      .set('Cookie', sessionCookie)
      .expect(200);

    const databaseBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: databaseBoard.boardId!
      },
      select: {
        fields: true
      }
    });

    const boardCardProperties = (databaseBlock?.fields as unknown as BoardFields)?.cardProperties ?? [];

    const textProperty = boardCardProperties.find((prop) => prop.id === customProperties[0].id);
    const selectProperty = boardCardProperties.find((prop) => prop.id === customProperties[1].id);

    expect(textProperty).toBeDefined();
    expect(selectProperty).toBeDefined();

    const views = await prisma.block.findMany({
      where: {
        parentId: databaseBoard.id,
        type: 'view'
      },
      select: {
        fields: true
      }
    });

    const viewFields = views[0]?.fields as unknown as BoardViewFields;
    expect(viewFields.visiblePropertyIds.includes(customProperties[0].id)).toBe(true);
    expect(viewFields.visiblePropertyIds.includes(customProperties[1].id)).toBe(true);
  });
});
