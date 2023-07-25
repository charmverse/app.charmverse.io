import type { ProposalCategory, Space, User } from '@charmverse/core/prisma-client';
import { ProposalStatus, prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';

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
  it('should create proposalStatus, proposalCategory and proposalUrl properties; the option ID for a proposal category should be its ID and the proposal status field should contain all non draft statuses as well as "archived"', async () => {
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
        fields: {},
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
          cardProperties: [{ id: uuid(), name: 'Text', type: 'text', options: [] } as IPropertyTemplate]
        } as any,
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
        fields: {},
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
});
