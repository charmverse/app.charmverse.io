/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import type { Block, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBoard } from '@packages/testing/setupDatabase';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { BlockWithDetails } from 'lib/databases/block';
import type { BoardFields, IPropertyTemplate } from 'lib/databases/board';
import { createMissingCards } from 'lib/databases/proposalsSource/createMissingCards';
import { getCardPropertyTemplates } from 'lib/databases/proposalsSource/getCardProperties';

let adminSpace: Space;

let adminUser: User;

let member: User;

let database: Block;
let databaseCards: Block[];
let databaseViews: Block[];

const sourceDatabaseViewsCount = 3;
const sourceDatabaseCardsCount = 5;

// 1 refers to the database definition block
const totalSourceBlocks = 1 + sourceDatabaseCardsCount + sourceDatabaseViewsCount;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  adminSpace = generated.space;
  adminUser = generated.user;

  member = await testUtilsUser.generateSpaceUser({
    spaceId: adminSpace.id,
    isAdmin: false
  });

  const generatedDatabase = await generateBoard({
    createdBy: adminUser.id,
    spaceId: adminSpace.id,
    views: sourceDatabaseViewsCount,
    cardCount: sourceDatabaseCardsCount
  });

  const generatedDatabaseBlocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          id: generatedDatabase.id
        },
        {
          rootId: generatedDatabase.id
        }
      ]
    }
  });

  database = generatedDatabaseBlocks.find((b) => b.id === generatedDatabase.id) as Block;

  databaseCards = generatedDatabaseBlocks.filter((b) => b.type === 'card');

  databaseViews = generatedDatabaseBlocks.filter((b) => b.type === 'view');

  expect(database).toBeDefined();
  expect(databaseCards.length).toEqual(sourceDatabaseCardsCount);
  expect(databaseViews.length).toBe(sourceDatabaseViewsCount);
});

describe('GET /api/blocks/[id]/subtree', () => {
  it('Should get all board, view and cards blocks for a database if a user can access the database, responding 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', adminCookie).expect(200)
    ).body as Block[];

    expect(databaseBlocks).toHaveLength(totalSourceBlocks);

    expect(databaseBlocks).toEqual(
      expect.arrayContaining(
        [database, ...databaseViews, ...databaseCards].map((block) => expect.objectContaining({ id: block.id }))
      )
    );
  });

  it('Should not return a deleted card block', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const cardToDelete = await prisma.page.update({
      where: {
        id: databaseCards[0].id
      },
      data: {
        deletedAt: new Date()
      }
    });

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', adminCookie).expect(200)
    ).body as Block[];

    expect(databaseBlocks).toHaveLength(totalSourceBlocks - 1);

    expect(databaseBlocks).toEqual(
      expect.arrayContaining(
        [database, ...databaseViews, ...databaseCards]
          .filter((c) => c.id !== cardToDelete.id)
          .map((block) => expect.objectContaining({ id: block.id }))
      )
    );
  });

  it('Should fail if the user cannot access the database, responding 404', async () => {
    const outsideUser = await testUtilsUser.generateUser();
    const outsideUserCookie = await loginUser(outsideUser.id);
    await request(baseUrl).get(`/api/blocks/${database.id}/subtree`).set('Cookie', outsideUserCookie).expect(404);
  });

  // This test uses public permissions to enable access to cards
  it('Should return only the pages a user can access', async () => {
    const sharedDatabase = await generateBoard({
      createdBy: adminUser.id,
      spaceId: adminSpace.id,
      views: sourceDatabaseViewsCount,
      cardCount: sourceDatabaseCardsCount,
      permissions: [
        {
          permissionLevel: 'full_access',
          public: true
        }
      ]
    });
    const outsideUser = await testUtilsUser.generateUser();
    const outsideUserCookie = await loginUser(outsideUser.id);
    const cards = await prisma.block.findMany({
      where: {
        rootId: sharedDatabase.id,
        type: 'card'
      }
    });

    // sanity check
    expect(cards).toHaveLength(sourceDatabaseCardsCount);

    // remove access to one of the cards
    await prisma.pagePermission.delete({
      where: {
        public_pageId: {
          pageId: cards[0].id,
          public: true
        }
      }
    });

    const databaseBlocks = (
      await request(baseUrl)
        .get(`/api/blocks/${sharedDatabase.id}/subtree`)
        .set('Cookie', outsideUserCookie)
        .expect(200)
    ).body as Block[];
    const cardBlocks = databaseBlocks.filter((b) => b.type === 'card');
    expect(cardBlocks).toHaveLength(cards.length - 1);
  });

  it('should return only the filtered pages visible in at least 1 view if the database is locked and they do not have edit_lock permission', async () => {
    const blueOption = {
      id: uuid(),
      value: 'Blue',
      color: 'blue'
    };

    const redOption = {
      id: uuid(),
      value: 'Red',
      color: 'red'
    };

    const greenOption = {
      id: uuid(),
      value: 'Green',
      color: 'green'
    };

    const selectTemplate: IPropertyTemplate = {
      id: uuid(),
      name: 'Select',
      type: 'select',
      options: [blueOption, redOption, greenOption]
    };

    const lockedDatabase = await generateBoard({
      createdBy: adminUser.id,
      spaceId: adminSpace.id,
      viewType: 'table',
      cardCount: 4,
      views: 2,
      customProps: {
        propertyTemplates: [selectTemplate]
      },
      permissions: [
        {
          permissionLevel: 'full_access',
          spaceId: adminSpace.id
        }
      ],
      isLocked: true
    });

    const [redCard, greenCard, blueCard, redCardWithoutPermission] = await prisma.block.findMany({
      where: {
        type: 'card',
        rootId: lockedDatabase.id
      }
    });

    await Promise.all([
      prisma.block.update({
        where: {
          id: redCard.id
        },
        data: {
          fields: {
            ...(redCard.fields as any),
            properties: {
              [selectTemplate.id]: redOption.id
            }
          }
        }
      }),
      prisma.block.update({
        where: {
          id: redCardWithoutPermission.id
        },
        data: {
          fields: {
            ...(redCardWithoutPermission.fields as any),
            properties: {
              [selectTemplate.id]: redOption.id
            }
          }
        }
      }),
      prisma.block.update({
        where: {
          id: greenCard.id
        },
        data: {
          fields: {
            ...(greenCard.fields as any),
            properties: {
              [selectTemplate.id]: greenOption.id
            }
          }
        }
      }),
      prisma.block.update({
        where: {
          id: blueCard.id
        },
        data: {
          fields: {
            ...(blueCard.fields as any),
            properties: {
              [selectTemplate.id]: blueOption.id
            }
          }
        }
      })
    ]);

    await prisma.pagePermission.deleteMany({
      where: {
        pageId: redCardWithoutPermission.id
      }
    });

    const [firstView, secondView] = await prisma.block.findMany({
      where: {
        type: 'view',
        rootId: lockedDatabase.id
      }
    });

    await Promise.all([
      prisma.block.update({
        where: {
          id: firstView.id
        },
        data: {
          fields: {
            ...(firstView.fields as any),
            filter: {
              filters: [
                {
                  values: [redOption.id],
                  filterId: uuid(),
                  condition: 'is',
                  propertyId: selectTemplate.id
                }
              ],
              operation: 'and'
            }
          }
        }
      }),
      prisma.block.update({
        where: {
          id: secondView.id
        },
        data: {
          fields: {
            ...(secondView.fields as any),
            filter: {
              filters: [
                {
                  values: [greenOption.id],
                  filterId: uuid(),
                  condition: 'is',
                  propertyId: selectTemplate.id
                }
              ],
              operation: 'and'
            }
          }
        }
      })
    ]);

    const adminCookie = await loginUser(adminUser.id);
    const memberCookie = await loginUser(member.id);

    // Test admin result
    const adminDatabaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${lockedDatabase.id}/subtree`).set('Cookie', adminCookie).expect(200)
    ).body as BlockWithDetails[];

    const adminCardPageIds = adminDatabaseBlocks.filter((b) => b.type === 'card').map((c) => c.id);
    const adminDbBlock = adminDatabaseBlocks.find((b) => b.type === 'board');
    const adminViewBlocks = adminDatabaseBlocks.filter((b) => b.type === 'view').map((v) => v.id);

    expect(adminCardPageIds).toHaveLength(4);
    expect(adminCardPageIds).toMatchObject(
      expect.arrayContaining([redCard.id, greenCard.id, blueCard.id, redCardWithoutPermission.id])
    );
    expect(adminDbBlock?.id).toEqual(lockedDatabase.id);

    expect(adminViewBlocks).toHaveLength(2);
    expect(adminViewBlocks).toMatchObject(expect.arrayContaining([firstView.id, secondView.id]));

    // Test member result
    const memberDatabaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${lockedDatabase.id}/subtree`).set('Cookie', memberCookie).expect(200)
    ).body as BlockWithDetails[];

    const memberCardPageIds = memberDatabaseBlocks.filter((b) => b.type === 'card').map((c) => c.id);
    const memberDbBlock = memberDatabaseBlocks.find((b) => b.type === 'board');
    const memberViewBlocks = memberDatabaseBlocks.filter((b) => b.type === 'view').map((v) => v.id);

    // User should still get back all the cards since they can edit, except the card that doesnt have any permissions
    expect(memberCardPageIds).toHaveLength(3);
    expect(memberCardPageIds).toMatchObject(expect.arrayContaining([redCard.id, greenCard.id, blueCard.id]));
    expect(memberDbBlock?.id).toEqual(lockedDatabase.id);

    expect(memberViewBlocks).toHaveLength(2);
    expect(memberViewBlocks).toMatchObject(expect.arrayContaining([firstView.id, secondView.id]));

    // Test member result when no edit_lock permission
    await prisma.pagePermission.updateMany({
      where: {
        pageId: {
          in: [lockedDatabase.id, redCard.id, greenCard.id, blueCard.id]
        }
      },
      data: {
        permissionLevel: 'view'
      }
    });

    const memberDatabaseBlocksWhenNoEditPermission = (
      await request(baseUrl).get(`/api/blocks/${lockedDatabase.id}/subtree`).set('Cookie', memberCookie).expect(200)
    ).body as BlockWithDetails[];

    const memberCardPageIdsWhenNoEditPermission = memberDatabaseBlocksWhenNoEditPermission
      .filter((b) => b.type === 'card')
      .map((c) => c.id);
    const memberDbBlockWhenNoEditPermission = memberDatabaseBlocksWhenNoEditPermission.find((b) => b.type === 'board');
    const memberViewBlocksWhenNoEditPermission = memberDatabaseBlocksWhenNoEditPermission
      .filter((b) => b.type === 'view')
      .map((v) => v.id);

    // User should only get back filtered cards since they cannot edit
    expect(memberCardPageIdsWhenNoEditPermission).toHaveLength(2);
    expect(memberCardPageIdsWhenNoEditPermission).toMatchObject(expect.arrayContaining([redCard.id, greenCard.id]));
    expect(memberDbBlockWhenNoEditPermission?.id).toEqual(lockedDatabase.id);

    expect(memberViewBlocksWhenNoEditPermission).toHaveLength(2);
    expect(memberViewBlocksWhenNoEditPermission).toMatchObject(expect.arrayContaining([firstView.id, secondView.id]));
  });
});

describe('GET /api/blocks/[id]/subtree - proposal databases', () => {
  it('Should return only the cards from proposals that the author can access', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    // set up test user
    const reviewer = await testUtilsUser.generateUser();
    await addUserToSpace({
      spaceId: space.id,
      userId: reviewer.id
    });

    // set up proposal-as-a-source db
    const sharedDatabase = await generateBoard({
      createdBy: reviewer.id,
      spaceId: space.id,
      viewDataSource: 'proposals',
      cardCount: 0,
      permissions: [
        {
          permissionLevel: 'full_access',
          userId: reviewer.id
        }
      ]
    });
    const visibleProposal = await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: admin.id,
      authors: [admin.id],
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          permissions: [
            {
              assignee: {
                group: 'all_reviewers'
              },
              operation: 'view'
            }
          ],
          reviewers: [{ id: reviewer.id, group: 'user' }]
        }
      ]
    });
    // proposal is hidden
    await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: admin.id,
      authors: [admin.id],
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          permissions: [],
          reviewers: []
        }
      ]
    });
    const sessionCookie = await loginUser(reviewer.id);

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${sharedDatabase.id}/subtree`).set('Cookie', sessionCookie).expect(200)
    ).body as BlockWithDetails[];

    const cardPageIds = databaseBlocks.filter((b) => b.type === 'card').map((c) => c.syncWithPageId);
    expect(cardPageIds).toEqual([visibleProposal.id]);
  });

  it('Should not return archived proposals', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    // set up proposal-as-a-source db
    const proposalDatabase = await generateBoard({
      createdBy: admin.id,
      spaceId: space.id,
      viewDataSource: 'proposals',
      cardCount: 0
    });
    // proposal is hidden
    const testProposal = await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: admin.id,
      authors: [admin.id],
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          permissions: [],
          reviewers: []
        }
      ]
    });
    // generate cards
    await createMissingCards({ boardId: proposalDatabase.id });

    // mark proposal as archived
    await prisma.proposal.update({
      where: {
        id: testProposal.id
      },
      data: {
        archived: true
      }
    });

    const sessionCookie = await loginUser(admin.id);

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${proposalDatabase.id}/subtree`).set('Cookie', sessionCookie).expect(200)
    ).body as BlockWithDetails[];

    const cards = databaseBlocks.filter((c) => c.type === 'card');
    expect(cards).toHaveLength(0);
  });

  it('Should create new cards', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    // set up proposal-as-a-source db
    const proposalsDatabase = await generateBoard({
      createdBy: admin.id,
      spaceId: space.id,
      viewDataSource: 'proposals',
      cardCount: 0
    });
    const visibleProposal = await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: admin.id
    });
    const sessionCookie = await loginUser(admin.id);

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${proposalsDatabase.id}/subtree`).set('Cookie', sessionCookie).expect(200)
    ).body as BlockWithDetails[];

    const cardPageIds = databaseBlocks.filter((b) => b.type === 'card').map((c) => c.syncWithPageId);
    expect(cardPageIds).toEqual([visibleProposal.id]);
  });

  it('Should return proposal properties', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    // set up proposal-as-a-source db
    const proposalsDatabase = await generateBoard({
      createdBy: admin.id,
      spaceId: space.id,
      viewDataSource: 'proposals',
      cardCount: 0,
      selectedProperties: {
        defaults: ['proposalStep', 'proposalEvaluationType'],
        customProperties: [],
        project: [],
        projectMember: [],
        templateProperties: []
      }
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
    const sessionCookie = await loginUser(admin.id);

    const databaseBlocks = (
      await request(baseUrl).get(`/api/blocks/${proposalsDatabase.id}/subtree`).set('Cookie', sessionCookie).expect(200)
    ).body as BlockWithDetails[];

    const boardBlock = await prisma.block.findFirstOrThrow({
      where: {
        id: proposalsDatabase.boardId!
      }
    });
    const proposalProperties = getCardPropertyTemplates(boardBlock.fields as any as BoardFields);
    const cardBlock = databaseBlocks.find((b) => b.syncWithPageId === visibleProposal.id);

    expect(cardBlock).toBeTruthy();

    expect(cardBlock?.fields.properties).toEqual(
      expect.objectContaining({
        [proposalProperties.proposalStep!.id]: 'Feedback',
        [proposalProperties.proposalEvaluationType!.id]: 'feedback'
      })
    );
  });
});
