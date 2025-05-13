import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBoard } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

import type { BoardFields, IPropertyTemplate } from '../../board';
import { syncRelationProperty } from '../syncRelationProperty';

describe('syncRelationProperty', () => {
  it('should create relation property on connected board and sync card relation property values', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const generatedBoardPage1 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      cardCount: 3
    });

    const generatedBoardPage2 = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      boardTitle: 'Destination Board',
      cardCount: 3
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

    const board1Cards = await prisma.block.findMany({
      where: {
        parentId: generatedBoard1.id,
        type: 'card'
      },
      select: {
        id: true,
        fields: true
      },
      orderBy: {
        createdAt: 'asc'
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const board2Cards = await prisma.block.findMany({
      where: {
        parentId: generatedBoard2.id,
        type: 'card'
      },
      select: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Board 1 card 1 -> Board 2 card 1, 2
    // Board 1 card 2 -> Board 2 card 2, 3
    // Board 1 card 3 -> N/A

    const board1Card1Fields = board1Cards[0].fields as any;
    const board1Card2Fields = board1Cards[1].fields as any;

    await prisma.block.update({
      data: {
        fields: {
          ...board1Card1Fields,
          properties: {
            ...board1Card1Fields.properties,
            [sourceRelationProperty.id]: board2CardPages.slice(0, 2).map((c) => c.id)
          }
        }
      },
      where: {
        id: board1Cards[0].id
      }
    });

    await prisma.block.update({
      data: {
        fields: {
          ...board1Card2Fields,
          properties: {
            ...board1Card2Fields.properties,
            [sourceRelationProperty.id]: board2CardPages.slice(1, 3).map((c) => c.id)
          }
        }
      },
      where: {
        id: board1Cards[1].id
      }
    });

    // Board 1 connected to Board 2
    await syncRelationProperty({
      boardId: generatedBoard1.id,
      templateId: sourceRelationProperty.id,
      userId: user.id,
      relatedPropertyTitle: 'Related to Source Board'
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

    const connectedRelationProperty = (updatedBoard2.fields as unknown as BoardFields).cardProperties.find(
      (p) => p.relationData?.relatedPropertyId === sourceRelationProperty.id
    ) as IPropertyTemplate;

    const updatedSourceRelationProperty = (updatedBoard1.fields as unknown as BoardFields).cardProperties.find(
      (p) => p.id === sourceRelationProperty.id
    ) as IPropertyTemplate;

    const updatedBoard2Cards = await prisma.block.findMany({
      where: {
        parentId: generatedBoard2.id,
        type: 'card'
      },
      select: {
        fields: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    expect((updatedBoard2Cards[0].fields as any).properties[connectedRelationProperty.id]).toStrictEqual([
      board1CardPages[0].id
    ]);

    expect((updatedBoard2Cards[1].fields as any).properties[connectedRelationProperty.id].sort()).toStrictEqual(
      [board1CardPages[0].id, board1CardPages[1].id].sort()
    );

    expect((updatedBoard2Cards[2].fields as any).properties[connectedRelationProperty.id]).toStrictEqual([
      board1CardPages[1].id
    ]);

    expect(connectedRelationProperty).toStrictEqual({
      id: expect.any(String),
      type: 'relation',
      name: 'Related to Source Board',
      relationData: {
        limit: 'multiple_page',
        relatedPropertyId: sourceRelationProperty.id,
        showOnRelatedBoard: true,
        boardId: generatedBoard1.id
      }
    });

    expect(updatedSourceRelationProperty.relationData?.relatedPropertyId).toStrictEqual(connectedRelationProperty.id);
  });

  // it('should create relation property on the same board and sync card relation property values', async () => {
  //   const { user, space } = await testUtilsUser.generateUserAndSpace();
  //   const generatedBoardPage1 = await generateBoard({
  //     createdBy: user.id,
  //     spaceId: space.id,
  //     cardCount: 3
  //   });

  //   const generatedBoard1 = await prisma.block.findFirstOrThrow({
  //     where: {
  //       id: generatedBoardPage1.boardId!
  //     },
  //     select: {
  //       id: true,
  //       fields: true
  //     }
  //   });

  //   const sourceRelationProperty: IPropertyTemplate = {
  //     id: v4(),
  //     name: 'Connected to Destination Board',
  //     options: [],
  //     type: 'relation',
  //     relationData: {
  //       boardId: generatedBoard1.id,
  //       limit: 'multiple_page',
  //       showOnRelatedBoard: true,
  //       relatedPropertyId: null
  //     }
  //   };

  //   await prisma.block.update({
  //     where: {
  //       id: generatedBoard1.id
  //     },
  //     data: {
  //       fields: {
  //         ...(generatedBoard1.fields as any),
  //         cardProperties: [...((generatedBoard1.fields as any).cardProperties ?? []), sourceRelationProperty]
  //       }
  //     }
  //   });

  //   const board1Cards = await prisma.block.findMany({
  //     where: {
  //       parentId: generatedBoard1.id,
  //       type: 'card'
  //     },
  //     select: {
  //       id: true,
  //       fields: true
  //     }
  //   });

  //   const board1CardPages = await prisma.page.findMany({
  //     where: {
  //       id: {
  //         in: board1Cards.map((c) => c.id)
  //       }
  //     },
  //     select: {
  //       id: true
  //     }
  //   });

  //   // Board 1 card 1 -> Board 1 card 1, 2
  //   // Board 1 card 2 -> Board 1 card 2, 3
  //   // Board 1 card 3 -> N/A

  //   const board1Card1Fields = board1Cards[0].fields as any;
  //   const board1Card2Fields = board1Cards[1].fields as any;

  //   await prisma.block.update({
  //     data: {
  //       fields: {
  //         ...board1Card1Fields,
  //         properties: {
  //           ...board1Card1Fields.properties,
  //           [sourceRelationProperty.id]: board1CardPages.slice(0, 2).map((c) => c.id)
  //         }
  //       }
  //     },
  //     where: {
  //       id: board1Cards[0].id
  //     }
  //   });

  //   await prisma.block.update({
  //     data: {
  //       fields: {
  //         ...board1Card2Fields,
  //         properties: {
  //           ...board1Card2Fields.properties,
  //           [sourceRelationProperty.id]: board1CardPages.slice(1, 3).map((c) => c.id)
  //         }
  //       }
  //     },
  //     where: {
  //       id: board1Cards[1].id
  //     }
  //   });

  //   // Board 1 connected to Board 2
  //   await syncRelationProperty({
  //     boardId: generatedBoard1.id,
  //     templateId: sourceRelationProperty.id,
  //     userId: user.id,
  //     relatedPropertyTitle: 'Related to Source Board'
  //   });

  //   const updatedBoard1 = await prisma.block.findFirstOrThrow({
  //     where: {
  //       id: generatedBoard1.id
  //     },
  //     select: {
  //       fields: true
  //     }
  //   });

  //   const connectedRelationProperty = (updatedBoard1.fields as unknown as BoardFields).cardProperties.find(
  //     (p) => p.relationData?.relatedPropertyId === sourceRelationProperty.id
  //   ) as IPropertyTemplate;

  //   const updatedSourceRelationProperty = (updatedBoard1.fields as unknown as BoardFields).cardProperties.find(
  //     (p) => p.id === sourceRelationProperty.id
  //   ) as IPropertyTemplate;

  //   const updatedBoard1Cards = await prisma.block.findMany({
  //     where: {
  //       parentId: generatedBoard1.id,
  //       type: 'card'
  //     },
  //     select: {
  //       fields: true
  //     }
  //   });

  //   expect((updatedBoard1Cards[0].fields as any).properties[connectedRelationProperty.id]).toStrictEqual([
  //     board1CardPages[0].id
  //   ]);

  //   expect((updatedBoard1Cards[1].fields as any).properties[connectedRelationProperty.id].sort()).toStrictEqual(
  //     [board1CardPages[0].id, board1CardPages[1].id].sort()
  //   );

  //   expect((updatedBoard1Cards[2].fields as any).properties[connectedRelationProperty.id]).toStrictEqual([
  //     board1CardPages[1].id
  //   ]);

  //   expect(connectedRelationProperty).toStrictEqual({
  //     id: expect.any(String),
  //     type: 'relation',
  //     name: 'Related to Source Board',
  //     relationData: {
  //       limit: 'multiple_page',
  //       relatedPropertyId: sourceRelationProperty.id,
  //       showOnRelatedBoard: true,
  //       boardId: generatedBoard1.id
  //     }
  //   });

  //   expect(updatedSourceRelationProperty.relationData?.relatedPropertyId).toStrictEqual(connectedRelationProperty.id);
  // });
});
