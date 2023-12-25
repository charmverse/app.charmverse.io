import type { Page, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { BoardView } from 'lib/focalboard/boardView';
import { InvalidStateError } from 'lib/middleware';
import { generateBoard } from 'testing/setupDatabase';

import { createCardsFromProposals } from '../createCardsFromProposals';
import { extractCardProposalProperties } from '../extractCardProposalProperties';
import { extractDatabaseProposalProperties } from '../extractDatabaseProposalProperties';
import { updateCardsFromProposals } from '../updateCardsFromProposals';

describe('updateCardsFromProposals()', () => {
  let user: User;
  let space: Space;
  let board: Page;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
    board = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      viewDataSource: 'proposals'
    });
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.page.deleteMany({
        where: {
          spaceId: space.id
        }
      }),
      prisma.proposal.deleteMany({
        where: {
          spaceId: space.id
        }
      })
    ]);
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

  it('should update the card proposalStatus and proposalCategory property if the proposal status or category was changed', async () => {
    const database = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      views: 1,
      viewDataSource: 'proposals'
    });
    const pageProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'discussion',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    await createCardsFromProposals({ boardId: database.id, spaceId: space.id, userId: user.id });

    const databaseAfterUpdate = await prisma.block.findUniqueOrThrow({
      where: {
        id: database.id
      }
    });

    const { proposalStatus, proposalUrl } = extractDatabaseProposalProperties({
      boardBlock: databaseAfterUpdate as any
    });

    const discussionValueId = proposalStatus?.options.find((opt) => opt.value === 'discussion')?.id;
    const reviewValueId = proposalStatus?.options.find((opt) => opt.value === 'review')?.id;

    expect(discussionValueId).toBeDefined();
    expect(reviewValueId).toBeDefined();

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

    const cardBlockProposalProps = extractCardProposalProperties({
      card: cardBlock as any,
      databaseProperties: {
        proposalStatus,
        proposalUrl
      }
    });

    expect(cardBlockProposalProps.cardProposalStatus).toBeDefined();
    expect(cardBlockProposalProps.cardProposalStatus?.value).toBe('discussion');
    expect(cardBlockProposalProps.cardProposalStatus?.propertyId).toBe(proposalStatus?.id);
    expect(cardBlockProposalProps.cardProposalCategory).toBeDefined();
    expect(cardBlockProposalProps.cardProposalCategory?.optionId).toBe(pageProposal.categoryId);
    expect(cardBlockProposalProps.cardProposalCategory?.value).toBe(pageProposal.category?.title);

    const updatedProposal = await prisma.proposal.update({
      where: {
        id: pageProposal.id
      },
      data: {
        status: 'review',
        category: {
          create: {
            color: '',
            title: 'New category',
            space: { connect: { id: space.id } }
          }
        }
      },
      include: {
        category: true
      }
    });

    await updateCardsFromProposals({
      boardId: database.id,
      spaceId: space.id,
      userId: user.id
    });

    const databaseAfterSecondUpdate = await prisma.block.findUniqueOrThrow({
      where: {
        id: database.id
      }
    });

    const updatedCard = await prisma.block.findUnique({
      where: {
        id: cardBlock.id
      }
    });

    const updatedCardBlockProposalProps = extractCardProposalProperties({
      card: updatedCard as any,
      databaseProperties: extractDatabaseProposalProperties({ boardBlock: databaseAfterSecondUpdate })
    });

    expect(updatedCardBlockProposalProps.cardProposalStatus).toBeDefined();
    expect(updatedCardBlockProposalProps.cardProposalStatus?.value).toBe('review');
    expect(updatedCardBlockProposalProps.cardProposalStatus?.propertyId).toBe(proposalStatus?.id);
    expect(updatedCardBlockProposalProps.cardProposalCategory).toBeDefined();
    expect(updatedCardBlockProposalProps.cardProposalCategory?.optionId).toBe(updatedProposal.categoryId);
    expect(updatedCardBlockProposalProps.cardProposalCategory?.value).toBe(updatedProposal.category?.title);
  });

  it('should update the card proposalStatus to archived, or revert it to its status if unarchived', async () => {
    const database = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      views: 1,
      viewDataSource: 'proposals'
    });
    const pageProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'discussion',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    await createCardsFromProposals({ boardId: database.id, spaceId: space.id, userId: user.id });

    const databaseAfterUpdate = await prisma.block.findUniqueOrThrow({
      where: {
        id: database.id
      }
    });

    const { proposalStatus, proposalUrl } = extractDatabaseProposalProperties({
      boardBlock: databaseAfterUpdate as any
    });

    const discussionValueId = proposalStatus?.options.find((opt) => opt.value === 'discussion')?.id;
    const archivedValueId = proposalStatus?.options.find((opt) => opt.value === 'archived')?.id;

    expect(discussionValueId).toBeDefined();
    expect(archivedValueId).toBeDefined();

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

    const cardBlockProposalProps = extractCardProposalProperties({
      card: cardBlock as any,
      databaseProperties: {
        proposalStatus,
        proposalUrl
      }
    });

    expect(cardBlockProposalProps.cardProposalStatus).toBeDefined();
    expect(cardBlockProposalProps.cardProposalStatus?.optionId).toBe(discussionValueId);
    expect(cardBlockProposalProps.cardProposalStatus?.value).toBe('discussion');
    expect(cardBlockProposalProps.cardProposalStatus?.propertyId).toBe(proposalStatus?.id);

    // Part 2 ---- Archive the proposal ----
    await prisma.proposal.update({
      where: {
        id: pageProposal.id
      },
      data: {
        archived: true
      },
      include: {
        category: true
      }
    });

    await updateCardsFromProposals({
      boardId: database.id,
      spaceId: space.id,
      userId: user.id
    });
    const updatedCard = await prisma.block.findUnique({
      where: {
        id: cardBlock.id
      }
    });

    const updatedCardBlockProposalProps = extractCardProposalProperties({
      card: updatedCard as any,
      databaseProperties: extractDatabaseProposalProperties({ boardBlock: databaseAfterUpdate })
    });

    expect(updatedCardBlockProposalProps.cardProposalStatus).toBeDefined();
    expect(updatedCardBlockProposalProps.cardProposalStatus?.value).toBe('archived');
    expect(updatedCardBlockProposalProps.cardProposalStatus?.optionId).toBe(archivedValueId);
    expect(updatedCardBlockProposalProps.cardProposalStatus?.propertyId).toBe(proposalStatus?.id);

    // Part 3 ---- Unarchive the proposal ----
    await prisma.proposal.update({
      where: {
        id: pageProposal.id
      },
      data: {
        archived: false
      },
      include: {
        category: true
      }
    });

    await updateCardsFromProposals({
      boardId: database.id,
      spaceId: space.id,
      userId: user.id
    });
    const updatedCardAfterUnArchive = await prisma.block.findUnique({
      where: {
        id: cardBlock.id
      }
    });

    const updatedCardBlockAfterUnArchiveProposalProps = extractCardProposalProperties({
      card: updatedCardAfterUnArchive as any,
      databaseProperties: extractDatabaseProposalProperties({ boardBlock: databaseAfterUpdate })
    });

    expect(updatedCardBlockAfterUnArchiveProposalProps.cardProposalStatus).toBeDefined();
    expect(updatedCardBlockAfterUnArchiveProposalProps.cardProposalStatus?.value).toBe('discussion');
    expect(updatedCardBlockAfterUnArchiveProposalProps.cardProposalStatus?.optionId).toBe(discussionValueId);
    expect(updatedCardBlockAfterUnArchiveProposalProps.cardProposalStatus?.propertyId).toBe(proposalStatus?.id);
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

  it('should not update cards if the database does not have proposals as a source', async () => {
    const database = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      viewDataSource: 'board_page',
      views: 2
    });

    await expect(
      updateCardsFromProposals({ boardId: database.id, spaceId: space.id, userId: user.id })
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
