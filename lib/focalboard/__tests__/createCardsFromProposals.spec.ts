import { InvalidInputError } from '@charmverse/core/errors';
import type { Page, ProposalCategory, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import isEqual from 'lodash/isEqual';
import { v4 } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import { generateBoard, generateProposal } from 'testing/setupDatabase';

import type { CardFields } from '../card';
import { createCardsFromProposals } from '../createCardsFromProposals';
import type { ExtractedDatabaseProposalProperties } from '../extractDatabaseProposalProperties';
import { extractDatabaseProposalProperties } from '../extractDatabaseProposalProperties';

describe('createCardsFromProposals', () => {
  let user: User;
  let space: Space;
  let board: Page;
  let proposalCategory: ProposalCategory;

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
    proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });
  });

  beforeEach(async () => {
    await prisma.$transaction([prisma.page.deleteMany(), prisma.proposal.deleteMany()]);
  });

  it('should create cards from proposals with the proposal properties set', async () => {
    const newProposal = await generateProposal({
      authors: [user.id],
      proposalStatus: 'discussion',
      categoryId: proposalCategory.id,
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

    const database = await prisma.block.findUniqueOrThrow({
      where: {
        id: board.id
      }
    });

    const databaseSchema = (await extractDatabaseProposalProperties({
      database
    })) as Required<ExtractedDatabaseProposalProperties>;

    const card = await prisma.block.findFirstOrThrow({
      where: {
        id: cards[0].id
      }
    });

    expect((card.fields as CardFields).properties).toMatchObject({
      [databaseSchema.proposalCategory.id]: proposalCategory.id,
      [databaseSchema.proposalStatus.id]:
        databaseSchema.proposalStatus.options.find((opt) => opt.value === 'discussion')?.id ?? 'error',
      [databaseSchema.proposalUrl.id]: newProposal.path
    });
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

  it('should initialise the database with all proposal properties visible', async () => {
    const database = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    await createCardsFromProposals({ boardId: database.id, spaceId: space.id, userId: user.id });

    const databaseAfterUpdate = await prisma.block.findUnique({
      where: {
        id: database.id
      }
    });

    const properties = (databaseAfterUpdate?.fields as any).cardProperties as IPropertyTemplate[];
    const proposalUrlProp = properties.find((prop) => prop.type === 'proposalUrl');
    const proposalStatusProp = properties.find((prop) => prop.type === 'proposalStatus');
    const proposalCategoryProp = properties.find((prop) => prop.type === 'proposalCategory');

    expect(proposalUrlProp).toBeDefined();
    expect(proposalStatusProp).toBeDefined();
    expect(proposalCategoryProp).toBeDefined();

    const view = await prisma.block.findFirstOrThrow({
      where: {
        parentId: database.id,
        type: 'view'
      }
    });

    const visibleProperties = (view?.fields as any).visiblePropertyIds as string[];

    ['__title', proposalUrlProp?.id, proposalStatusProp?.id, proposalCategoryProp?.id].forEach((propertyKey) => {
      expect(visibleProperties.includes(propertyKey as string)).toBe(true);
    });
  });

  it('should not create cards from proposals if board is not found', async () => {
    await expect(
      createCardsFromProposals({ boardId: v4(), spaceId: space.id, userId: user.id })
    ).rejects.toThrowError();
  });

  it('should not create cards from proposals if a board is not inside a space', async () => {
    await expect(
      createCardsFromProposals({ boardId: board.id, spaceId: v4(), userId: user.id })
    ).rejects.toThrowError();
  });

  it('should throw an error if boardId or spaceId is invalid', async () => {
    await expect(
      createCardsFromProposals({ boardId: board.id, spaceId: 'Bad space id', userId: user.id })
    ).rejects.toThrowError(InvalidInputError);

    await expect(
      createCardsFromProposals({ boardId: 'bad board id', spaceId: space.id, userId: user.id })
    ).rejects.toThrowError(InvalidInputError);
  });

  it('should not create cards if no proposals are found', async () => {
    const cards = await createCardsFromProposals({ boardId: board.id, spaceId: space.id, userId: user.id });

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
      proposalStatus: 'discussion',
      reviewers: [],
      spaceId: testSpace.id,
      userId: testUser.id
    });

    const ignoredProposal = await testUtilsProposals.generateProposal({
      authors: [],
      archived: true,
      proposalStatus: 'discussion',
      reviewers: [],
      spaceId: testSpace.id,
      userId: testUser.id
    });

    const cards = await createCardsFromProposals({ boardId: testBoard.id, spaceId: testSpace.id, userId: testUser.id });

    expect(cards.length).toBe(1);

    expect(cards[0].syncWithPageId).toBe(visibleProposal.id);
  });
});
