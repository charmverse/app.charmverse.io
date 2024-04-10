import { Prisma } from '@charmverse/core/prisma';
import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { generateBoard, generateProposal } from 'testing/setupDatabase';

import { createMissingCards } from '../createMissingCards';

describe('createMissingCards', () => {
  let user: User;
  let space: Space;
  let board: Page;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
    const generatedBoard = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      viewDataSource: 'proposals'
    });
    board = generatedBoard;
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.page.deleteMany({
        where: {
          spaceId: space.id,
          id: {
            not: board.id
          }
        }
      }),
      prisma.proposal.deleteMany({
        where: {
          spaceId: space.id
        }
      })
    ]);
  });

  it('should create cards from proposals', async () => {
    const newProposal = await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'published',
      reviewers: [
        {
          group: 'user',
          id: user.id
        }
      ],
      spaceId: space.id,
      userId: user.id
    });
    const cards = await createMissingCards({ boardId: board.id });
    expect(cards.length).toBe(1);
    expect(
      cards.every(
        (card) =>
          card.syncWithPageId === newProposal.id &&
          card.title === newProposal.page.title &&
          card.hasContent === newProposal.page.hasContent
      )
    ).toBeTruthy();
  });

  it('should not create cards from draft proposals', async () => {
    await generateProposal({
      authors: [],
      proposalStatus: 'draft',
      spaceId: space.id,
      userId: user.id
    });

    const cards = await createMissingCards({ boardId: board.id });

    expect(cards.length).toBe(0);
  });

  it('should not create cards from proposals if board is not found', async () => {
    await expect(createMissingCards({ boardId: v4() })).rejects.toThrowError();
  });

  it('should throw an error if boardId  is invalid', async () => {
    await expect(createMissingCards({ boardId: 'bad board id' })).rejects.toThrowError(
      Prisma.PrismaClientKnownRequestError
    );
  });

  it('should not create cards if no proposals are found', async () => {
    const cards = await createMissingCards({ boardId: board.id });

    expect(cards.length).toBe(0);
  });

  // TODO ---- Cleanup tests above. They are mutating the same board, and only returning newly created cards.
  it('should not create cards from archived proposals', async () => {
    const { space: testSpace, user: testUser } = await testUtilsUser.generateUserAndSpace();

    const testBoard = await generateBoard({
      createdBy: testUser.id,
      spaceId: testSpace.id,
      viewDataSource: 'proposals'
    });

    const visibleProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'published',
      reviewers: [],
      spaceId: testSpace.id,
      userId: testUser.id
    });

    const ignoredProposal = await testUtilsProposals.generateProposal({
      authors: [],
      archived: true,
      proposalStatus: 'published',
      reviewers: [],
      spaceId: testSpace.id,
      userId: testUser.id
    });

    const cards = await createMissingCards({ boardId: testBoard.id });

    expect(cards.length).toBe(1);

    expect(cards[0].syncWithPageId).toBe(visibleProposal.id);
  });

  it('should create cards with permissions matching the parent', async () => {
    const { space: testSpace, user: testUser } = await testUtilsUser.generateUserAndSpace();

    const role = await testUtilsMembers.generateRole({
      createdBy: testUser.id,
      spaceId: testSpace.id
    });

    const testBoard = await generateBoard({
      createdBy: testUser.id,
      spaceId: testSpace.id,
      viewDataSource: 'proposals',
      cardCount: 0,
      permissions: [
        {
          permissionLevel: 'editor',
          userId: testUser.id
        },
        {
          permissionLevel: 'full_access',
          roleId: role.id
        }
      ]
    });

    const rootBoardPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: testBoard.id
      }
    });

    expect(rootBoardPermissions).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({ userId: testUser.id, permissionLevel: 'editor' }),
        expect.objectContaining({ roleId: role.id, permissionLevel: 'full_access' })
      ])
    );

    const visibleProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'published',
      reviewers: [],
      spaceId: testSpace.id,
      userId: testUser.id
    });

    await createMissingCards({ boardId: testBoard.id });

    const pages = await prisma.page.findMany({
      where: {
        parentId: testBoard.id
      },
      include: {
        permissions: true
      }
    });

    expect(pages).toHaveLength(1);

    const cardPermissions = pages[0].permissions;

    expect(cardPermissions).toMatchObject(
      expect.arrayContaining(
        rootBoardPermissions.map((p) => ({
          ...p,
          id: expect.any(String),
          inheritedFromPermission: p.id,
          pageId: pages[0].id
        }))
      )
    );
  });
});
