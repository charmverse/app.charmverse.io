import { Prisma } from '@charmverse/core/prisma';
import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateBoard, generateProposal } from '@packages/testing/setupDatabase';
import { setPageUpdatedAt } from '@packages/lib/proposals/setPageUpdatedAt';
import { v4 } from 'uuid';

import { createMissingCards } from '../createMissingCards';

async function createTestData() {
  const generated = await testUtilsUser.generateUserAndSpace();
  const board = await generateBoard({
    createdBy: generated.user.id,
    spaceId: generated.space.id,
    viewDataSource: 'proposals'
  });
  return {
    ...generated,
    board
  };
}

describe('createMissingCards', () => {
  it('should create cards from proposals', async () => {
    const { user, space, board } = await createTestData();
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
    expect(cards).toHaveLength(1);
    expect(
      cards.every(
        (card) =>
          card.syncWithPageId === newProposal.id &&
          card.title === newProposal.page.title &&
          card.hasContent === newProposal.page.hasContent
      )
    ).toBeTruthy();
  });

  it('should only create cards once', async () => {
    const { user, space, board } = await createTestData();
    const newProposal = await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'published',
      spaceId: space.id,
      userId: user.id
    });
    const cards = await createMissingCards({ boardId: board.id });
    expect(cards).toHaveLength(1);

    // check that we dont create the same cards again
    const newCards = await createMissingCards({ boardId: board.id });
    expect(newCards).toHaveLength(0);
  });

  it('should not create cards from draft proposals', async () => {
    const { user, space, board } = await createTestData();
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
    const { board } = await createTestData();
    const cards = await createMissingCards({ boardId: board.id });

    expect(cards.length).toBe(0);
  });

  it('should not create cards from archived proposals', async () => {
    const { user, space, board } = await createTestData();

    const visibleProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'published',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    const ignoredProposal = await testUtilsProposals.generateProposal({
      authors: [],
      archived: true,
      proposalStatus: 'published',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    const cards = await createMissingCards({ boardId: board.id });

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

  it('should create cards for proposals that were published later', async () => {
    const { user, space, board } = await createTestData();

    const ignoredProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'draft',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    const visibleProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'published',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    const cards = await createMissingCards({ boardId: board.id });
    // expect only one card to be created
    expect(cards.map((c) => c.syncWithPageId)).toEqual([visibleProposal.id]);

    // publish older proposal
    await prisma.proposal.update({
      where: {
        id: ignoredProposal.id
      },
      data: {
        status: 'published'
      }
    });
    await setPageUpdatedAt({ proposalId: ignoredProposal.id, userId: user.id });

    const newCards = await createMissingCards({ boardId: board.id });
    expect(newCards.map((c) => c.syncWithPageId)).toEqual([ignoredProposal.id]);
  });
});
