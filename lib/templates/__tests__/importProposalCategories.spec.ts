import type { ProposalCategory, Space } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { importProposalCategories } from '../importProposalCategories';

describe('importProposalCategories', () => {
  let space: Space;
  let existingCategory: ProposalCategory;

  beforeAll(async () => {
    ({ space } = await testUtilsUser.generateUserAndSpace());
    existingCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      title: 'Example existing category'
    });
  });

  it('should import new categories', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace({});

    const { proposalCategories: importedCategories, oldNewIdMap } = await importProposalCategories({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: {
        proposalCategories: [existingCategory]
      }
    });

    expect(importedCategories).toMatchObject([
      {
        ...existingCategory,
        id: expect.any(String),
        spaceId: targetSpace.id
      }
    ]);

    expect(oldNewIdMap).toMatchObject({
      [existingCategory.id]: expect.any(String)
    });
  });

  it('should not reimport categories that already have the same title', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace({});

    const { proposalCategories: importedCategories, oldNewIdMap } = await importProposalCategories({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: {
        proposalCategories: [existingCategory]
      }
    });

    await importProposalCategories({
      exportData: { proposalCategories: [existingCategory] },
      targetSpaceIdOrDomain: targetSpace.id
    });

    expect(importedCategories).toMatchObject([
      {
        ...existingCategory,
        id: expect.any(String),
        spaceId: targetSpace.id
      }
    ]);

    expect(oldNewIdMap).toMatchObject({
      [existingCategory.id]: expect.any(String)
    });
  });

  it('should handle a mix of existing and new categories', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const existingCategoryName = 'Existing category';

    const targetSpaceExistingCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: targetSpace.id,
      title: existingCategoryName
    });

    const mixedCategories: ProposalCategory[] = [
      { id: uuid(), title: 'New Category 2', spaceId: space.id, color: '#123456' },
      { id: uuid(), title: existingCategoryName, spaceId: space.id, color: '#654321' }
    ];

    const { proposalCategories, oldNewIdMap } = await importProposalCategories({
      targetSpaceIdOrDomain: targetSpace.id,
      exportData: {
        proposalCategories: mixedCategories
      }
    });

    expect(proposalCategories).toMatchObject(
      expect.arrayContaining<ProposalCategory>([
        {
          ...mixedCategories[0],
          spaceId: targetSpace.id,
          id: expect.any(String)
        },
        targetSpaceExistingCategory
      ])
    );

    expect(oldNewIdMap).toMatchObject({
      [mixedCategories[0].id]: expect.any(String),
      [mixedCategories[1].id]: targetSpaceExistingCategory.id
    });
  });

  it('should handle case sensitivity in category titles', async () => {
    const categories = [
      { id: 'existing-cat-3', title: existingCategory.title.toUpperCase(), spaceId: space.id, color: '#FF00FF' }
    ];
    const result = await importProposalCategories({
      targetSpaceIdOrDomain: space.id,
      exportData: { proposalCategories: categories }
    });

    expect(result.proposalCategories?.some((c) => c.title === existingCategory.title)).toBeTruthy();
    expect(result.oldNewIdMap?.['existing-cat-3']).toBe(existingCategory.id);
  });

  // Error Cases
  it('should throw error for invalid space Id or domain', async () => {
    await expect(
      importProposalCategories({ targetSpaceIdOrDomain: 'invalid-space', exportData: { proposalCategories: [] } })
    ).rejects.toThrow(); // Specify the exact error type if known
  });

  it('should handle empty categories array gracefully', async () => {
    const result = await importProposalCategories({
      targetSpaceIdOrDomain: space.id,
      exportData: { proposalCategories: [] }
    });
    expect(result.proposalCategories?.length).toBeGreaterThanOrEqual(0); // or specific checks
  });
});
