import type { FormField, Page, Prisma, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser, testUtilsProposals } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { InvalidStateError } from 'lib/middleware';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { randomETHWalletAddress } from 'lib/utils/blockchain';
import { generateBoard, generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import type { BoardFields, IPropertyTemplate } from '../../board';
import type { BoardViewFields } from '../../boardView';
import type { CardFields } from '../../card';
import { createCards } from '../createMissingCards';
import { updateCardPages } from '../updateCardPages';

describe('updateCardPages', () => {
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

  it('should update cards from proposals', async () => {
    const pageProposal = await testUtilsProposals.generateProposal({
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

    await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });

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

    await updateCardPages({
      boardId: board.id,
      spaceId: space.id
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
    const generated = await testUtilsUser.generateUserAndSpace();
    const admin = generated.user;
    const proposalReviewer = await testUtilsUser.generateSpaceUser({
      spaceId: generated.space.id
    });

    const generatedProposal1 = await testUtilsProposals.generateProposal({
      authors: [admin.id],
      proposalStatus: 'published',
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
          title: 'Rubric Evaluation 1',
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
          title: 'Rubric Evaluation 2',
          reviewers: [
            {
              group: 'user',
              id: admin.id
            }
          ],
          permissions: []
        }
      ],
      spaceId: generated.space.id,
      userId: admin.id
    });

    const proposal1RubricCriterias = await prisma.proposalRubricCriteria.findMany({
      where: {
        proposalId: generatedProposal1.id
      },
      select: {
        id: true,
        evaluationId: true
      }
    });

    const proposal1EvaluationIdRubricCriteriasRecord: Record<string, string[]> = {};
    generatedProposal1.evaluations.forEach((Evaluation) => {
      const rubricCriterias = proposal1RubricCriterias.filter((criteria) => criteria.evaluationId === Evaluation.id);
      proposal1EvaluationIdRubricCriteriasRecord[Evaluation.id] = rubricCriterias.map((criteria) => criteria.id);
    });

    // Admin first Evaluation first rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 5 },
        userId: admin.id,
        comment: null,
        proposalId: generatedProposal1.id,
        rubricCriteriaId: proposal1EvaluationIdRubricCriteriasRecord[generatedProposal1.evaluations[0].id][0],
        evaluationId: generatedProposal1.evaluations[0].id
      }
    });

    // Admin first Evaluation 2nd rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 8 },
        userId: admin.id,
        comment: null,
        proposalId: generatedProposal1.id,
        rubricCriteriaId: proposal1EvaluationIdRubricCriteriasRecord[generatedProposal1.evaluations[0].id][1],
        evaluationId: generatedProposal1.evaluations[0].id
      }
    });

    const database = await generateBoard({
      createdBy: admin.id,
      spaceId: generated.space.id,
      views: 1,
      viewDataSource: 'proposals'
    });

    // Delete the test card blocks
    await prisma.block.deleteMany({
      where: {
        type: 'card',
        parentId: database.id
      }
    });

    await createMissingCards({
      boardId: database.id,
      spaceId: generated.space.id,
      createdBy: admin.id
    });

    // After creating the initial proposal cards, update the proposal rubric Evaluation by submitting reviews by proposal reviewer

    // Proposal reviewer first Evaluation first rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 3 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal1.id,
        rubricCriteriaId: proposal1EvaluationIdRubricCriteriasRecord[generatedProposal1.evaluations[0].id][0],
        evaluationId: generatedProposal1.evaluations[0].id
      }
    });

    // Proposal reviewer first Evaluation 2nd rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 7 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal1.id,
        rubricCriteriaId: proposal1EvaluationIdRubricCriteriasRecord[generatedProposal1.evaluations[0].id][1],
        evaluationId: generatedProposal1.evaluations[0].id
      }
    });

    // Proposal reviewer second Evaluation 1st rubric criteria answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 4 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal1.id,
        rubricCriteriaId: proposal1EvaluationIdRubricCriteriasRecord[generatedProposal1.evaluations[1].id][0],
        evaluationId: generatedProposal1.evaluations[1].id
      }
    });

    await prisma.proposalEvaluation.updateMany({
      where: {
        id: {
          in: generatedProposal1.evaluations.map((Evaluation) => Evaluation.id)
        }
      },
      data: {
        result: 'pass'
      }
    });

    const generatedProposal2 = await testUtilsProposals.generateProposal({
      authors: [proposalReviewer.id],
      proposalStatus: 'published',
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
            }
          ],
          evaluationType: 'rubric',
          title: 'Rubric Evaluation 1',
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            }
          ],
          permissions: []
        },
        {
          rubricCriteria: [
            {
              description: 'Rubric evaluation 3 criteria 1',
              parameters: {
                min: 0,
                max: 10
              },
              title: 'Rubric evaluation 3 criteria 1'
            }
          ],
          evaluationType: 'rubric',
          title: 'Rubric Evaluation 3',
          reviewers: [
            {
              group: 'user',
              id: proposalReviewer.id
            }
          ],
          permissions: []
        }
      ],
      spaceId: generated.space.id,
      userId: proposalReviewer.id
    });

    const proposal2RubricCriterias = await prisma.proposalRubricCriteria.findMany({
      where: {
        proposalId: generatedProposal2.id
      },
      select: {
        id: true,
        evaluationId: true
      }
    });

    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 4 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal2.id,
        rubricCriteriaId: proposal2RubricCriterias[0].id,
        evaluationId: proposal2RubricCriterias[0].evaluationId
      }
    });

    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        response: { score: 9 },
        userId: proposalReviewer.id,
        comment: null,
        proposalId: generatedProposal2.id,
        rubricCriteriaId: proposal2RubricCriterias[1].id,
        evaluationId: proposal2RubricCriterias[1].evaluationId
      }
    });

    await prisma.proposalEvaluation.updateMany({
      where: {
        id: {
          in: generatedProposal2.evaluations.map((Evaluation) => Evaluation.id)
        }
      },
      data: {
        result: 'fail'
      }
    });

    await updateCardPages({
      boardId: database.id,
      spaceId: generated.space.id
    });

    const databaseAfterUpdate = await prisma.block.findUnique({
      where: {
        id: database.id
      },
      select: {
        fields: true
      }
    });

    const properties = (databaseAfterUpdate?.fields as any).cardProperties as IPropertyTemplate[];
    const proposalEvaluationStatusProp = properties.find((prop) => prop.type === 'proposalStatus') as IPropertyTemplate;
    const proposalEvaluationStepProp = properties.find((prop) => prop.type === 'proposalStep') as IPropertyTemplate;
    const proposalEvaluationTypeProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationType'
    ) as IPropertyTemplate;
    const rubricEvaluation1EvaluationAverageProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationAverage' && prop.name === 'Rubric Evaluation 1'
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluationAverageProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationAverage' && prop.name === 'Rubric Evaluation 2'
    ) as IPropertyTemplate;
    const rubricEvaluation1EvaluationTotalProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationTotal' && prop.name === 'Rubric Evaluation 1'
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluationTotalProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationTotal' && prop.name === 'Rubric Evaluation 2'
    ) as IPropertyTemplate;
    const rubricEvaluation1EvaluationEvaluatedByProp = properties.find(
      (prop) => prop.type === 'proposalEvaluatedBy' && prop.name === 'Rubric Evaluation 1'
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluationEvaluatedByProp = properties.find(
      (prop) => prop.type === 'proposalEvaluatedBy' && prop.name === 'Rubric Evaluation 2'
    ) as IPropertyTemplate;
    const rubricEvaluation3EvaluationAverageProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationAverage' && prop.name === 'Rubric Evaluation 3'
    ) as IPropertyTemplate;
    const rubricEvaluation3EvaluationTotalProp = properties.find(
      (prop) => prop.type === 'proposalEvaluationTotal' && prop.name === 'Rubric Evaluation 3'
    ) as IPropertyTemplate;
    const rubricEvaluation3EvaluationEvaluatedByProp = properties.find(
      (prop) => prop.type === 'proposalEvaluatedBy' && prop.name === 'Rubric Evaluation 3'
    ) as IPropertyTemplate;

    const cardBlocks = await prisma.block.findMany({
      where: {
        parentId: database.id,
        type: 'card'
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        fields: true
      }
    });

    const view = await prisma.block.findFirst({
      where: {
        type: 'view',
        parentId: database.id
      },
      select: {
        fields: true
      }
    });

    const viewFields = view?.fields as unknown as BoardViewFields;

    const card1Properties = (cardBlocks[0].fields as unknown as CardFields).properties;
    const card2Properties = (cardBlocks[1].fields as unknown as CardFields).properties;

    expect(card1Properties[rubricEvaluation1EvaluationAverageProp.id]).toStrictEqual(5.75);
    expect(card1Properties[rubricEvaluation2EvaluationAverageProp.id]).toStrictEqual(4);
    expect(card1Properties[rubricEvaluation1EvaluationTotalProp.id]).toStrictEqual(23);
    expect(card1Properties[rubricEvaluation2EvaluationTotalProp.id]).toStrictEqual(4);
    expect((card1Properties[rubricEvaluation1EvaluationEvaluatedByProp.id] as string[]).sort()).toStrictEqual(
      [proposalReviewer.id, admin.id].sort()
    );
    expect(card1Properties[rubricEvaluation2EvaluationEvaluatedByProp.id]).toStrictEqual([proposalReviewer.id]);

    expect(card2Properties[rubricEvaluation1EvaluationAverageProp.id]).toStrictEqual(4);
    expect(card2Properties[rubricEvaluation2EvaluationAverageProp.id]).toBeUndefined();
    expect(card2Properties[rubricEvaluation1EvaluationTotalProp.id]).toStrictEqual(4);
    expect(card2Properties[rubricEvaluation2EvaluationTotalProp.id]).toBeUndefined();
    expect(card2Properties[rubricEvaluation1EvaluationEvaluatedByProp.id]).toStrictEqual([proposalReviewer.id]);
    expect(card2Properties[rubricEvaluation2EvaluationEvaluatedByProp.id]).toBeUndefined();
    expect(card2Properties[rubricEvaluation3EvaluationAverageProp.id]).toStrictEqual(9);
    expect(card2Properties[rubricEvaluation3EvaluationTotalProp.id]).toStrictEqual(9);
    expect(card2Properties[rubricEvaluation3EvaluationEvaluatedByProp.id]).toStrictEqual([proposalReviewer.id]);

    // Add the new evaluation properties to the view
    expect(
      [
        rubricEvaluation3EvaluationAverageProp,
        rubricEvaluation3EvaluationTotalProp,
        rubricEvaluation3EvaluationEvaluatedByProp
      ].every((prop) => viewFields.visiblePropertyIds.includes(prop.id))
    ).toBeTruthy();

    expect(card1Properties[proposalEvaluationStatusProp.id]).toBe('pass');
    expect(card1Properties[proposalEvaluationStepProp.id]).toBe('Rubric Evaluation 2');
    expect(card1Properties[proposalEvaluationTypeProp.id]).toBe('rubric');
    expect(card2Properties[proposalEvaluationStatusProp.id]).toBe('fail');
    expect(card2Properties[proposalEvaluationStepProp.id]).toBe('Rubric Evaluation 1');
    expect(card2Properties[proposalEvaluationTypeProp.id]).toBe('rubric');
    // Make sure all the evaluation steps are added to the step property's options
    expect(
      ['Rubric Evaluation 1', 'Rubric Evaluation 2', 'Rubric Evaluation 3'].every((stepTitle) =>
        proposalEvaluationStepProp.options.some((option) => option.value === stepTitle)
      )
    ).toBeTruthy();
  });

  it('should not create cards from draft proposals', async () => {
    // populate board view
    await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });

    const pageProposal2 = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'draft',
      reviewers: [],
      spaceId: space.id,
      userId: user.id
    });

    await updateCardPages({
      boardId: board.id,
      spaceId: space.id
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
    await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });

    const pageProposal2 = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'published',
      reviewers: [],
      spaceId: space.id,
      userId: user.id,
      archived: true
    });

    await updateCardPages({
      boardId: board.id,
      spaceId: space.id
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

    // Delete existing cards
    await prisma.block.deleteMany({
      where: {
        parentId: databaseBoard.id,
        type: 'card'
      }
    });

    await createMissingCards({
      boardId: databaseBoard.id,
      spaceId: testSpace.id,
      createdBy: proposalAuthor.id
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

    await updateCardPages({
      boardId: databaseBoard.id,
      spaceId: testSpace.id
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

    await createMissingCards({
      boardId: database.id,
      spaceId: testSpace.id,
      createdBy: proposalAuthor.id
    });

    const proposal2 = await testUtilsProposals.generateProposal({
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
    await updateCardPages({
      boardId: database.id,
      spaceId: testSpace.id
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

    await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });

    await prisma.page.update({
      where: {
        id: pageProposal.id
      },
      data: {
        deletedAt: new Date()
      }
    });

    await updateCardPages({
      boardId: board.id,
      spaceId: space.id
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

    await createMissingCards({ boardId: board.id, spaceId: space.id, createdBy: user.id });

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

    await updateCardPages({
      boardId: board.id,
      spaceId: space.id
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

    await expect(updateCardPages({ boardId: database.id, spaceId: space.id })).rejects.toBeInstanceOf(
      InvalidStateError
    );
  });

  it('should not create cards from proposals if board is not found', async () => {
    await expect(updateCardPages({ boardId: v4(), spaceId: space.id })).rejects.toThrowError();
  });

  it('should not create cards from proposals if a board is not inside a space', async () => {
    await expect(updateCardPages({ boardId: board.id, spaceId: v4() })).rejects.toThrowError();
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

    // This sets up the board
    await createMissingCards({ boardId: testBoard.id, spaceId: testSpace.id, createdBy: testUser.id });

    // This proposal was created after the datasource was created
    const visibleProposal = await testUtilsProposals.generateProposal({
      authors: [],
      proposalStatus: 'published',
      reviewers: [],
      spaceId: testSpace.id,
      userId: testUser.id
    });

    // This calls the update method we are testing
    await updateCardPages({ boardId: testBoard.id, spaceId: testSpace.id });
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
