import type { Page, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { BoardView } from 'lib/focalboard/boardView';
import { InvalidStateError } from 'lib/middleware';
import { generateBoard, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createCardsFromProposals } from '../createCardsFromProposals';
import { updateCardsFromProposals } from '../updateCardsFromProposals';

describe('updateCardsFromProposals()', () => {
  let user: User;
  let space: Space;
  let board: Page;

  beforeAll(async () => {
    const generated = await generateUserAndSpaceWithApiToken();
    user = generated.user;
    space = generated.space;
    board = await generateBoard({
      createdBy: user.id,
      spaceId: space.id
    });
  });

  beforeEach(async () => {
    await prisma.$transaction([prisma.page.deleteMany(), prisma.proposal.deleteMany()]);
  });

  it('should update cards from proposals', async () => {
    const pageProposal = await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'discussion',
      reviewers: [
        {
          group: 'user',
          id: user.id
        }
      ],
      spaceId: space.id,
      userId: user.id
    });

    await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    const updatedProposalPageDetails = {
      title: 'Updated title',
      contentText: 'Updated content text',
      hasContent: true,
      updatedAt: new Date()
    };

    const updatedProposal = await prisma.page.update({
      data: updatedProposalPageDetails,
      where: {
        id: pageProposal.id
      }
    });

    await updateCardsFromProposals({
      boardId: board.id,
      spaceId: space.id,
      userId: user.id
    });

    const updatedCard = await prisma.page.findFirst({
      where: {
        type: 'card',
        syncWithPageId: pageProposal.id
      }
    });

    expect(!!updatedCard).toBeTruthy();
    expect(updatedCard?.title).toBe(updatedProposal.title);
    expect(updatedCard?.contentText).toBe(updatedProposal.contentText);
    expect(updatedCard?.hasContent).toBe(updatedProposal.hasContent);
    expect(pageProposal.page.updatedAt.getTime()).toBeLessThan(updatedCard?.updatedAt.getTime() || 0);
  });

  it('should create cards from proposals if there are new proposals added', async () => {
    await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'discussion',
      reviewers: [
        {
          group: 'user',
          id: user.id
        }
      ],
      spaceId: space.id,
      userId: user.id
    });

    await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    const pageProposal2 = await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'discussion',
      reviewers: [
        {
          group: 'user',
          id: user.id
        }
      ],
      spaceId: space.id,
      userId: user.id
    });

    await updateCardsFromProposals({
      boardId: board.id,
      spaceId: space.id,
      userId: user.id
    });

    const newCreatedCard = await prisma.page.findFirst({
      where: {
        type: 'card',
        syncWithPageId: pageProposal2.id
      }
    });

    expect(newCreatedCard?.syncWithPageId).toBe(pageProposal2.id);
  });

  it('should not create cards from draft proposals', async () => {
    // populate board view
    await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    const pageProposal2 = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'draft',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    await updateCardsFromProposals({
      boardId: board.id,
      spaceId: space.id,
      userId: user.id
    });

    const newCreatedCard = await prisma.page.findFirst({
      where: {
        type: 'card',
        syncWithPageId: pageProposal2.id
      }
    });

    expect(newCreatedCard).toBeNull();
  });
  it('should not create cards from archived proposals', async () => {
    // populate board view
    await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    const pageProposal2 = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'discussion',
      reviewers: [],
      spaceId: space.id,
      userId: user.id,
      archived: true
    });

    await updateCardsFromProposals({
      boardId: board.id,
      spaceId: space.id,
      userId: user.id
    });

    const newCreatedCard = await prisma.page.findFirst({
      where: {
        type: 'card',
        syncWithPageId: pageProposal2.id
      }
    });

    expect(newCreatedCard).toBeNull();
  });

  it('should update the card proposalStatusProperty if the proposal status was changed', async () => {
    const database = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      views: 1
    });

    const pageProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'discussion',
      reviewers: [],
      spaceId: space.id,
      userId: user.id,
      archived: true
    });

    await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    const syncedPage = await prisma.page.findFirstOrThrow({
      where: {
        parentId: database.id,
        syncWithPageId: pageProposal.id
      }
    });

    const cardBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: syncedPage.id
      }
    });

    await prisma.proposal.update({
      where: {
        id: pageProposal.id
      },
      data: {
        status: 'review'
      }
    });

    const pageProposal2 = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'discussion',
      reviewers: [],
      spaceId: space.id,
      userId: user.id,
      archived: true
    });

    await updateCardsFromProposals({
      boardId: board.id,
      spaceId: space.id,
      userId: user.id
    });

    const newCreatedCard = await prisma.page.findFirst({
      where: {
        type: 'card',
        syncWithPageId: pageProposal2.id
      }
    });

    expect(newCreatedCard).toBeNull();
  });

  it('should delete cards from proposals', async () => {
    const pageProposal = await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'discussion',
      reviewers: [
        {
          group: 'user',
          id: user.id
        }
      ],
      spaceId: space.id,
      userId: user.id
    });

    await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    await prisma.page.update({
      where: {
        id: pageProposal.id
      },
      data: {
        deletedAt: new Date()
      }
    });

    await updateCardsFromProposals({
      boardId: board.id,
      spaceId: space.id,
      userId: user.id
    });

    const deletedCard = await prisma.page.findFirst({
      where: {
        type: 'card',
        syncWithPageId: pageProposal.id
      }
    });

    expect(deletedCard).toBeTruthy();
    expect(deletedCard?.deletedAt).toBeTruthy();
  });

  it('should permanently delete cards from proposals', async () => {
    const pageProposal = await testUtilsProposals.generateProposal({
      authors: [user.id],
      proposalStatus: 'discussion',
      reviewers: [
        {
          group: 'user',
          id: user.id
        }
      ],
      spaceId: space.id,
      userId: user.id
    });

    await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    await prisma.$transaction([
      prisma.page.delete({
        where: {
          id: pageProposal.id
        }
      }),
      prisma.proposal.delete({
        where: {
          id: pageProposal.id || ''
        }
      })
    ]);

    await updateCardsFromProposals({
      boardId: board.id,
      spaceId: space.id,
      userId: user.id
    });

    const deletedCard = await prisma.page.findFirst({
      where: {
        type: 'card',
        syncWithPageId: pageProposal.id
      }
    });

    expect(deletedCard).toBeFalsy();
  });

  it('should not update cards if none of the view is connected to a proposal source', async () => {
    const views = await prisma.block.findMany({
      where: {
        type: 'view',
        parentId: board.id
      }
    });

    for (const view of views) {
      await prisma.block.update({
        where: {
          id: view.id
        },
        data: { ...view, fields: { ...(view as unknown as BoardView).fields, sourceType: undefined } }
      });
    }

    await expect(
      updateCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('should not create cards from proposals if board is not found', async () => {
    await expect(
      updateCardsFromProposals({ boardId: v4(), spaceId: space.id, userId: user.id })
    ).rejects.toThrowError();
  });

  it('should not create cards from proposals if a board is not inside a space', async () => {
    await expect(
      updateCardsFromProposals({ boardId: board.id, spaceId: v4(), userId: user.id })
    ).rejects.toThrowError();
  });
});
