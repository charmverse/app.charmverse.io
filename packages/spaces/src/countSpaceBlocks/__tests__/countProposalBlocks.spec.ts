import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { v4 as uuid } from 'uuid';

import checkbox from 'components/common/DatabaseEditor/widgets/checkbox';

import type { ProposalBlocksCount } from '../countProposalBlocks';
import { countProposalBlocks } from '../countProposalBlocks';

describe('countProposalBlocks()', () => {
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

  it('should count each rubric criteria, rubric criteria answer, proposal view, proposal properties, proposal form field answers, proposal property values as 1 block', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      customProposalProperties: propertyTemplates
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const proposal1 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      customProperties: {
        [textSchema.id]: 'Text',
        [selectSchema.id]: selectSchema.options[0].id,
        [checkboxSchema.id]: false
      }
    });

    const proposal2 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationType: 'rubric',
      customProperties: {
        [numberSchema.id]: 8,
        [urlSchema.id]: 'www.example.com'
      }
    });

    const proposal3 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationType: 'feedback',
      customProperties: {
        // Empty string should be ignored
        [textSchema.id]: ''
      }
    });

    const form = await prisma.form.create({
      data: {
        formFields: {
          createMany: {
            data: [
              {
                name: 'Short Text',
                type: 'short_text'
              },
              {
                name: 'Email',
                type: 'email'
              }
            ]
          }
        }
      },
      include: {
        formFields: true
      }
    });

    await Promise.all(
      [proposal1.id, proposal2.id].map((proposalId) =>
        prisma.form.update({
          where: {
            id: form.id
          },
          data: {
            proposal: {
              connect: {
                id: proposalId
              }
            }
          }
        })
      )
    );

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          fieldId: form.formFields[0].id,
          proposalId: proposal1.id,
          type: 'short_text',
          value: 'Short Text Answer'
        },
        {
          fieldId: form.formFields[1].id,
          proposalId: proposal1.id,
          type: 'email',
          value: 'john.doe@gmail.com'
        }
      ]
    });

    await prisma.formFieldAnswer.createMany({
      data: [
        {
          fieldId: form.formFields[0].id,
          proposalId: proposal2.id,
          type: 'short_text',
          value: 'Short Text Answer 2'
        }
      ]
    });

    const rubricCriteria = await Promise.all([
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          evaluationId: proposal2.evaluations[0].id,
          proposalId: proposal2.id,
          title: 'First Criteria',
          type: 'range',
          description: ''
        }
      }),
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          evaluationId: proposal2.evaluations[0].id,
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
          evaluationId: proposal2.evaluations[0].id,
          proposalId: proposal2.id,
          response: {},
          rubricCriteriaId: rubricCriteria[0].id,
          userId: user.id
        },
        {
          evaluationId: proposal2.evaluations[0].id,
          proposalId: proposal2.id,
          response: {},
          rubricCriteriaId: rubricCriteria[1].id,
          userId: user.id
        },
        {
          evaluationId: proposal2.evaluations[0].id,
          proposalId: proposal2.id,
          response: {},
          rubricCriteriaId: rubricCriteria[0].id,
          userId: spaceMember.id
        },
        {
          evaluationId: proposal2.evaluations[0].id,
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
        proposalPropertyValues: 5,
        proposalRubricAnswers: 4,
        proposalFormFields: 3
      }
    });
  });

  it('should ignore any properties or rubrics related to deleted proposals', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      customProposalProperties: propertyTemplates
    });

    const proposal1 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      evaluationType: 'pass_fail',
      userId: user.id,
      customProperties: {
        [textSchema.id]: 'Text',
        [selectSchema.id]: selectSchema.options[0].id
      }
    });
    const proposal2 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      evaluationType: 'pass_fail',
      userId: user.id,
      customProperties: {
        [numberSchema.id]: 8,
        [urlSchema.id]: 'www.example.com'
      }
    });

    const deletedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationType: 'pass_fail',
      deletedAt: new Date(),
      customProperties: {
        [numberSchema.id]: 8,
        [urlSchema.id]: 'www.example.com'
      }
    });

    const deletedProposalRubricCriteria = await Promise.all([
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          evaluationId: deletedProposal.evaluations[0].id,
          proposalId: deletedProposal.id,
          title: 'First Criteria',
          type: 'range',
          description: ''
        }
      }),
      prisma.proposalRubricCriteria.create({
        data: {
          parameters: [],
          evaluationId: deletedProposal.evaluations[0].id,
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
          evaluationId: deletedProposal.evaluations[0].id,
          proposalId: deletedProposal.id,
          response: {},
          rubricCriteriaId: deletedProposalRubricCriteria[0].id,
          userId: user.id
        },
        {
          evaluationId: deletedProposal.evaluations[0].id,
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
      total: 12,
      details: {
        proposalViews: 1,
        proposalProperties: 7,
        proposalPropertyValues: 4,
        proposalRubricAnswers: 0,
        proposalFormFields: 0
      }
    });
  });

  it('should return 0 when there are no proposals or views', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    // Assuming that a new space has no proposals or views
    const count = await countProposalBlocks({ spaceId: space.id });
    expect(count).toMatchObject<ProposalBlocksCount>({
      total: 0,
      details: {
        proposalViews: 0,
        proposalProperties: 0,
        proposalPropertyValues: 0,
        proposalRubricAnswers: 0,
        proposalFormFields: 0
      }
    });
  });
});
