import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { getProposalTemplates } from '../getProposalTemplates';

describe('getProposalTemplates', () => {
  it('should return all templates within a paid space', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const createableCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const firstTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: createableCategory.id
    });

    const secondCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const secondTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: createableCategory.id
    });

    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: spaceMember.id
    });

    expect(templates).toHaveLength(2);
    expect(templates.map((t) => t.id)).toMatchObject(expect.arrayContaining([firstTemplate.id, secondTemplate.id]));
  });

  it('should return an empty list for people outside the space since they cannot create proposals', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'community'
    });

    const createableCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    const usableProposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: createableCategory.id
    });
    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: undefined
    });

    expect(templates).toHaveLength(0);
  });
});
describe('getProposalTemplates - public space', () => {
  it('should return all templates for members in a public space', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });

    const firstCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: firstCategory.id
    });

    const secondCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: secondCategory.id
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: spaceMember.id
    });

    expect(templates).toHaveLength(2);
    expect(templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining<Partial<ProposalWithUsers>>({
          authors: expect.any(Array),
          reviewers: expect.any(Array),
          category: firstCategory,
          categoryId: firstCategory.id,
          createdBy: adminUser.id,
          id: expect.any(String)
        }),
        expect.objectContaining<Partial<ProposalWithUsers>>({
          authors: expect.any(Array),
          reviewers: expect.any(Array),
          category: secondCategory,
          categoryId: secondCategory.id,
          createdBy: adminUser.id,
          id: expect.any(String)
        })
      ])
    );
  });
  it('should return an empty list for people outside the space since they cannot create proposals', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });

    const createableCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: createableCategory.id
    });

    const templates = await getProposalTemplates({
      spaceId: space.id,
      userId: undefined
    });

    expect(templates).toHaveLength(0);
  });
});
