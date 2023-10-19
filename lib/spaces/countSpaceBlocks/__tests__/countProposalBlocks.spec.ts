import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { generateSchema } from 'testing/publicApi/schemas';

import type { ProposalBlocksCount } from '../countProposalBlocks';
import { countProposalBlocks } from '../countProposalBlocks';

describe('countProposalBlocks', () => {
  // Provided schema generation code
  const selectSchema = generateSchema({ type: 'select', options: ['Blue', 'Green', 'Red'] });
  const multiSelectSchema = generateSchema({ type: 'multiSelect', options: ['Blue', 'Green', 'Red'] });
  const numberSchema = generateSchema({ type: 'number' });
  const textSchema = generateSchema({ type: 'text' });
  const dateSchema = generateSchema({ type: 'date' });
  const checkboxSchema = generateSchema({ type: 'checkbox' });
  const urlSchema = generateSchema({ type: 'url' });

  const propertyTemplates = [
    selectSchema,
    multiSelectSchema,
    numberSchema,
    textSchema,
    dateSchema,
    checkboxSchema,
    urlSchema
  ];

  it('should count each rubric criteria, rubric criteria answer, proposal view, proposal categories, proposal properties, proposal property values as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      customProposalProperties: propertyTemplates
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    // Generating two proposal categories
    const proposalCategory1 = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
    const proposalCategory2 = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });

    // Generating proposals for each category
    const proposal1 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory1.id,
      customProperties: {
        [textSchema.id]: 'Text',
        [selectSchema.id]: selectSchema.options[0].id
      }
    });
    const proposal2 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationType: 'rubric',
      categoryId: proposalCategory2.id,
      customProperties: {
        [numberSchema.id]: 8,
        [urlSchema.id]: 'www.example.com'
      }
    });

    const rubricCriteria = await Promise.all([
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          proposalId: proposal2.id,
          title: 'First Criteria',
          type: 'range',
          description: ''
        }
      }),
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          proposalId: proposal2.id,
          title: 'Second Criteria',
          type: 'range',
          description: ''
        }
      })
    ]);

    const rubricAnswers = await prisma.proposalRubricCriteriaAnswer.createMany({
      data: [
        {
          proposalId: proposal2.id,
          response: {},
          rubricCriteriaId: rubricCriteria[0].id,
          userId: user.id
        },
        {
          proposalId: proposal2.id,
          response: {},
          rubricCriteriaId: rubricCriteria[1].id,
          userId: user.id
        },
        {
          proposalId: proposal2.id,
          response: {},
          rubricCriteriaId: rubricCriteria[0].id,
          userId: spaceMember.id
        },
        {
          proposalId: proposal2.id,
          response: {},
          rubricCriteriaId: rubricCriteria[1].id,
          userId: spaceMember.id
        }
      ]
    });

    await prisma.proposalBlock.create({
      data: {
        type: 'view',
        spaceId: space.id,
        createdBy: user.id,
        updatedBy: user.id,
        id: uuid(),
        parentId: space.id,
        rootId: space.id,
        schema: 1,
        title: 'Table',
        fields: {
          cardProperties: propertyTemplates
        } as any
      }
    });
    const count = await countProposalBlocks({ spaceId: space.id });
    expect(count).toMatchObject<ProposalBlocksCount>({
      total: 20,
      details: {
        proposalViews: 1,
        proposalProperties: 7,
        proposalPropertyValues: 4,
        proposalCategories: 2,
        proposalRubricAnswers: 4,
        proposalRubrics: 2
      }
    });
  });

  it('should ignore any properties or rubrics related to deleted proposals', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      customProposalProperties: propertyTemplates
    });

    // Generating two proposal categories
    const proposalCategory1 = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
    const proposalCategory2 = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });

    // Generating proposals for each category
    const proposal1 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory1.id,
      customProperties: {
        [textSchema.id]: 'Text',
        [selectSchema.id]: selectSchema.options[0].id
      }
    });
    const proposal2 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory2.id,
      customProperties: {
        [numberSchema.id]: 8,
        [urlSchema.id]: 'www.example.com'
      }
    });

    const deletedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      deletedAt: new Date(),
      categoryId: proposalCategory2.id,
      customProperties: {
        [numberSchema.id]: 8,
        [urlSchema.id]: 'www.example.com'
      }
    });

    const deletedProposalRubricCriteria = await Promise.all([
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          proposalId: deletedProposal.id,
          title: 'First Criteria',
          type: 'range',
          description: ''
        }
      }),
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          proposalId: deletedProposal.id,
          title: 'Second Criteria',
          type: 'range',
          description: ''
        }
      })
    ]);

    const rubricAnswers = await prisma.proposalRubricCriteriaAnswer.createMany({
      data: [
        {
          proposalId: deletedProposal.id,
          response: {},
          rubricCriteriaId: deletedProposalRubricCriteria[0].id,
          userId: user.id
        },
        {
          proposalId: deletedProposal.id,
          response: {},
          rubricCriteriaId: deletedProposalRubricCriteria[1].id,
          userId: user.id
        }
      ]
    });

    await prisma.proposalBlock.create({
      data: {
        type: 'view',
        spaceId: space.id,
        createdBy: user.id,
        updatedBy: user.id,
        id: uuid(),
        parentId: space.id,
        rootId: space.id,
        schema: 1,
        title: 'Table',
        fields: {
          cardProperties: propertyTemplates
        } as any
      }
    });
    const count = await countProposalBlocks({ spaceId: space.id });
    expect(count).toMatchObject<ProposalBlocksCount>({
      total: 14,
      details: {
        proposalViews: 1,
        proposalProperties: 7,
        proposalPropertyValues: 4,
        proposalCategories: 2,
        proposalRubricAnswers: 0,
        proposalRubrics: 0
      }
    });
  });

  it('should return 0 when there are no proposals, views, or categories', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    // Assuming that a new space has no proposals, views, or categories
    const count = await countProposalBlocks({ spaceId: space.id });
    expect(count).toMatchObject<ProposalBlocksCount>({
      total: 0,
      details: {
        proposalViews: 0,
        proposalProperties: 0,
        proposalPropertyValues: 0,
        proposalCategories: 0,
        proposalRubricAnswers: 0,
        proposalRubrics: 0
      }
    });
  });
});
