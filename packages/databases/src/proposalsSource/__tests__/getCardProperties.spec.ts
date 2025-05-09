import type { FormField, Prisma, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import { generateProposalSourceDb } from '@packages/lib/testing/proposals';
import { generateBoard, generateProposal, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { generateUser } from '@packages/testing/utils/users';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { v4 } from 'uuid';

import { getDefaultBoard } from 'components/proposals/components/ProposalsBoard/utils/boardData';

import { prismaToBlock } from '../../block';
import type { Board, IPropertyTemplate } from '../../board';
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
      space: {
        features: space.features,
        credentialTemplates: [],
        id: space.id,
        useOnchainCredentials: false
      },
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

    const evaluationInputs: testUtilsProposals.GenerateProposalInput['evaluationInputs'] = [
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
    ];

    const proposalTemplate = await testUtilsProposals.generateProposal({
      authors: [admin.id],
      evaluationInputs,
      proposalStatus: 'published',
      pageType: 'proposal_template',
      spaceId: generated.space.id,
      userId: admin.id
    });

    const generatedProposal = await testUtilsProposals.generateProposal({
      authors: [admin.id],
      evaluationInputs,
      proposalStatus: 'published',
      spaceId: generated.space.id,
      userId: admin.id
    });

    await prisma.page.update({
      where: {
        id: generatedProposal.page.id
      },
      data: {
        sourceTemplateId: proposalTemplate.page.id
      }
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

    const cardProperties = database.fields.cardProperties;

    const cards = await getCardPropertiesFromProposals({
      space: {
        features: generated.space.features,
        credentialTemplates: [],
        id: generated.space.id,
        useOnchainCredentials: false
      },
      cardProperties
    });

    const proposalUrlProp = cardProperties.find((prop) => prop.type === 'proposalUrl') as IPropertyTemplate;
    const proposalStatusProp = cardProperties.find((prop) => prop.type === 'proposalStatus') as IPropertyTemplate;
    const proposalEvaluationTypeProp = cardProperties.find(
      (prop) => prop.type === 'proposalEvaluationType'
    ) as IPropertyTemplate;
    const proposalEvaluationStepProp = cardProperties.find((prop) => prop.type === 'proposalStep') as IPropertyTemplate;
    const rubricEvaluation1EvaluatedByProp = cardProperties.find(
      (prop) => prop.type === 'proposalEvaluatedBy' && prop.evaluationTitle === 'Rubric evaluation 1'
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluatedByProp = cardProperties.find(
      (prop) => prop.type === 'proposalEvaluatedBy' && prop.evaluationTitle === 'Rubric evaluation 2'
    ) as IPropertyTemplate;
    const rubricEvaluation1EvaluationTotalProp = cardProperties.find(
      (prop) => prop.type === 'proposalEvaluationTotal' && prop.evaluationTitle === `Rubric evaluation 1`
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluationTotalProp = cardProperties.find(
      (prop) => prop.type === 'proposalEvaluationTotal' && prop.evaluationTitle === `Rubric evaluation 2`
    ) as IPropertyTemplate;
    const rubricEvaluation1EvaluationAverageProp = cardProperties.find(
      (prop) => prop.type === 'proposalEvaluationAverage' && prop.evaluationTitle === `Rubric evaluation 1`
    ) as IPropertyTemplate;
    const rubricEvaluation2EvaluationAverageProp = cardProperties.find(
      (prop) => prop.type === 'proposalEvaluationAverage' && prop.evaluationTitle === `Rubric evaluation 2`
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

    expect(cardFieldProperties[proposalUrlProp.id as string]).toStrictEqual(generatedProposal.page!.path);
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

  it('should return cards applied with custom unique proposal rubric criteria properties', async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    const admin = generated.user;
    const proposalReviewer = await testUtilsUser.generateSpaceUser({
      spaceId: generated.space.id
    });

    const evaluationInputs: testUtilsProposals.GenerateProposalInput['evaluationInputs'] = [
      {
        evaluationType: 'feedback',
        title: 'Feedback',
        reviewers: [],
        permissions: []
      },
      {
        rubricCriteria: [
          {
            title: 'Rubric criteria 1'
          },
          {
            title: 'Rubric criteria 2'
          }
        ],
        evaluationType: 'rubric',
        title: 'Rubric evaluation 1',
        reviewers: [],
        permissions: []
      },
      {
        rubricCriteria: [
          {
            title: 'Rubric criteria 1'
          },
          {
            title: 'Rubric criteria 2.1'
          }
        ],
        evaluationType: 'rubric',
        title: 'Rubric evaluation 2',
        reviewers: [],
        permissions: []
      }
    ];

    const proposalTemplate = await testUtilsProposals.generateProposal({
      authors: [admin.id],
      evaluationInputs,
      proposalStatus: 'published',
      pageType: 'proposal_template',
      spaceId: generated.space.id,
      userId: admin.id
    });

    const generatedProposal = await testUtilsProposals.generateProposal({
      authors: [admin.id],
      evaluationInputs,
      proposalStatus: 'published',
      spaceId: generated.space.id,
      userId: admin.id
    });

    await prisma.page.update({
      where: {
        id: generatedProposal.page.id
      },
      data: {
        sourceTemplateId: proposalTemplate.page.id
      }
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

    const proposalEvaluations = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: generatedProposal.id
      },
      orderBy: {
        index: 'asc'
      }
    });

    await prisma.proposalRubricCriteriaAnswer.createMany({
      data: [
        // Admin user
        // Rubric Criteria 1
        {
          response: { score: 5 },
          userId: admin.id,
          comment: 'Rubric Evaluation 1, Rubric Criteria 1, User 1 Comment',
          proposalId: generatedProposal.id,
          rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[proposalEvaluations[1].id][0],
          evaluationId: proposalEvaluations[1].id
        },
        // Rubric Criteria 2
        {
          response: { score: 3 },
          userId: admin.id,
          comment: 'Rubric Evaluation 1, Rubric Criteria 2, User 1 Comment',
          proposalId: generatedProposal.id,
          rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[proposalEvaluations[1].id][1],
          evaluationId: proposalEvaluations[1].id
        },
        // Rubric Criteria 1
        {
          response: { score: 1 },
          userId: admin.id,
          comment: 'Rubric Evaluation 2, Rubric Criteria 1, User 1 Comment',
          proposalId: generatedProposal.id,
          rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[proposalEvaluations[2].id][0],
          evaluationId: proposalEvaluations[2].id
        },
        // Rubric Criteria 2.1
        {
          response: { score: 3 },
          userId: admin.id,
          comment: null,
          proposalId: generatedProposal.id,
          rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[proposalEvaluations[2].id][1],
          evaluationId: proposalEvaluations[2].id
        },
        // proposal reviewer
        // Rubric Criteria 2
        {
          response: { score: 4 },
          userId: proposalReviewer.id,
          comment: 'Rubric Evaluation 1, Rubric Criteria 2, User 2 Comment',
          proposalId: generatedProposal.id,
          rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[proposalEvaluations[1].id][1],
          evaluationId: proposalEvaluations[1].id
        },
        // Rubric Criteria 1
        {
          response: { score: 2 },
          userId: proposalReviewer.id,
          comment: null,
          proposalId: generatedProposal.id,
          rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[proposalEvaluations[2].id][0],
          evaluationId: proposalEvaluations[2].id
        },
        // Rubric Criteria 2.1
        {
          response: { score: 5 },
          userId: proposalReviewer.id,
          comment: 'Rubric Evaluation 2, Rubric Criteria 2.1, User 2 Comment',
          proposalId: generatedProposal.id,
          rubricCriteriaId: proposalEvaluationIdRubricCriteriasRecord[proposalEvaluations[2].id][1],
          evaluationId: proposalEvaluations[2].id
        }
      ]
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
      space: {
        features: generated.space.features,
        credentialTemplates: [],
        id: generated.space.id,
        useOnchainCredentials: false
      },
      cardProperties: database.fields.cardProperties
    });

    const properties = (database?.fields as any).cardProperties as IPropertyTemplate[];
    const proposalRubricCriteria1TotalProperty = properties.find(
      (prop) => prop.type === 'proposalRubricCriteriaTotal' && prop.criteriaTitle === 'Rubric criteria 1'
    ) as IPropertyTemplate;
    const proposalRubricCriteria2TotalProperty = properties.find(
      (prop) => prop.type === 'proposalRubricCriteriaTotal' && prop.criteriaTitle === 'Rubric criteria 2'
    ) as IPropertyTemplate;
    const proposalRubricCriteria21TotalProperty = properties.find(
      (prop) => prop.type === 'proposalRubricCriteriaTotal' && prop.criteriaTitle === 'Rubric criteria 2.1'
    ) as IPropertyTemplate;
    const proposalRubricCriteria1Reviewer1CommentProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerComment' &&
        prop.criteriaTitle === 'Rubric criteria 1' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === admin.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria1Reviewer1ScoreProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerScore' &&
        prop.criteriaTitle === 'Rubric criteria 1' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === admin.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria2Reviewer1CommentProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerComment' &&
        prop.criteriaTitle === 'Rubric criteria 2' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === admin.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria2Reviewer1ScoreProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerScore' &&
        prop.criteriaTitle === 'Rubric criteria 2' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === admin.id
    ) as IPropertyTemplate;
    const proposaLRubricCriteria21Reviewer1CommentProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerComment' &&
        prop.criteriaTitle === 'Rubric criteria 2.1' &&
        prop.evaluationTitle === 'Rubric evaluation 2' &&
        prop.reviewerId === admin.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria21Reviewer1ScoreProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerScore' &&
        prop.criteriaTitle === 'Rubric criteria 2.1' &&
        prop.evaluationTitle === 'Rubric evaluation 2' &&
        prop.reviewerId === admin.id
    ) as IPropertyTemplate;

    const proposalRubricCriteria1Reviewer2CommentProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerComment' &&
        prop.criteriaTitle === 'Rubric criteria 1' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === proposalReviewer.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria1Reviewer2ScoreProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerScore' &&
        prop.criteriaTitle === 'Rubric criteria 1' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === proposalReviewer.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria2Reviewer2CommentProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerComment' &&
        prop.criteriaTitle === 'Rubric criteria 2' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === proposalReviewer.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria2Reviewer2ScoreProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerScore' &&
        prop.criteriaTitle === 'Rubric criteria 2' &&
        prop.evaluationTitle === 'Rubric evaluation 1' &&
        prop.reviewerId === proposalReviewer.id
    ) as IPropertyTemplate;
    const proposaLRubricCriteria21Reviewer2CommentProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerComment' &&
        prop.criteriaTitle === 'Rubric criteria 2.1' &&
        prop.evaluationTitle === 'Rubric evaluation 2' &&
        prop.reviewerId === proposalReviewer.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria21Reviewer2ScoreProperty = properties.find(
      (prop) =>
        prop.type === 'proposalRubricCriteriaReviewerScore' &&
        prop.criteriaTitle === 'Rubric criteria 2.1' &&
        prop.evaluationTitle === 'Rubric evaluation 2' &&
        prop.reviewerId === proposalReviewer.id
    ) as IPropertyTemplate;
    const proposalRubricCriteria1AverageProperty = properties.find(
      (prop) => prop.type === 'proposalRubricCriteriaAverage' && prop.criteriaTitle === 'Rubric criteria 1'
    ) as IPropertyTemplate;
    const proposalRubricCriteria2AverageProperty = properties.find(
      (prop) => prop.type === 'proposalRubricCriteriaAverage' && prop.criteriaTitle === 'Rubric criteria 2'
    ) as IPropertyTemplate;
    const proposalRubricCriteria21AverageProperty = properties.find(
      (prop) => prop.type === 'proposalRubricCriteriaAverage' && prop.criteriaTitle === 'Rubric criteria 2.1'
    ) as IPropertyTemplate;

    const card = Object.values(cards)[0];

    const cardFieldProperties = card.fields.properties;

    expect(cardFieldProperties[proposalRubricCriteria1TotalProperty.id as string]).toStrictEqual(5 + 1 + 2);
    expect(cardFieldProperties[proposalRubricCriteria1AverageProperty.id as string]).toStrictEqual(
      Number(((5 + 1 + 2) / 3).toFixed(2))
    );
    expect(cardFieldProperties[proposalRubricCriteria2Reviewer1CommentProperty.id as string]).toStrictEqual(
      'Rubric Evaluation 1, Rubric Criteria 2, User 1 Comment'
    );
    expect(cardFieldProperties[proposalRubricCriteria1Reviewer1CommentProperty.id as string]).toStrictEqual(
      'Rubric Evaluation 2, Rubric Criteria 1, User 1 Comment'
    );
    expect(cardFieldProperties[proposalRubricCriteria1Reviewer1ScoreProperty.id as string]).toStrictEqual(1);

    expect(cardFieldProperties[proposalRubricCriteria2TotalProperty.id as string]).toStrictEqual(3 + 4);
    expect(cardFieldProperties[proposalRubricCriteria2Reviewer1ScoreProperty.id as string]).toStrictEqual(3);
    expect(proposalRubricCriteria1Reviewer2CommentProperty).toBeFalsy();
    expect(proposalRubricCriteria1Reviewer2ScoreProperty).toBeFalsy();
    expect(cardFieldProperties[proposalRubricCriteria2Reviewer2CommentProperty.id as string]).toStrictEqual(
      'Rubric Evaluation 1, Rubric Criteria 2, User 2 Comment'
    );
    expect(cardFieldProperties[proposalRubricCriteria2Reviewer2ScoreProperty.id as string]).toStrictEqual(4);
    expect(cardFieldProperties[proposalRubricCriteria2AverageProperty.id as string]).toStrictEqual((3 + 4) / 2);

    expect(cardFieldProperties[proposalRubricCriteria21TotalProperty.id as string]).toStrictEqual(3 + 5);
    expect(cardFieldProperties[proposaLRubricCriteria21Reviewer1CommentProperty.id as string]).toStrictEqual('');
    expect(cardFieldProperties[proposalRubricCriteria21Reviewer1ScoreProperty.id as string]).toStrictEqual(3);
    expect(cardFieldProperties[proposaLRubricCriteria21Reviewer2CommentProperty.id as string]).toStrictEqual(
      'Rubric Evaluation 2, Rubric Criteria 2.1, User 2 Comment'
    );
    expect(cardFieldProperties[proposalRubricCriteria21Reviewer2ScoreProperty.id as string]).toStrictEqual(5);
    expect(cardFieldProperties[proposalRubricCriteria21AverageProperty.id as string]).toStrictEqual((3 + 5) / 2);
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
      space: {
        features: testSpace.features,
        credentialTemplates: [],
        id: testSpace.id,
        useOnchainCredentials: false
      },
      cardProperties: databaseBoard.fields.cardProperties
    });
    const cardBlock = Object.values(cards)[0];

    const cardBlockFields = cardBlock?.fields;

    const boardCardProperties = databaseBoard.fields.cardProperties;

    const textProperty = boardCardProperties.find((prop) => prop.id === customProperties[0].id);
    const selectProperty = boardCardProperties.find((prop) => prop.id === customProperties[1].id);

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

    const proposalTemplate = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      pageType: 'proposal_template',
      reviewers: [
        {
          group: 'user',
          id: proposalAuthor.id
        }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
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

    await prisma.page.update({
      where: {
        id: proposal.page.id
      },
      data: {
        sourceTemplateId: proposalTemplate.page.id
      }
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
            id: proposalTemplate.id
          }
        }
      },
      include: {
        formFields: true
      }
    });

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        form: {
          connect: {
            id: form.id
          }
        }
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
      space: {
        features: testSpace.features,
        credentialTemplates: [],
        id: testSpace.id,
        useOnchainCredentials: false
      },
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

  it('should return the proposal with a step of credentials, and status of passed or in_progress depending on offchain credentials when the evaluation is complete', async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true,
      walletAddress: randomETHWalletAddress()
    });

    await prisma.space.update({
      where: {
        id: testSpace.id
      },
      data: {
        useOnchainCredentials: true,
        credentialsChainId: 10
      }
    });

    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: testSpace.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      selectedCredentialTemplateIds: [credentialTemplate.id],
      evaluationInputs: [
        { evaluationType: 'feedback', title: 'Feedback', result: 'pass', reviewers: [], permissions: [] }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const defaultBoard = getDefaultBoard({
      evaluationStepTitles: []
    });

    await prisma.proposalBlock.create({
      data: {
        fields: {
          ...defaultBoard.fields,
          cardProperties: [...defaultBoard.fields.cardProperties] as unknown as Prisma.InputJsonArray
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
            ...proposalFields.properties
          }
        }
      }
    });

    const databaseBoard = await generateProposalSourceDb({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id
    });

    const cards = await getCardPropertiesFromProposals({
      space: {
        features: testSpace.features,
        credentialTemplates: [credentialTemplate],
        id: testSpace.id,
        useOnchainCredentials: false
      },
      cardProperties: databaseBoard.fields.cardProperties
    });
    const cardBlock = Object.values(cards)[0];

    const statusProp = databaseBoard.fields.cardProperties.find(
      (prop) => prop.type === 'proposalStatus'
    ) as IPropertyTemplate;

    const stepProp = databaseBoard.fields.cardProperties.find(
      (prop) => prop.type === 'proposalStep'
    ) as IPropertyTemplate;

    const evaluationTypeProp = databaseBoard.fields.cardProperties.find(
      (prop) => prop.type === 'proposalEvaluationType'
    ) as IPropertyTemplate;

    expect(cardBlock.fields.properties[statusProp.id]).toEqual('in_progress');
    expect(cardBlock.fields.properties[stepProp.id]).toEqual('Credentials');
    expect(cardBlock.fields.properties[evaluationTypeProp.id]).toEqual('credentials');

    await prisma.issuedCredential.create({
      data: {
        credentialEvent: 'proposal_approved',
        credentialTemplateId: credentialTemplate.id,
        userId: proposalAuthor.id,
        onchainAttestationId: randomETHWalletAddress(),
        proposalId: proposal.id
      }
    });

    const cardsAfterUpdate = await getCardPropertiesFromProposals({
      space: {
        features: testSpace.features,
        credentialTemplates: [credentialTemplate],
        id: testSpace.id,
        useOnchainCredentials: false
      },
      cardProperties: databaseBoard.fields.cardProperties
    });
    const cardBlockAfterUpdate = Object.values(cardsAfterUpdate)[0];

    expect(cardBlockAfterUpdate.fields.properties[statusProp.id]).toEqual('pass');
    expect(cardBlockAfterUpdate.fields.properties[stepProp.id]).toEqual('Credentials');
    expect(cardBlockAfterUpdate.fields.properties[evaluationTypeProp.id]).toEqual('credentials');
  });

  it('should return the proposal with a step of credentials, and status of passed or in_progress depending on onchain credentials when the evaluation is complete', async () => {
    const { user: proposalAuthor, space: testSpace } = await generateUserAndSpace({
      isAdmin: true,
      walletAddress: randomETHWalletAddress()
    });

    await prisma.space.update({
      where: {
        id: testSpace.id
      },
      data: {
        useOnchainCredentials: true,
        credentialsChainId: 10
      }
    });

    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: testSpace.id,
      credentialEvents: ['proposal_approved']
    });

    const proposal = await testUtilsProposals.generateProposal({
      authors: [proposalAuthor.id],
      proposalStatus: 'published',
      selectedCredentialTemplateIds: [credentialTemplate.id],
      evaluationInputs: [
        { evaluationType: 'feedback', title: 'Feedback', result: 'pass', reviewers: [], permissions: [] }
      ],
      spaceId: testSpace.id,
      userId: proposalAuthor.id
    });

    const defaultBoard = getDefaultBoard({
      evaluationStepTitles: []
    });

    await prisma.proposalBlock.create({
      data: {
        fields: {
          ...defaultBoard.fields,
          cardProperties: [...defaultBoard.fields.cardProperties] as unknown as Prisma.InputJsonArray
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
            ...proposalFields.properties
          }
        }
      }
    });

    const databaseBoard = await generateProposalSourceDb({
      createdBy: proposalAuthor.id,
      spaceId: testSpace.id
    });

    const cards = await getCardPropertiesFromProposals({
      space: {
        features: testSpace.features,
        credentialTemplates: [credentialTemplate],
        id: testSpace.id,
        useOnchainCredentials: true
      },
      cardProperties: databaseBoard.fields.cardProperties
    });
    const cardBlock = Object.values(cards)[0];

    const statusProp = databaseBoard.fields.cardProperties.find(
      (prop) => prop.type === 'proposalStatus'
    ) as IPropertyTemplate;

    const stepProp = databaseBoard.fields.cardProperties.find(
      (prop) => prop.type === 'proposalStep'
    ) as IPropertyTemplate;

    const evaluationTypeProp = databaseBoard.fields.cardProperties.find(
      (prop) => prop.type === 'proposalEvaluationType'
    ) as IPropertyTemplate;

    expect(cardBlock.fields.properties[statusProp.id]).toEqual('in_progress');
    expect(cardBlock.fields.properties[stepProp.id]).toEqual('Credentials');
    expect(cardBlock.fields.properties[evaluationTypeProp.id]).toEqual('credentials');

    await prisma.issuedCredential.create({
      data: {
        credentialEvent: 'proposal_approved',
        credentialTemplateId: credentialTemplate.id,
        userId: proposalAuthor.id,
        onchainAttestationId: randomETHWalletAddress(),
        proposalId: proposal.id
      }
    });

    const cardsAfterUpdate = await getCardPropertiesFromProposals({
      space: {
        features: testSpace.features,
        credentialTemplates: [credentialTemplate],
        id: testSpace.id,
        useOnchainCredentials: true
      },
      cardProperties: databaseBoard.fields.cardProperties
    });
    const cardBlockAfterUpdate = Object.values(cardsAfterUpdate)[0];

    expect(cardBlockAfterUpdate.fields.properties[statusProp.id]).toEqual('pass');
    expect(cardBlockAfterUpdate.fields.properties[stepProp.id]).toEqual('Credentials');
    expect(cardBlockAfterUpdate.fields.properties[evaluationTypeProp.id]).toEqual('credentials');
  });
});
