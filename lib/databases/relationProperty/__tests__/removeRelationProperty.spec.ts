import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBoard } from '@packages/testing/setupDatabase';
import type { IPropertyTemplate } from '@root/lib/databases/board';
import { removeRelationProperty } from '@root/lib/databases/relationProperty/removeRelationProperty';
import { syncRelationProperty } from '@root/lib/databases/relationProperty/syncRelationProperty';
import { v4 } from 'uuid';

describe('removeRelationProperty', () => {
  it('should disconnect relation property on connected board', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const generatedBoardPage1 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id
    });

    const generatedBoardPage2 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      boardTitle: 'Destination Board'
    });

    const generatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoardPage1.boardId!
      },
      select: {
        id: true,
        fields: true
      }
    });

    const generatedBoard2 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoardPage2.boardId!
      },
      select: {
        id: true,
        fields: true
      }
    });

    const sourceRelationProperty: IPropertyTemplate = {
      id: v4(),
      name: 'Connected to Destination Board',
      options: [],
      type: 'relation',
      relationData: {
        boardId: generatedBoard2.id,
        limit: 'multiple_page',
        showOnRelatedBoard: true,
        relatedPropertyId: null
      }
    };

    await prisma.block.update({
      where: {
        id: generatedBoard1.id
      },
      data: {
        fields: {
          ...(generatedBoard1.fields as any),
          cardProperties: [...((generatedBoard1.fields as any).cardProperties ?? []), sourceRelationProperty]
        }
      }
    });

    // Board 1 connected to Board 2
    await syncRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id,
      relatedPropertyTitle: 'Related to Source Board'
    });

    await removeRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id
    });

    const updatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard1.id
      },
      select: {
        fields: true
      }
    });

    const updatedSourceRelationProperty = (updatedBoard1.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.id === sourceRelationProperty.id
    );

    const updatedBoard2 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard2.id
      },
      select: {
        fields: true
      }
    });

    const connectedRelationProperty = (updatedBoard2.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.type === 'relation'
    );

    expect(connectedRelationProperty).toStrictEqual({
      id: expect.any(String),
      type: 'relation',
      name: 'Related to Source Board',
      relationData: {
        limit: 'multiple_page',
        relatedPropertyId: null,
        showOnRelatedBoard: false,
        boardId: generatedBoard1.id
      }
    });

    expect(updatedSourceRelationProperty).toBeUndefined();
  });

  it('should remove relation property on connected board', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const generatedBoardPage1 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id
    });

    const generatedBoardPage2 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      boardTitle: 'Destination Board'
    });

    const generatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoardPage1.boardId!
      },
      select: {
        id: true,
        fields: true
      }
    });

    const generatedBoard2 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoardPage2.boardId!
      },
      select: {
        id: true,
        fields: true
      }
    });

    const sourceRelationProperty: IPropertyTemplate = {
      id: v4(),
      name: 'Connected to Destination Board',
      options: [],
      type: 'relation',
      relationData: {
        boardId: generatedBoard2.id,
        limit: 'multiple_page',
        showOnRelatedBoard: true,
        relatedPropertyId: null
      }
    };

    await prisma.block.update({
      where: {
        id: generatedBoard1.id
      },
      data: {
        fields: {
          ...(generatedBoard1.fields as any),
          cardProperties: [...((generatedBoard1.fields as any).cardProperties ?? []), sourceRelationProperty]
        }
      }
    });

    // Board 1 connected to Board 2
    await syncRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id,
      relatedPropertyTitle: 'Related to Source Board'
    });

    await removeRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id,
      removeBoth: true
    });

    const updatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard1.id
      },
      select: {
        fields: true
      }
    });

    const updatedBoard2 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard2.id
      },
      select: {
        fields: true
      }
    });

    const connectedRelationProperty = (updatedBoard2.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.type === 'relation'
    );

    const updatedSourceRelationProperty = (updatedBoard1.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.id === sourceRelationProperty.id
    );

    expect(updatedSourceRelationProperty).toBeUndefined();
    expect(connectedRelationProperty).toBeUndefined();
  });

  it('should disconnect relation property on same connected board', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const generatedBoardPage1 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id
    });

    const generatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoardPage1.boardId!
      },
      select: {
        id: true,
        fields: true
      }
    });

    const sourceRelationProperty: IPropertyTemplate = {
      id: v4(),
      name: 'Connected to Destination Board',
      options: [],
      type: 'relation',
      relationData: {
        boardId: generatedBoard1.id,
        limit: 'multiple_page',
        showOnRelatedBoard: true,
        relatedPropertyId: null
      }
    };

    await prisma.block.update({
      where: {
        id: generatedBoard1.id
      },
      data: {
        fields: {
          ...(generatedBoard1.fields as any),
          cardProperties: [...((generatedBoard1.fields as any).cardProperties ?? []), sourceRelationProperty]
        }
      }
    });

    // Board 1 connected to Board 2
    await syncRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id,
      relatedPropertyTitle: 'Related to Source Board'
    });

    await removeRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id
    });

    const updatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard1.id
      },
      select: {
        fields: true
      }
    });

    const updatedSourceRelationProperty = (updatedBoard1.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.id === sourceRelationProperty.id
    );

    const connectedRelationProperty = (updatedBoard1.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.type === 'relation'
    );

    expect(connectedRelationProperty).toStrictEqual({
      id: expect.any(String),
      type: 'relation',
      name: 'Related to Source Board',
      relationData: {
        limit: 'multiple_page',
        relatedPropertyId: null,
        showOnRelatedBoard: false,
        boardId: generatedBoard1.id
      }
    });

    expect(updatedSourceRelationProperty).toBeUndefined();
  });

  it('should remove relation property on same connected board', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const generatedBoardPage1 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id
    });

    const generatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoardPage1.boardId!
      },
      select: {
        id: true,
        fields: true
      }
    });

    const sourceRelationProperty: IPropertyTemplate = {
      id: v4(),
      name: 'Connected to Destination Board',
      options: [],
      type: 'relation',
      relationData: {
        boardId: generatedBoard1.id,
        limit: 'multiple_page',
        showOnRelatedBoard: true,
        relatedPropertyId: null
      }
    };

    await prisma.block.update({
      where: {
        id: generatedBoard1.id
      },
      data: {
        fields: {
          ...(generatedBoard1.fields as any),
          cardProperties: [...((generatedBoard1.fields as any).cardProperties ?? []), sourceRelationProperty]
        }
      }
    });

    // Board 1 connected to Board 2
    await syncRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id,
      relatedPropertyTitle: 'Related to Source Board'
    });

    await removeRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id,
      removeBoth: true
    });

    const updatedBoard1 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard1.id
      },
      select: {
        fields: true
      }
    });

    const connectedRelationProperty = (updatedBoard1.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.type === 'relation'
    );

    const updatedSourceRelationProperty = (updatedBoard1.fields as any).cardProperties.find(
      (cp: IPropertyTemplate) => cp.id === sourceRelationProperty.id
    );

    expect(updatedSourceRelationProperty).toBeUndefined();
    expect(connectedRelationProperty).toBeUndefined();
  });
});
