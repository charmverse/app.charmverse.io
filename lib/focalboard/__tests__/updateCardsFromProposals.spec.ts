import type { FormField, Page, Prisma, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { InvalidStateError } from 'lib/middleware';
import type { ProposalFields } from 'lib/proposal/interface';
import { randomETHWalletAddress } from 'lib/utilities/blockchain';
import { generateBoard, generateProposal, generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import type { BoardFields, IPropertyTemplate } from '../board';
import type { BoardViewFields } from '../boardView';
import type { CardFields } from '../card';
import { createCardsFromProposals } from '../createCardsFromProposals';
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

  it(`should update the card properties values based on the custom properties values, add/edit/delete properties to boards, cards and views`, async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });

    const proposal = await testUtilsProposals.generateProposal({
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

    const defaultBoard = getDefaultBoard({
      evaluationStepTitles: []
    });

    const customProperties: IPropertyTemplate[] = [
      {
        id: v4(),
        name: 'Text',
        type: 'text',
        options: []
      },
      {
        id: v4(),
        name: 'Select',
        type: 'select',
        options: [
          {
            id: v4(),
            value: 'Option 1',
            color: 'propColorGray'
          },
          {
            id: v4(),
            value: 'Option 2',
            color: 'propColorGray'
          }
        ]
      }
    ];

    await prisma.proposalBlock.create({
      data: {
        fields: {
          ...defaultBoard.fields,
          cardProperties: [
            ...defaultBoard.fields.cardProperties,
            ...customProperties
          ] as unknown as Prisma.InputJsonArray
        },
        id: defaultBoard.id,
        spaceId: testSpace.id,
        createdBy: proposalAuthor.id,
        rootId: testSpace.id,
        updatedBy: proposalAuthor.id,
        type: 'board',
        title: 'Proposals',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        parentId: testSpace.id,
        schema: 1
      }
    });

    const proposalFields = (proposal.fields as ProposalFields) ?? {};

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        fields: {
          ...proposalFields,
          properties: {
            ...proposalFields.properties,
            [customProperties[0].id]: 'Text',
            [customProperties[1].id]: customProperties[1].options[0].id
          }
        }
      }
    });

    const databaseBoard = await generateBoard({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    // Delete existing cards
    await prisma.block.deleteMany({
      where: {
        parentId: databaseBoard.id,
        type: 'card'
      }
    });

    await createCardsFromProposals({
      boardId: databaseBoard.id,
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const databaseBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: databaseBoard.boardId!
      },
      select: {
        fields: true
      }
    });

    const boardCardProperties = (databaseBlock?.fields as unknown as BoardFields)?.cardProperties ?? [];

    const textProperty = boardCardProperties.find(
      (prop) => prop.id === customProperties[0].id && prop.proposalFieldId === customProperties[0].id
    ) as IPropertyTemplate;

    // Rename the first custom property
    customProperties[0].name = 'Text Column Updated';

    // Add a new custom property
    customProperties.push({
      id: v4(),
      name: 'Number',
      type: 'number',
      options: []
    });

    // Add a new proposal
    const proposal2 = await testUtilsProposals.generateProposal({
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

    const proposal2Fields = (proposal2.fields as ProposalFields) ?? {};

    await prisma.proposal.update({
      where: {
        id: proposal2.id
      },
      data: {
        fields: {
          ...proposal2Fields,
          properties: {
            ...proposal2Fields.properties,
            [customProperties[0].id]: 'Text 2',
            [customProperties[1].id]: customProperties[1].options[1].id,
            [customProperties[2].id]: 10
          }
        }
      }
    });

    // Delete a custom property
    await prisma.proposalBlock.update({
      where: {
        id_spaceId: {
          id: defaultBoard.id,
          spaceId: testSpace.id
        }
      },
      data: {
        fields: {
          ...defaultBoard.fields,
          // Remove the select property
          cardProperties: [customProperties[0], customProperties[2]] as unknown as Prisma.InputJsonArray
        }
      }
    });

    // Update the value of existing proposal custom property
    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        fields: {
          ...proposalFields,
          properties: {
            ...proposalFields.properties,
            [customProperties[0].id]: 'Text Updated'
          }
        }
      }
    });

    await updateCardsFromProposals({
      boardId: databaseBoard.id,
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const updatedCardBlocks = await prisma.block.findMany({
      where: {
        parentId: databaseBoard.id,
        spaceId: testSpace.id,
        type: 'card'
      },
      select: {
        fields: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const updatedBoardBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: databaseBoard.boardId!
      },
      select: {
        fields: true
      }
    });

    const updatedBoardCardProperties = (updatedBoardBlock?.fields as unknown as BoardFields)?.cardProperties ?? [];

    const cardBlock1Fields = updatedCardBlocks[0]?.fields as unknown as CardFields;
    const cardBlock2Fields = updatedCardBlocks[1]?.fields as unknown as CardFields;

    const numberProperty = updatedBoardCardProperties.find(
      (prop) => prop.id === customProperties[2].id && prop.proposalFieldId === customProperties[2].id
    ) as IPropertyTemplate;
    const updatedTextProperty = updatedBoardCardProperties.find(
      (prop) => prop.id === textProperty.id && prop.proposalFieldId === textProperty.id
    ) as IPropertyTemplate;
    const updatedSelectProperty = updatedBoardCardProperties.find(
      (prop) => prop.id === customProperties[1].id && prop.proposalFieldId === customProperties[1].id
    ) as IPropertyTemplate;

    expect(cardBlock1Fields.properties[textProperty.id]).toBe('Text Updated');
    expect(cardBlock2Fields.properties[textProperty.id]).toBe('Text 2');
    expect(cardBlock2Fields.properties[numberProperty.id]).toBe(10);
    expect(numberProperty).toBeDefined();
    expect(updatedTextProperty).toBeDefined();
    expect(updatedTextProperty.name).toBe('Text Column Updated');
    expect(updatedSelectProperty).toBeUndefined();

    const updatedViews = await prisma.block.findMany({
      where: {
        parentId: databaseBoard.id,
        type: 'view'
      },
      select: {
        fields: true
      }
    });

    const updatedViewFields = updatedViews[0]?.fields as unknown as BoardViewFields;
    expect(updatedViewFields.visiblePropertyIds.includes(updatedTextProperty.id)).toBeTruthy();
    expect(updatedViewFields.visiblePropertyIds.includes(numberProperty.id)).toBeTruthy();
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
