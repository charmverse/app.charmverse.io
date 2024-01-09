import { InvalidInputError } from '@charmverse/core/errors';
import type { FormField, Page, Prisma, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import isEqual from 'lodash/isEqual';
import { v4 } from 'uuid';

import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import type { BoardFields, IPropertyTemplate } from 'lib/focalboard/board';
import type { ProposalFields } from 'lib/proposal/interface';
import { generateBoard, generateProposal, generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import type { BoardViewFields } from '../boardView';
import type { CardFields } from '../card';
import { createCardsFromProposals } from '../createCardsFromProposals';

describe('createCardsFromProposals', () => {
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

    expect(proposalUrlProp).toBeDefined();
    expect(proposalStatusProp).toBeDefined();

    const view = await prisma.block.findFirstOrThrow({
      where: {
        parentId: database.id,
        type: 'view'
      }
    });

    const visibleProperties = (view?.fields as any).visiblePropertyIds as string[];

    ['__title', proposalUrlProp?.id, proposalStatusProp?.id].forEach((propertyKey) => {
      expect(visibleProperties.includes(propertyKey as string)).toBe(true);
    });
  });

  it(`should add custom proposal properties as card properties and add them to visible properties for all views as an admin`, async () => {
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

    const [cardPage] = await createCardsFromProposals({
      boardId: databaseBoard.id,
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const cardBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: cardPage.cardId!
      },
      select: {
        fields: true
      }
    });

    const cardBlockFields = cardBlock?.fields as unknown as CardFields;

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
    );
    const selectProperty = boardCardProperties.find(
      (prop) => prop.id === customProperties[1].id && prop.proposalFieldId === customProperties[1].id
    );

    expect(textProperty).toBeDefined();
    expect(selectProperty).toBeDefined();

    expect(cardBlockFields.properties[customProperties[0].id]).toBe('Text');
    expect(cardBlockFields.properties[customProperties[1].id]).toBe(customProperties[1].options[0].id);

    const views = await prisma.block.findMany({
      where: {
        parentId: databaseBoard.id,
        type: 'view'
      },
      select: {
        fields: true
      }
    });

    const viewFields = views[0]?.fields as unknown as BoardViewFields;
    expect(viewFields.visiblePropertyIds.includes(customProperties[0].id)).toBe(true);
    expect(viewFields.visiblePropertyIds.includes(customProperties[1].id)).toBe(true);
  });

  it(`should add proposal form fields as card properties and add them to visible properties for all views as an admin`, async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });
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
                name: 'Short Text',
                type: 'short_text',
                private: true
              },
              {
                name: 'Email',
                type: 'email'
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
    const shortTextFormField = formFields.find((field) => field.type === 'short_text') as FormField;
    const emailFormField = formFields.find((field) => field.type === 'email') as FormField;

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          fieldId: shortTextFormField.id,
          proposalId: proposal.id,
          value: 'Short Text Answer',
          type: shortTextFormField.type
        },
        {
          fieldId: emailFormField.id,
          proposalId: proposal.id,
          value: 'john.doe@gmail.com',
          type: emailFormField.type
        }
      ]
    });

    const database1 = await generateBoard({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    const [cardPage] = await createCardsFromProposals({
      boardId: database1.id,
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const database1Block = await prisma.block.findUnique({
      where: {
        id: database1.boardId!
      },
      select: {
        fields: true
      }
    });

    const database1Properties = (database1Block?.fields as unknown as BoardFields).cardProperties;
    const shortText1Prop = database1Properties.find(
      (prop) => prop.formFieldId === shortTextFormField.id
    ) as IPropertyTemplate;
    const email1Prop = database1Properties.find((prop) => prop.formFieldId === emailFormField.id) as IPropertyTemplate;

    const databaseCard = await prisma.block.findUnique({
      where: {
        id: cardPage.cardId!
      },
      select: {
        fields: true
      }
    });

    const cardProperties = (databaseCard?.fields as unknown as CardFields).properties;
    expect(cardProperties[shortText1Prop.id]).toBe('Short Text Answer');
    expect(cardProperties[email1Prop.id]).toBe('john.doe@gmail.com');

    // Testing with a regular space member to check if private fields are transferred to card properties or not
    const database2 = await generateBoard({
      createdBy: spaceMember.id,
      spaceId: testSpace.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    const [cardPage2] = await createCardsFromProposals({
      boardId: database2.id,
      spaceId: testSpace.id,
      userId: spaceMember.id
    });

    const database2Block = await prisma.block.findUnique({
      where: {
        id: database2.boardId!
      },
      select: {
        fields: true
      }
    });

    const database2Properties = (database2Block?.fields as unknown as BoardFields).cardProperties;
    const shortText2Prop = database2Properties.find(
      (prop) => prop.formFieldId === shortTextFormField.id
    ) as IPropertyTemplate;
    const email2Prop = database2Properties.find((prop) => prop.formFieldId === emailFormField.id) as IPropertyTemplate;

    const databaseCard2 = await prisma.block.findUnique({
      where: {
        id: cardPage2.cardId!
      },
      select: {
        fields: true
      }
    });

    const card2Properties = (databaseCard2?.fields as unknown as CardFields).properties;
    expect(card2Properties[shortText2Prop.id]).toBeUndefined();
    expect(card2Properties[email2Prop.id]).toBe('john.doe@gmail.com');
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
