import type { FormField, Prisma, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { objectUtils } from '@charmverse/core/utilities';
import { InvalidStateError } from '@packages/nextjs/errors';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import type { BoardFields, IPropertyTemplate } from '@root/lib/databases/board';
import type { SelectOptionType } from '@root/lib/proposals/forms/interfaces';
import { generateProposal } from '@root/lib/testing/proposals';
import { v4 as uuid } from 'uuid';

import { EVALUATION_STATUS_LABELS } from '../../proposalDbProperties';
import { updateBoardProperties } from '../updateBoardProperties';

const statusPropertyOptions = objectUtils.typedKeys(EVALUATION_STATUS_LABELS);

describe('updateBoardProperties()', () => {
  let space: Space;
  let user: User;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({});
    space = generated.space;
    user = generated.user;
  });

  // Not using rubrics defined by not having any proposals in space with type rubric
  it('should create only proposalStatus and proposalUrl properties if the space does not use rubrics; the proposal status field should contain all non draft statuses as well as "archived"', async () => {
    const rootId = uuid();

    const databaseBlock = await prisma.block.create({
      data: {
        parentId: rootId,
        rootId,
        id: rootId,
        schema: -1,
        title: 'Example',
        type: 'board',
        updatedBy: user.id,
        fields: { sourceType: 'proposals' } as Partial<BoardFields> as Prisma.InputJsonValue,
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await updateBoardProperties({
      boardId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];
    // Check status
    const statusProp = properties.find((p) => p.type === 'proposalStatus');

    expect(statusProp).toBeDefined();

    expect(statusProp?.options).toHaveLength(statusPropertyOptions.length);

    statusPropertyOptions?.forEach((status) => {
      const matchingProp = statusProp?.options.find((opt) => opt.value === status);
      expect(matchingProp).toBeDefined();
    });
    // Check url
    const urlProp = properties.find((p) => p.type === 'proposalUrl');

    expect(urlProp).toBeDefined();
  });

  it('should create proposalStatus, and proposalUrl, proposalEvaluatedBy, proposalEvaluationAverage, proposalEvaluationTotal properties if the space has rubric proposals; the proposal status field should contain all non draft statuses as well as "archived"', async () => {
    const { user: spaceUser, space: spaceWithRubrics } = await testUtilsUser.generateUserAndSpace();

    const rootId = uuid();

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: spaceWithRubrics.id,
      userId: spaceUser.id,
      evaluationType: 'rubric',
      pageType: 'proposal_template'
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: spaceWithRubrics.id,
      userId: spaceUser.id,
      evaluationType: 'rubric'
    });

    await prisma.page.update({
      where: {
        id: proposal.page.id
      },
      data: {
        sourceTemplateId: proposalTemplate.page.id
      }
    });

    const databaseBlock = await prisma.block.create({
      data: {
        parentId: rootId,
        rootId,
        id: rootId,
        schema: -1,
        title: 'Example',
        type: 'board',
        updatedBy: user.id,
        fields: {
          sourceType: 'proposals'
        },
        space: { connect: { id: spaceWithRubrics.id } },
        user: { connect: { id: spaceUser.id } }
      }
    });

    await updateBoardProperties({
      boardId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];
    // Check status
    const statusProp = properties.find((p) => p.type === 'proposalStatus');

    expect(statusProp).toBeDefined();

    expect(statusProp?.options).toHaveLength(statusPropertyOptions.length);

    statusPropertyOptions?.forEach((status) => {
      const matchingProp = statusProp?.options.find((opt) => opt.value === status);
      expect(matchingProp).toBeDefined();
    });
    // Check url
    const urlProp = properties.find((p) => p.type === 'proposalUrl');

    expect(urlProp).toBeDefined();

    // Evaluated by
    const evaluatedByProp = properties.find((p) => p.type === 'proposalEvaluatedBy');
    expect(evaluatedByProp).toBeDefined();

    const evaluationTotalProp = properties.find((p) => p.type === 'proposalEvaluationTotal');
    expect(evaluationTotalProp).toBeDefined();

    const evaluationAverageProp = properties.find((p) => p.type === 'proposalEvaluationAverage');
    expect(evaluationAverageProp).toBeDefined();
  });

  it('should create unique proposalRubricCriteriaTotal properties for all unique rubric criteria in the space based on title', async () => {
    const { user: spaceUser, space: spaceWithRubrics } = await testUtilsUser.generateUserAndSpace();

    const rootId = uuid();

    const evaluationInputs: testUtilsProposals.GenerateProposalInput['evaluationInputs'] = [
      {
        evaluationType: 'feedback',
        permissions: [],
        reviewers: [],
        title: 'Feedback'
      },
      {
        evaluationType: 'rubric',
        permissions: [],
        reviewers: [],
        title: 'Rubric 1',
        rubricCriteria: [
          {
            title: 'Criteria 1'
          },
          {
            title: 'Criteria 2'
          }
        ]
      },
      {
        evaluationType: 'rubric',
        permissions: [],
        reviewers: [],
        title: 'Rubric 2',
        rubricCriteria: [
          {
            title: 'Criteria 1'
          },
          {
            title: 'Criteria 2.1'
          }
        ]
      }
    ];

    const proposalTemplate1 = await testUtilsProposals.generateProposal({
      spaceId: spaceWithRubrics.id,
      userId: spaceUser.id,
      evaluationInputs,
      pageType: 'proposal_template'
    });

    const proposal1 = await testUtilsProposals.generateProposal({
      spaceId: spaceWithRubrics.id,
      userId: spaceUser.id,
      evaluationInputs
    });

    const proposalTemplate2 = await testUtilsProposals.generateProposal({
      spaceId: spaceWithRubrics.id,
      userId: spaceUser.id,
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [],
          title: 'Rubric 2',
          rubricCriteria: [
            {
              title: 'Criteria 3'
            }
          ]
        }
      ],
      pageType: 'proposal_template'
    });

    const proposal2 = await testUtilsProposals.generateProposal({
      spaceId: spaceWithRubrics.id,
      userId: spaceUser.id,
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [],
          title: 'Rubric 2',
          rubricCriteria: [
            {
              title: 'Criteria 3'
            }
          ]
        }
      ]
    });

    await Promise.all([
      prisma.page.update({
        where: {
          id: proposal1.page.id
        },
        data: {
          sourceTemplateId: proposalTemplate2.page.id
        }
      }),
      prisma.page.update({
        where: {
          id: proposal2.page.id
        },
        data: {
          sourceTemplateId: proposalTemplate2.page.id
        }
      }),
      prisma.page.updateMany({
        where: {
          proposalId: proposal2.id
        },
        data: {
          deletedAt: new Date()
        }
      }),
      prisma.block.create({
        data: {
          parentId: rootId,
          rootId,
          id: rootId,
          schema: -1,
          title: 'Example',
          type: 'board',
          updatedBy: user.id,
          fields: {
            sourceType: 'proposals'
          },
          space: { connect: { id: spaceWithRubrics.id } },
          user: { connect: { id: spaceUser.id } }
        }
      })
    ]);

    await updateBoardProperties({
      boardId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];
    // Check status
    const rubricCriteria1TotalProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaTotal' && p.criteriaTitle === 'Criteria 1'
    );
    const rubricCriteria2TotalProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaTotal' && p.criteriaTitle === 'Criteria 2'
    );
    const rubricCriteria21TotalProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaTotal' && p.criteriaTitle === 'Criteria 2.1'
    );
    const rubricCriteria1AverageProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaAverage' && p.criteriaTitle === 'Criteria 1'
    );
    const rubricCriteria2AverageProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaAverage' && p.criteriaTitle === 'Criteria 2'
    );
    const rubricCriteria21AverageProperty = properties.find(
      (p) => p.type === 'proposalRubricCriteriaAverage' && p.criteriaTitle === 'Criteria 2.1'
    );

    expect(rubricCriteria1TotalProperty).toBeDefined();
    expect(rubricCriteria2TotalProperty).toBeDefined();
    expect(rubricCriteria21TotalProperty).toBeDefined();
    expect(rubricCriteria1AverageProperty).toBeDefined();
    expect(rubricCriteria2AverageProperty).toBeDefined();
    expect(rubricCriteria21AverageProperty).toBeDefined();
  });

  it('should leave existing property IDs and options unchanged', async () => {
    const rootId = uuid();

    const databaseBlock = await prisma.block.create({
      data: {
        parentId: rootId,
        rootId,
        id: rootId,
        schema: -1,
        title: 'Example',
        type: 'board',
        updatedBy: user.id,
        fields: {
          cardProperties: [{ id: uuid(), name: 'Text', type: 'text', options: [] } as IPropertyTemplate],
          sourceType: 'proposals'
        } as Partial<BoardFields> as Prisma.InputJsonValue,
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await updateBoardProperties({
      boardId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];
    // Load up the properties
    const textProp = properties.find((p) => p.type === 'text') as IPropertyTemplate;
    const statusProp = properties.find((p) => p.type === 'proposalStatus') as IPropertyTemplate;
    const urlProp = properties.find((p) => p.type === 'proposalUrl') as IPropertyTemplate;

    // --- Run this a second and third time
    await updateBoardProperties({
      boardId: rootId
    });
    await updateBoardProperties({
      boardId: rootId
    });

    const blockAfterMultiUpdate = await prisma.block.findUniqueOrThrow({
      where: {
        id: rootId
      }
    });

    const propertiesAfterMultiUpdate = (blockAfterMultiUpdate?.fields as any).cardProperties as IPropertyTemplate[];

    const textPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.type === 'text');

    expect(textPropAfterUpdate).toBeDefined();
    expect(textPropAfterUpdate).toMatchObject(textProp);

    const statusPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.type === 'proposalStatus');

    expect(statusPropAfterUpdate).toBeDefined();
    expect(statusPropAfterUpdate).toMatchObject(statusProp);

    const urlPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.type === 'proposalUrl');

    expect(urlPropAfterUpdate).toBeDefined();
    expect(urlPropAfterUpdate).toMatchObject(urlProp);
  });

  it('should create card properties for proposal form fields', async () => {
    const { user: spaceAdmin, space: testSpace } = await generateUserAndSpace({ isAdmin: true });
    const rootId = uuid();

    const proposalTemplate1 = await testUtilsProposals.generateProposal({
      authors: [spaceAdmin.id],
      pageType: 'proposal_template',
      reviewers: [],
      spaceId: testSpace.id,
      userId: spaceAdmin.id
    });

    const proposalTemplate2 = await testUtilsProposals.generateProposal({
      authors: [spaceAdmin.id],
      pageType: 'proposal_template',
      reviewers: [],
      spaceId: testSpace.id,
      userId: spaceAdmin.id
    });

    const proposal = await generateProposal({
      spaceId: testSpace.id,
      userId: spaceAdmin.id
    });

    const proposal2 = await generateProposal({
      spaceId: testSpace.id,
      userId: spaceAdmin.id
    });

    await Promise.all([
      prisma.page.updateMany({
        where: {
          path: proposal.page.path
        },
        data: {
          sourceTemplateId: proposalTemplate1.page.id
        }
      }),
      prisma.page.updateMany({
        where: {
          path: proposal2.page.path
        },
        data: {
          sourceTemplateId: proposalTemplate2.page.id
        }
      })
    ]);

    const form1 = await prisma.form.create({
      data: {
        proposal: {
          connect: {
            id: proposalTemplate1.id
          }
        },
        formFields: {
          createMany: {
            data: [
              {
                name: 'Short Text',
                type: 'short_text'
              },
              {
                name: 'Long Text',
                type: 'long_text'
              },
              {
                name: 'Options',
                type: 'select',
                options: [
                  {
                    name: 'Option 1',
                    id: uuid(),
                    color: 'red'
                  },
                  {
                    name: 'Option 2',
                    id: uuid(),
                    color: 'yellow'
                  }
                ]
              }
            ]
          }
        }
      },
      include: {
        formFields: true
      }
    });

    const form2 = await prisma.form.create({
      data: {
        proposal: {
          connect: {
            id: proposalTemplate2.id
          }
        },
        formFields: {
          createMany: {
            data: [
              {
                name: 'Email',
                type: 'email'
              },
              {
                name: 'Date',
                type: 'date'
              }
            ]
          }
        }
      },
      include: {
        formFields: true
      }
    });

    const form1Fields = form1.formFields;

    await Promise.all([
      prisma.proposal.update({
        where: {
          id: proposal.id
        },
        data: {
          form: {
            connect: {
              id: form1.id
            }
          }
        }
      }),
      prisma.proposal.update({
        where: {
          id: proposal2.id
        },
        data: {
          form: {
            connect: {
              id: form2.id
            }
          }
        }
      })
    ]);

    await prisma.block.create({
      data: {
        parentId: rootId,
        rootId,
        id: rootId,
        schema: -1,
        title: 'Example',
        type: 'board',
        updatedBy: spaceAdmin.id,
        fields: {
          cardProperties: [{ id: uuid(), name: 'Text', type: 'text', options: [] } as IPropertyTemplate],
          sourceType: 'proposals'
        } as Partial<BoardFields> as Prisma.InputJsonValue,
        space: { connect: { id: testSpace.id } },
        user: { connect: { id: spaceAdmin.id } }
      }
    });

    await updateBoardProperties({
      boardId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];
    // Load up the properties
    const shortTextField = form1Fields.find((p) => p.type === 'short_text') as FormField;
    const longTextField = form1Fields.find((p) => p.type === 'long_text') as FormField;
    const selectField = form1Fields.find((p) => p.type === 'select') as FormField;
    const emailField = form2.formFields.find((p) => p.type === 'email') as FormField;
    const dateField = form2.formFields.find((p) => p.type === 'date') as FormField;

    const shortTextPropIndex = properties.findIndex((p) => p.formFieldId === shortTextField.id);
    const longTextPropIndex = properties.findIndex((p) => p.formFieldId === longTextField.id);
    const selectPropIndex = properties.findIndex((p) => p.formFieldId === selectField.id);
    const emailPropIndex = properties.findIndex((p) => p.formFieldId === emailField.id);
    const datePropIndex = properties.findIndex((p) => p.formFieldId === dateField.id);

    const shortTextProp = properties[shortTextPropIndex] as IPropertyTemplate;
    const longTextProp = properties[longTextPropIndex] as IPropertyTemplate;
    const selectProp = properties[selectPropIndex] as IPropertyTemplate;
    const emailProp = properties[emailPropIndex] as IPropertyTemplate;
    const dateProp = properties[datePropIndex] as IPropertyTemplate;

    expect(shortTextPropIndex === longTextPropIndex - 1).toBe(true);
    expect(longTextPropIndex === selectPropIndex - 1).toBe(true);
    expect(selectPropIndex === emailPropIndex - 1).toBe(true);
    expect(emailPropIndex === datePropIndex - 1).toBe(true);

    expect(shortTextProp).toMatchObject(
      expect.objectContaining({
        name: shortTextField.name,
        type: 'text',
        options: []
      })
    );

    expect(longTextProp).toMatchObject(
      expect.objectContaining({
        name: longTextField.name,
        type: 'text',
        options: []
      })
    );

    expect(selectProp).toMatchObject(
      expect.objectContaining({
        name: selectField.name,
        type: 'select',
        options: ((selectField.options ?? []) as SelectOptionType[]).map((option) => ({
          color: option.color,
          id: option.id,
          value: option.name
        }))
      })
    );

    expect(emailProp).toMatchObject(
      expect.objectContaining({
        name: emailField.name,
        type: 'email',
        options: []
      })
    );

    expect(dateProp).toMatchObject(
      expect.objectContaining({
        name: dateField.name,
        type: 'date',
        options: []
      })
    );

    const updatedSelectField = await prisma.formField.update({
      where: {
        id: selectField.id
      },
      data: {
        name: 'New Option',
        options: [
          ...((selectField.options ?? []) as SelectOptionType[]),
          {
            name: 'Option 3',
            id: uuid(),
            color: 'blue'
          }
        ]
      }
    });

    // --- Run this a second and third time
    await updateBoardProperties({
      boardId: rootId
    });

    const blockAfterMultiUpdate = await prisma.block.findUniqueOrThrow({
      where: {
        id: rootId
      }
    });

    const propertiesAfterMultiUpdate = (blockAfterMultiUpdate?.fields as any).cardProperties as IPropertyTemplate[];

    const shortTextPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.formFieldId === shortTextField.id);

    expect(shortTextPropAfterUpdate).toMatchObject(shortTextProp);

    const longTextPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.formFieldId === longTextField.id);

    expect(longTextPropAfterUpdate).toMatchObject(longTextProp);

    const selectPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.formFieldId === selectField.id);

    expect(selectPropAfterUpdate).toMatchObject({
      ...selectProp,
      name: 'New Option',
      options: ((updatedSelectField.options ?? []) as SelectOptionType[]).map((option) => ({
        color: option.color,
        id: option.id,
        value: option.name
      }))
    });
  });

  it('should throw an error if the database source is not of type proposals', async () => {
    const rootId = uuid();

    const databaseBlock = await prisma.block.create({
      data: {
        parentId: rootId,
        rootId,
        id: rootId,
        schema: -1,
        title: 'Example',
        type: 'board',
        updatedBy: user.id,
        fields: {
          sourceType: 'board_page'
        },
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await expect(
      updateBoardProperties({
        boardId: rootId
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
