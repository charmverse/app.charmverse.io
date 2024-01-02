import type { FormField, Page, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { InvalidStateError } from 'lib/middleware';
import { randomETHWalletAddress } from 'lib/utilities/blockchain';
import { generateBoard, generateProposal, generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import type { BoardFields, IPropertyTemplate } from '../board';
import type { CardFields } from '../card';
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

  it('should update the card properties values based on proposal form field answers, add new properties to board and new cards', async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace();
    const spaceMember = await generateUser();
    await addUserToSpace({
      spaceId: testSpace.id,
      userId: spaceMember.id
    });

    const proposal = await generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'discussion',
      reviewers: [
        {
          group: 'user',
          id: proposalAuthor.id
        }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const form = await prisma.form.create({
      data: {
        formFields: {
          createMany: {
            data: [
              {
                name: 'Short text',
                type: 'short_text'
              }
            ]
          }
        },
        proposal: {
          connect: {
            id: proposal.id
          }
        }
      },
      include: {
        formFields: true
      }
    });

    const formFields = form.formFields;
    const shortTextField = formFields.find((field) => field.type === 'short_text') as FormField;

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          fieldId: shortTextField.id,
          proposalId: proposal.id,
          type: shortTextField.type,
          value: 'Short Text'
        }
      ]
    });

    const database = await generateBoard({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    await createCardsFromProposals({
      boardId: database.id,
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const proposal2 = await generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'discussion',
      reviewers: [
        {
          group: 'user',
          id: proposalAuthor.id
        }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    await prisma.form.update({
      where: {
        id: form.id
      },
      data: {
        proposal: {
          connect: {
            id: proposal2.id
          }
        }
      }
    });

    const emailFormFieldId = v4();
    const walletFormFieldId = v4();

    await prisma.formField.createMany({
      data: [
        {
          id: emailFormFieldId,
          name: 'Email',
          type: 'email',
          formId: form.id
        },
        {
          id: walletFormFieldId,
          name: 'Wallet',
          type: 'wallet',
          formId: form.id,
          private: true
        }
      ]
    });

    const walletAddress = randomETHWalletAddress();

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          type: shortTextField.type,
          value: 'Short text2',
          fieldId: shortTextField.id,
          proposalId: proposal2.id
        },
        {
          type: 'email',
          value: 'john.doe@gmail.com',
          fieldId: emailFormFieldId,
          proposalId: proposal2.id
        },
        {
          type: 'wallet',
          value: walletAddress,
          fieldId: walletFormFieldId,
          proposalId: proposal2.id
        }
      ]
    });

    // Space member visits the board and triggers the update
    // Even though the member doesn't have access to the private wallet field, since the database was created by the proposal author, the wallet field should be added to the board
    await updateCardsFromProposals({
      boardId: database.id,
      spaceId: testSpace.id,
      userId: spaceMember.id
    });

    const databaseAfterUpdate = await prisma.block.findUniqueOrThrow({
      where: {
        id: database.id
      }
    });

    const boardProperties = (databaseAfterUpdate.fields as unknown as BoardFields).cardProperties;
    const emailProp = boardProperties.find((prop) => prop.formFieldId === emailFormFieldId) as IPropertyTemplate;
    const walletProp = boardProperties.find((prop) => prop.formFieldId === walletFormFieldId) as IPropertyTemplate;
    const shortTextProp = boardProperties.find((prop) => prop.formFieldId === shortTextField.id) as IPropertyTemplate;

    // New card property was added since new form field was added
    expect(emailProp).toMatchObject(
      expect.objectContaining({
        name: 'Email',
        type: 'email'
      })
    );

    expect(walletProp).toMatchObject(
      expect.objectContaining({
        name: 'Wallet',
        type: 'text'
      })
    );

    const cardBlocks = await prisma.block.findMany({
      where: {
        parentId: database.id,
        type: 'card',
        spaceId: testSpace.id,
        page: {
          syncWithPageId: {
            not: null
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const card1Properties = (cardBlocks[0].fields as unknown as CardFields).properties;
    const card2Properties = (cardBlocks[1].fields as unknown as CardFields).properties;

    expect(card1Properties[shortTextProp.id]).toBe('Short Text');
    expect(card1Properties[emailProp.id]).toBeUndefined();
    expect(card1Properties[walletProp.id]).toBeUndefined();

    //
    expect(card2Properties[shortTextProp.id]).toBe('Short text2');
    expect(card2Properties[emailProp.id]).toBe('john.doe@gmail.com');
    expect(card2Properties[walletProp.id]).toBe(walletAddress);
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
