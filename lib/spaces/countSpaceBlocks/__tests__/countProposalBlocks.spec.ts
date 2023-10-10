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

  it('should count each proposal view, proposal categories, proposal properties, and proposal property values as 1 block', async () => {
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
        proposalCategories: 2
      }
    });
  });

  it('should ignore deleted proposals', async () => {
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
        proposalCategories: 2
      }
    });
  });

  it('should return 0 when there are no proposals, views, or categories', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    // Assuming that a new space has no proposals, views, or categories
    const count = await countProposalBlocks({ spaceId: space.id });
    expect(count.total).toBe(0);
  });
});
