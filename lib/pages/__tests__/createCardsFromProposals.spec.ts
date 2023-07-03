import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { Page, Space, User } from '@charmverse/core/prisma-client';
import isEqual from 'lodash/isEqual';
import { v4 } from 'uuid';

import { generateUserAndSpaceWithApiToken, generateBoard, generateProposal } from 'testing/setupDatabase';

import { createCardsFromProposals } from '../createCardsFromProposals';

describe('createCardsFromProposals()', () => {
  let user: User;
  let space: Space;
  let board: Page;

  beforeAll(async () => {
    const generated = await generateUserAndSpaceWithApiToken();
    user = generated.user;
    space = generated.space;
    const generatedBoard = await generateBoard({
      createdBy: user.id,
      spaceId: space.id
    });
    board = generatedBoard;
  });

  beforeEach(async () => {
    await prisma.$transaction([prisma.page.deleteMany(), prisma.proposal.deleteMany()]);
  });

  it('should create cards from proposals', async () => {
    const newProposal = await generateProposal({
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

    const cards = await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    expect(cards.length).toBe(1);

    expect(
      cards.every(
        (card) =>
          card.syncWithPageId === newProposal.id &&
          card.title === newProposal.title &&
          card.contentText === newProposal.contentText &&
          card.hasContent === newProposal.hasContent &&
          isEqual(newProposal.content, card.content)
      )
    ).toBeTruthy();
  });

  it('should not create cards from draft proposals', async () => {
    await generateProposal({
      authors: [],
      proposalStatus: 'draft',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    const cards = await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    expect(cards.length).toBe(0);
  });

  it('should not create cards from proposals if board is not found', async () => {
    await expect(
      createCardsFromProposals({ boardId: v4(), spaceId: space.id, userId: user.id })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should not create cards from proposals if a board is not inside a space', async () => {
    await expect(
      createCardsFromProposals({ boardId: board.id, spaceId: v4(), userId: user.id })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should not create cards if no proposals are found', async () => {
    const cards = await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

    expect(cards.length).toBe(0);
  });
});
