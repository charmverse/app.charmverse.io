import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBoard } from '@packages/testing/setupDatabase';
import type { BoardFields, IPropertyTemplate } from '@root/lib/databases/board';
import { syncRelatedCardsValues } from '@root/lib/databases/relationProperty/syncRelatedCardsValues';
import { syncRelationProperty } from '@root/lib/databases/relationProperty/syncRelationProperty';
import { v4 } from 'uuid';

describe('syncRelatedCardsValues', () => {
  it('should sync related cards values', async () => {
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

    const board1Cards = await prisma.block.findMany({
      where: {
        parentId: generatedBoard1.id,
        type: 'card'
      },
      select: {
        id: true,
        fields: true
      }
    });

    const board1CardPages = await prisma.page.findMany({
      where: {
        id: {
          in: board1Cards.map((c) => c.id)
        }
      },
      select: {
        id: true
      }
    });

    const board2Cards = await prisma.block.findMany({
      where: {
        parentId: generatedBoard2.id,
        type: 'card'
      },
      orderBy: {
        id: 'asc'
      },
      select: {
        id: true
      }
    });

    const board2CardPages = await prisma.page.findMany({
      where: {
        id: {
          in: board2Cards.map((c) => c.id)
        }
      },
      select: {
        id: true
      }
    });

    const board2Updated = await prisma.block.findFirstOrThrow({
      where: {
        id: generatedBoard2.id
      },
      select: {
        id: true,
        fields: true
      }
    });

    const connectedRelationProperty = (board2Updated.fields as unknown as BoardFields).cardProperties.find(
      (p) => p.type === 'relation'
    ) as IPropertyTemplate;

    // Board 1 Card 1 -> Board 2 Card 1, 2
    await syncRelatedCardsValues({
      boardId: generatedBoard1.id,
      cardId: board1Cards[0].id,
      pageIds: [board2CardPages[0].id, board2CardPages[1].id],
      templateId: sourceRelationProperty.id,
      userId: user.id
    });

    const board2CardsUpdated = await prisma.block.findMany({
      where: {
        id: {
          in: board2Cards.map((c) => c.id)
        }
      },
      select: {
        id: true,
        fields: true
      }
    });

    const board2Card1 = board2CardsUpdated.find((c) => c.id === board2CardPages[0].id);
    const board2Card2 = board2CardsUpdated.find((c) => c.id === board2CardPages[1].id);

    const board1Card1Page = await prisma.page.findFirstOrThrow({
      where: {
        cardId: board1Cards[0].id
      },
      select: {
        id: true
      }
    });

    expect([
      (board2Card1!.fields as any).properties[connectedRelationProperty.id],
      (board2Card2!.fields as any).properties[connectedRelationProperty.id]
    ]).toStrictEqual([[board1Card1Page.id], [board1Card1Page.id]]);

    // Board 1 Card 2 -> Board 2 Card 1, 2
    await syncRelatedCardsValues({
      boardId: generatedBoard1.id,
      cardId: board1Cards[1].id,
      pageIds: [board2CardPages[0].id, board2CardPages[1].id],
      templateId: sourceRelationProperty.id,
      userId: user.id
    });

    const board2CardsUpdated2 = await prisma.block.findMany({
      where: {
        id: {
          in: board2Cards.map((c) => c.id)
        }
      },
      select: {
        id: true,
        fields: true
      }
    });

    const board2Card1Updated = board2CardsUpdated2.find((c) => c.id === board2CardPages[0].id);
    const board2Card2Updated = board2CardsUpdated2.find((c) => c.id === board2CardPages[1].id);

    expect((board2Card1Updated!.fields as any).properties[connectedRelationProperty.id].sort()).toStrictEqual(
      [board1CardPages[0].id, board1CardPages[1].id].sort()
    );

    expect((board2Card2Updated!.fields as any).properties[connectedRelationProperty.id].sort()).toStrictEqual(
      [board1CardPages[0].id, board1CardPages[1].id].sort()
    );

    // Board 1 Card 2 -> Board 2 Card 1
    await syncRelatedCardsValues({
      boardId: generatedBoard1.id,
      cardId: board1Cards[1].id,
      pageIds: [board2CardPages[0].id],
      templateId: sourceRelationProperty.id,
      userId: user.id
    });

    const board2CardsUpdated3 = await prisma.block.findMany({
      where: {
        id: {
          in: board2Cards.map((c) => c.id)
        }
      },
      select: {
        id: true,
        fields: true
      }
    });

    const board2Card1Updated2 = board2CardsUpdated3.find((c) => c.id === board2CardPages[0].id);
    const board2Card2Updated2 = board2CardsUpdated3.find((c) => c.id === board2CardPages[1].id);

    expect((board2Card1Updated2!.fields as any).properties[connectedRelationProperty.id].sort()).toStrictEqual(
      [board1CardPages[0].id, board1CardPages[1].id].sort()
    );

    expect((board2Card2Updated2!.fields as any).properties[connectedRelationProperty.id]).toStrictEqual([
      board1Card1Page.id
    ]);
  });
});
