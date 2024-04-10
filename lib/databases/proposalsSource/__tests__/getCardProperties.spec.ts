import type { FormField, Space, User, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { prismaToBlock } from 'lib/databases/block';
import type { Board, IPropertyTemplate } from 'lib/databases/board';
import type { ProposalFields } from 'lib/proposals/interfaces';
import { generateBoard, generateProposal, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalSourceDb } from 'testing/utils/proposals';
import { addUserToSpace } from 'testing/utils/spaces';
import { generateUser } from 'testing/utils/users';

import { getCardPropertiesFromProposals } from '../getCardProperties';

describe('getCardPropertiesFromProposals', () => {
  let user: User;
  let space: Space;
  let board: Board;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
    const generatedBoard = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      viewDataSource: 'proposals'
    });
    const boardBlock = await prisma.block.findUniqueOrThrow({
      where: {
        id: generatedBoard.id
      }
    });
    board = prismaToBlock(boardBlock) as Board;
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

  it('should not return cards from draft proposals', async () => {
    await generateProposal({
      authors: [],
      proposalStatus: 'draft',
      spaceId: space.id,
      userId: user.id
    });

    const cards = await getCardPropertiesFromProposals({
      spaceId: board.spaceId,
      cardProperties: board.fields.cardProperties
    });

    expect(Object.keys(cards).length).toBe(0);
  });

  it('should return cards applied with proposal properties', async () => {
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

    const database = await generateProposalSourceDb({
      createdBy: admin.id,
      spaceId: generated.space.id
    });

    const cards = await getCardPropertiesFromProposals({
      spaceId: database.spaceId,
      cardProperties: database.fields.cardProperties
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

    const card = Object.values(cards)[0];

    const cardFieldProperties = card.fields.properties;

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

  it(`should add custom proposal properties as card properties`, async () => {
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

    const databaseBoard = await generateProposalSourceDb({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id
    });

    const cards = await getCardPropertiesFromProposals({
      spaceId: databaseBoard.spaceId,
      cardProperties: databaseBoard.fields.cardProperties
    });
    const cardBlock = Object.values(cards)[0];

    const cardBlockFields = cardBlock?.fields;

    const boardCardProperties = databaseBoard.fields.cardProperties;

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
  });

  it(`should add proposal form fields as card properties`, async () => {
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

    const database1 = await generateProposalSourceDb({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id
    });

    const cards = await getCardPropertiesFromProposals({
      spaceId: database1.spaceId,
      cardProperties: database1.fields.cardProperties
    });

    const databaseCard = Object.values(cards)[0];

    const database1Properties = database1.fields.cardProperties;
    const shortText1Prop = database1Properties.find(
      (prop) => prop.formFieldId === shortTextFormField.id
    ) as IPropertyTemplate;
    const email1Prop = database1Properties.find((prop) => prop.formFieldId === emailFormField.id) as IPropertyTemplate;

    const cardProperties = databaseCard.fields.properties;
    expect(cardProperties[shortText1Prop.id]).toBe('Short Text Answer');
    expect(cardProperties[email1Prop.id]).toBe('john.doe@gmail.com');
  });
});
