import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBoard } from '@packages/testing/setupDatabase';
import type { BoardFields, IPropertyTemplate } from '@root/lib/databases/board';
import { renameRelationProperty } from '@root/lib/databases/relationProperty/renameRelationProperty';
import { syncRelationProperty } from '@root/lib/databases/relationProperty/syncRelationProperty';
import { v4 } from 'uuid';

describe('renameRelationProperty', () => {
  it('should rename relation property column name on the connected board', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const generatedBoardPage1 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      boardTitle: 'Test Board'
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

    await syncRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id
    });

    const updatedBoard2 = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard2.id
      },
      select: {
        fields: true
      }
    });

    const connectedRelationProperty = (updatedBoard2.fields as unknown as BoardFields).cardProperties.find(
      (p) => p.relationData?.relatedPropertyId === sourceRelationProperty.id
    ) as IPropertyTemplate;

    expect(connectedRelationProperty.name).toBe('Related to Test Board');

    await renameRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      relatedPropertyTitle: 'Related to Source Board',
      userId: user.id
    });

    const updatedBoard2AfterRename = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard2.id
      },
      select: {
        fields: true
      }
    });

    const connectedRelationPropertyAfterRename = (
      updatedBoard2AfterRename.fields as unknown as BoardFields
    ).cardProperties.find((p) => p.relationData?.relatedPropertyId === sourceRelationProperty.id) as IPropertyTemplate;

    expect(connectedRelationPropertyAfterRename.name).toBe('Related to Source Board');
  });

  it('should rename relation property column name on the same connected board', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const generatedBoardPage1 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      boardTitle: 'Test Board'
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

    await syncRelationProperty({
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

    const connectedRelationProperty = (updatedBoard1.fields as unknown as BoardFields).cardProperties.find(
      (p) => p.relationData?.relatedPropertyId === sourceRelationProperty.id
    ) as IPropertyTemplate;

    expect(connectedRelationProperty.name).toBe('Related to Test Board');

    await renameRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      relatedPropertyTitle: 'Related to Source Board',
      userId: user.id
    });

    const updatedBoard1AfterRename = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard1.id
      },
      select: {
        fields: true
      }
    });

    const connectedRelationPropertyAfterRename = (
      updatedBoard1AfterRename.fields as unknown as BoardFields
    ).cardProperties.find((p) => p.relationData?.relatedPropertyId === sourceRelationProperty.id) as IPropertyTemplate;

    expect(connectedRelationPropertyAfterRename.name).toBe('Related to Source Board');
  });
});
