import type { Prisma, ProposalCategory, Space, User } from '@charmverse/core/prisma-client';
import { ProposalStatus, prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { BoardFields, IPropertyTemplate } from 'lib/focalboard/board';
import { InvalidStateError } from 'lib/middleware';

import { setDatabaseProposalProperties } from '../setDatabaseProposalProperties';

const statusPropertyOptions = [...objectUtils.typedKeys(ProposalStatus).filter((s) => s !== 'draft'), 'archived'];

describe('setDatabaseProposalProperties()', () => {
  let space: Space;
  let user: User;
  let proposalCategory: ProposalCategory;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({});
    space = generated.space;
    user = generated.user;
    proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });
  });

  // Not using rubrics defined by not having any proposals in space with type rubric
  it('should create only proposalStatus, proposalCategory and proposalUrl properties if the space does not use rubrics; the option ID for a proposal category should be its ID and the proposal status field should contain all non draft statuses as well as "archived"', async () => {
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

    await setDatabaseProposalProperties({
      databaseId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];

    expect(properties.length).toBe(3);

    // Check category
    const categoryProp = properties.find((p) => p.type === 'proposalCategory');

    expect(categoryProp).toBeDefined();

    expect(categoryProp?.options).toHaveLength(1);
    expect(categoryProp?.options[0].id).toBe(proposalCategory.id);

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

  it('should create proposalStatus, proposalCategory and proposalUrl, proposalEvaluatedBy, proposalEvaluationAverage, proposalEvaluationTotal properties if the space has rubric proposals; the option ID for a proposal category should be its ID and the proposal status field should contain all non draft statuses as well as "archived"', async () => {
    const { user: spaceUser, space: spaceWithRubrics } = await testUtilsUser.generateUserAndSpace();

    const rootId = uuid();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: spaceWithRubrics.id,
      userId: spaceUser.id,
      evaluationType: 'rubric'
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

    await setDatabaseProposalProperties({
      databaseId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];

    expect(properties.length).toBe(6);

    // Check category
    const categoryProp = properties.find((p) => p.type === 'proposalCategory');

    expect(categoryProp).toBeDefined();

    expect(categoryProp?.options).toHaveLength(1);
    expect(categoryProp?.options[0].id).toBe(proposal.categoryId);

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

    await setDatabaseProposalProperties({
      databaseId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];

    // 3 proposal props + 1 existing prop
    expect(properties.length).toBe(4);

    // Load up the properties
    const textProp = properties.find((p) => p.type === 'text') as IPropertyTemplate;
    const categoryProp = properties.find((p) => p.type === 'proposalCategory') as IPropertyTemplate;
    const statusProp = properties.find((p) => p.type === 'proposalStatus') as IPropertyTemplate;
    const urlProp = properties.find((p) => p.type === 'proposalUrl') as IPropertyTemplate;

    // --- Run this a second and third time
    await setDatabaseProposalProperties({
      databaseId: rootId
    });
    await setDatabaseProposalProperties({
      databaseId: rootId
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

    const categoryPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.type === 'proposalCategory');

    expect(categoryPropAfterUpdate).toBeDefined();
    expect(categoryPropAfterUpdate).toMatchObject(categoryProp);

    const statusPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.type === 'proposalStatus');

    expect(statusPropAfterUpdate).toBeDefined();
    expect(statusPropAfterUpdate).toMatchObject(statusProp);

    const urlPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.type === 'proposalUrl');

    expect(urlPropAfterUpdate).toBeDefined();
    expect(urlPropAfterUpdate).toMatchObject(urlProp);
  });
  it('should update proposal category names and add new proposal categories', async () => {
    const { user: userInNewSpace, space: spaceWithMultiCategory } = await testUtilsUser.generateUserAndSpace({});

    const firstCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: spaceWithMultiCategory.id
    });

    const rootId = uuid();

    const databaseBlock = await prisma.block.create({
      data: {
        parentId: rootId,
        rootId,
        id: rootId,
        schema: -1,
        title: 'Example',
        type: 'board',
        updatedBy: userInNewSpace.id,
        fields: {
          sourceType: 'proposals'
        } as Partial<BoardFields> as Prisma.InputJsonValue,
        space: { connect: { id: spaceWithMultiCategory.id } },
        user: { connect: { id: userInNewSpace.id } }
      }
    });

    const initial = await setDatabaseProposalProperties({
      databaseId: rootId
    });

    const updatedBlock = await prisma.block.findUnique({
      where: {
        id: rootId
      }
    });

    const properties = (updatedBlock?.fields as any).cardProperties as IPropertyTemplate[];

    expect(properties.length).toBe(3);

    // Load up the properties
    const categoryProp = properties.find((p) => p.type === 'proposalCategory') as IPropertyTemplate;

    expect(categoryProp.options).toHaveLength(1);

    const existingCategoryOption = categoryProp.options[0];
    expect(existingCategoryOption.id).toBe(firstCategory.id);
    expect(existingCategoryOption.value).toBe(firstCategory.title);

    // Add a second category and update the first
    const updatedCategory = await prisma.proposalCategory.update({
      where: {
        id: firstCategory.id
      },
      data: {
        title: 'Updated Title for category'
      }
    });

    const newCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: spaceWithMultiCategory.id
    });

    await setDatabaseProposalProperties({
      databaseId: rootId
    });

    const blockAfterMultiUpdate = await prisma.block.findUniqueOrThrow({
      where: {
        id: rootId
      }
    });
    const propertiesAfterMultiUpdate = (blockAfterMultiUpdate?.fields as any).cardProperties as IPropertyTemplate[];

    const categoryPropAfterUpdate = propertiesAfterMultiUpdate.find((p) => p.type === 'proposalCategory');
    expect(categoryPropAfterUpdate).toBeDefined();
    expect(categoryPropAfterUpdate?.options).toHaveLength(2);

    const firstCategoryOption = categoryPropAfterUpdate?.options.find((opt) => opt.id === firstCategory.id);
    expect(firstCategoryOption?.id).toBe(firstCategory.id);
    expect(firstCategoryOption?.value).toBe(updatedCategory.title);

    const newCategoryOption = categoryPropAfterUpdate?.options.find((opt) => opt.id === newCategory.id);
    expect(newCategoryOption?.id).toBe(newCategory.id);
    expect(newCategoryOption?.value).toBe(newCategory.title);
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
        } as Partial<BoardFields> as Prisma.InputJsonValue,
        space: { connect: { id: space.id } },
        user: { connect: { id: user.id } }
      }
    });

    await expect(
      setDatabaseProposalProperties({
        databaseId: rootId
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
