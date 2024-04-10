import { InvalidInputError } from '@charmverse/core/errors';
import type { FormField, Page, Prisma, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import isEqual from 'lodash/isEqual';
import { v4 } from 'uuid';

import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import type { BoardFields, IPropertyTemplate } from 'lib/databases/board';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { generateBoard, generateProposal, generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import type { BoardViewFields } from '../../boardView';
import type { CardFields } from '../../card';
import { createMissingCards } from '../createMissingCards';

describe('createCards', () => {
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
    const cards = await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });
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

    const cards = await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });

    expect(cards.length).toBe(0);
  });

  it('should initialise the database with all proposal properties visible', async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    const admin = generated.user;
    const proposalReviewer = await testUtilsUser.generateSpaceUser({
      spaceId: generated.space.id
    });

    const generatedProposal = await testUtilsProposals.generateProposal({
      authors: [admin.id],
      evaluationInputs: [
        {
          rubricCriteria: [
            {
              description: 'Rubric criteria 1',
              parameters: {
                min: 0,
                max: 5
              },
              title: 'Rubric criteria 1'
            },
            {
              description: 'Rubric criteria 2',
              parameters: {
                min: 0,
                max: 10
              },
              title: 'Rubric criteria 2'
            }
          ],
          evaluationType: 'rubric',
          title: 'Rubric evaluation 1',
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            },
            {
              group: 'user',
              id: admin.id
            }
          ],
          permissions: []
        },
        {
          rubricCriteria: [
            {
              description: 'Rubric criteria 1',
              parameters: {
                min: 0,
                max: 10
              },
              title: 'Rubric criteria 1'
            }
          ],
          evaluationType: 'rubric',
          title: 'Rubric evaluation 2',
          reviewers: [
            {
              group: 'user',
              id: admin.id
            }
          ],
          permissions: []
        }
      ],
      proposalStatus: 'published',
      spaceId: generated.space.id,
      userId: admin.id
    });

    const proposalRubricCriterias = await prisma.proposalRubricCriteria.findMany({
      where: {
        proposalId: generatedProposal.id
      },
      select: {
        id: true,
        evaluationId: true
      }
    });

    const proposalEvaluationIdRubricCriteriasRecord: Record<string, string[]> = {};
    generatedProposal.evaluations.forEach((evaluation) => {
      const rubricCriterias = proposalRubricCriterias.filter((criteria) => criteria.evaluationId === evaluation.id);
      proposalEvaluationIdRubricCriteriasRecord[evaluation.id] = rubricCriterias.map((criteria) => criteria.id);
    });

    // Admin first evaluation first rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 5 },
        userId: admin.id,
        comment: null,
        proposalId: generatedProposal.id,
        rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[generatedProposal.evaluations[0].id][0],
        evaluationId: generatedProposal.evaluations[0].id
      }
    });

    // Admin first evaluation 2nd rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 8 },
        userId: admin.id,
        comment: null,
        proposalId: generatedProposal.id,
        rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[generatedProposal.evaluations[0].id][1],
        evaluationId: generatedProposal.evaluations[0].id
      }
    });

    // Proposal reviewer first evaluation first rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 3 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal.id,
        rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[generatedProposal.evaluations[0].id][0],
        evaluationId: generatedProposal.evaluations[0].id
      }
    });

    // Proposal reviewer first evaluation 2nd rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 7 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal.id,
        rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[generatedProposal.evaluations[0].id][1],
        evaluationId: generatedProposal.evaluations[0].id
      }
    });

    // Proposal reviewer second evaluation 1st rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 4 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal.id,
        rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[generatedProposal.evaluations[1].id][0],
        evaluationId: generatedProposal.evaluations[1].id
      }
    });

    await prisma.proposalEvaluation.updateMany({
      where: {
        id: {
          in: generatedProposal.evaluations.map((evaluation) => evaluation.id)
        }
      },
      data: {
        result: 'pass'
      }
    });

    const database = await generateBoard({
      createdBy: admin.id,
      spaceId: generated.space.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    const cards = await createMissingCards({
      boardId: database.id,
      spaceId: generated.space.id,
      createdBy: user.id
    });

    const databaseAfterUpdate = await prisma.block.findUnique({
      where: {
        id: database.id
      }
    });

    const properties = (databaseAfterUpdate?.fields as any).cardProperties as IPropertyTemplate[];
    const proposalUrlProp = properties.find((prop) => prop.type === 'proposalUrl') as IPropertyTemplate;
    const proposalStatusProp = properties.find((prop) => prop.type === 'proposalStatus') as IPropertyTemplate;
    const proposalEvaluationTypeProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationType'
    ) as IPropertyTemplate;
    const proposalEvaluationStepProp = properties.find((prop) => prop.type === 'proposalStep') as IPropertyTemplate;
    const rubricEvaluation1EvaluatedByProp = properties.find(
      (prop) => prop.type === 'proposalEvaluatedBy' && prop.name === `Rubric evaluation 1`
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluatedByProp = properties.find(
      (prop) => prop.type === 'proposalEvaluatedBy' && prop.name === `Rubric evaluation 2`
    ) as IPropertyTemplate;
    const rubricEvaluation1EvaluationTotalProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationTotal' && prop.name === `Rubric evaluation 1`
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluationTotalProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationTotal' && prop.name === `Rubric evaluation 2`
    ) as IPropertyTemplate;
    const rubricEvaluation1EvaluationAverageProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationAverage' && prop.name === `Rubric evaluation 1`
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluationAverageProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationAverage' && prop.name === `Rubric evaluation 2`
    ) as IPropertyTemplate;

    expect(proposalUrlProp).toBeDefined();
    expect(proposalStatusProp).toBeDefined();
    expect(proposalEvaluationTypeProp).toBeDefined();
    expect(proposalEvaluationStepProp).toBeDefined();
    expect(rubricEvaluation1EvaluatedByProp).toBeDefined();
    expect(rubricEvaluation2EvaluatedByProp).toBeDefined();
    expect(rubricEvaluation1EvaluationTotalProp).toBeDefined();
    expect(rubricEvaluation2EvaluationTotalProp).toBeDefined();
    expect(rubricEvaluation1EvaluationAverageProp).toBeDefined();
    expect(rubricEvaluation2EvaluationAverageProp).toBeDefined();

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

    const card = await prisma.block.findFirstOrThrow({
      where: {
        id: cards[0].id
      },
      select: {
        fields: true
      }
    });

    const cardFieldProperties = (card.fields as CardFields).properties;

    expect(cardFieldProperties[proposalUrlProp.id as string]).toStrictEqual(generatedProposal.page.path);
    expect(cardFieldProperties[proposalStatusProp.id as string]).toStrictEqual('pass');
    expect(cardFieldProperties[proposalEvaluationTypeProp.id as string]).toStrictEqual('rubric');
    expect(cardFieldProperties[proposalEvaluationStepProp.id as string]).toStrictEqual('Rubric evaluation 2');
    expect((cardFieldProperties[rubricEvaluation1EvaluatedByProp.id as string] as string[]).sort()).toStrictEqual(
      [admin.id, proposalReviewer.id].sort()
    );
    expect((cardFieldProperties[rubricEvaluation2EvaluatedByProp.id as string] as string[]).sort()).toStrictEqual([
      proposalReviewer.id
    ]);
    expect(cardFieldProperties[rubricEvaluation1EvaluationTotalProp.id as string]).toStrictEqual(23);
    expect(cardFieldProperties[rubricEvaluation2EvaluationTotalProp.id as string]).toStrictEqual(4);
    expect(cardFieldProperties[rubricEvaluation1EvaluationAverageProp.id as string]).toStrictEqual(5.75);
    expect(cardFieldProperties[rubricEvaluation2EvaluationAverageProp.id as string]).toStrictEqual(4);
  });

  it(`should add custom proposal properties as card properties and add them to visible properties for all views as an admin`, async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true
    });

    const proposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
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

    const [cardPage] = await createMissingCards({
      boardId: databaseBoard.id,
      spaceId: testSpace.id,
      createdBy: proposalAuthor.id
    });

    const cardBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: cardPage.id
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

    const proposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
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

    const [cardPage] = await createMissingCards({
      boardId: database1.id,
      spaceId: testSpace.id,
      createdBy: proposalAuthor.id
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
        id: cardPage.id
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

    const [cardPage2] = await createMissingCards({
      boardId: database2.id,
      spaceId: testSpace.id,
      createdBy: spaceMember.id
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
        id: cardPage2.id
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
    await expect(createMissingCards({ boardId: v4(), spaceId: space.id, createdBy: user.id })).rejects.toThrowError();
  });

  it('should not create cards from proposals if a board is not inside a space', async () => {
    await expect(createMissingCards({ boardId: board.id, spaceId: v4(), createdBy: user.id })).rejects.toThrowError();
  });

  it('should throw an error if boardId or spaceId is invalid', async () => {
    await expect(
      createMissingCards({ boardId: board.id, spaceId: 'Bad space id', createdBy: user.id })
    ).rejects.toThrowError(InvalidInputError);

    await expect(
      createMissingCards({ boardId: 'bad board id', spaceId: space.id, createdBy: user.id })
    ).rejects.toThrowError(InvalidInputError);
  });

  it('should not create cards if no proposals are found', async () => {
    const cards = await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });

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

    const cards = await createMissingCards({ boardId: testBoard.id, spaceId: testSpace.id, createdBy: testUser.id });

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

    await createMissingCards({ boardId: testBoard.id, spaceId: testSpace.id, createdBy: testUser.id });

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
