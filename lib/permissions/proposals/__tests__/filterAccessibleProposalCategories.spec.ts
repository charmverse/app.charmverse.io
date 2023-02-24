import type { ProposalCategory, ProposalCategoryPermissionLevel, Space, User } from '@prisma/client';

import { addSpaceOperations } from 'lib/permissions/spaces';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { AvailableProposalCategoryPermissions } from '../availableProposalCategoryPermissions.class';
import { filterAccessibleProposalCategories } from '../filterAccessibleProposalCategories';
import { proposalCategoryPermissionsMapping } from '../mapping';
import { upsertProposalCategoryPermission } from '../upsertProposalCategoryPermission';

let adminUser: User;
let spaceMemberUser: User;
let authorUser: User;
let space: Space;

let otherSpace: Space;
let otherSpaceAdminUser: User;

// Proposal categories
let adminOnlyCategory: ProposalCategory;
let spaceOnlyCategory: ProposalCategory;

let publicCategory: ProposalCategory;

let proposalCategories: ProposalCategory[];

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  authorUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

  const secondGenerated = await generateUserAndSpace({ isAdmin: true });
  otherSpaceAdminUser = secondGenerated.user;
  otherSpace = secondGenerated.space;

  adminOnlyCategory = await generateProposalCategory({
    spaceId: space.id,
    title: 'Admin category'
  });

  spaceOnlyCategory = await generateProposalCategory({
    spaceId: space.id,
    title: 'Space category'
  });
  await upsertProposalCategoryPermission({
    permissionLevel: 'full_access',
    proposalCategoryId: spaceOnlyCategory.id,
    assignee: { group: 'space', id: space.id }
  });
  publicCategory = await generateProposalCategory({
    spaceId: space.id,
    title: 'Public category'
  });
  await upsertProposalCategoryPermission({
    permissionLevel: 'view',
    proposalCategoryId: publicCategory.id,
    assignee: { group: 'public' }
  });

  proposalCategories = [adminOnlyCategory, spaceOnlyCategory, publicCategory];
});

describe('filterAccessibleProposalCategories', () => {
  it('returns only categories a member can see, including public categories and create_proposal set to correct value', async () => {
    const visibleCategories = await filterAccessibleProposalCategories({
      proposalCategories,
      userId: spaceMemberUser.id
    });

    const spaceCategoryPermissions = new AvailableProposalCategoryPermissions();
    spaceCategoryPermissions.addPermissions(proposalCategoryPermissionsMapping.full_access);

    const publicCategoryPermissions = new AvailableProposalCategoryPermissions();
    publicCategoryPermissions.addPermissions(proposalCategoryPermissionsMapping.view);

    expect(visibleCategories.length).toBe(2);
    expect(visibleCategories).toContainEqual({
      ...spaceOnlyCategory,
      permissions: spaceCategoryPermissions.operationFlags
    });
    expect(visibleCategories).toContainEqual({
      ...publicCategory,
      permissions: publicCategoryPermissions.operationFlags
    });
  });
  it('returns all categories if user is admin', async () => {
    const visibleCategories = await filterAccessibleProposalCategories({
      proposalCategories,
      userId: adminUser.id
    });

    const permissions = new AvailableProposalCategoryPermissions().full;

    expect(visibleCategories.length).toBe(proposalCategories.length);
    expect(visibleCategories).toContainEqual({ ...adminOnlyCategory, permissions });
    expect(visibleCategories).toContainEqual({ ...spaceOnlyCategory, permissions });
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });

  // No special category-level overrides apart from being able to see the category
  it('returns only categories user has access to if user is a spacewide proposal reviewer, and applicable permissions for that category', async () => {
    const spaceWideProposalReviewerUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceWideProposalReviewerUser.id]
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['reviewProposals'],
      roleId: role.id
    });

    const visibleCategories = await filterAccessibleProposalCategories({
      proposalCategories,
      userId: spaceWideProposalReviewerUser.id
    });

    const spaceWideReviewerPermissions = new AvailableProposalCategoryPermissions();
    expect(visibleCategories.length).toBe(2);
    // This should contain create_proposal, because the space has full access to the category
    expect(visibleCategories).toContainEqual({
      ...spaceOnlyCategory,
      permissions: { ...spaceWideReviewerPermissions.empty, create_proposal: true }
    });
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions: spaceWideReviewerPermissions.empty });
  });

  it('returns only categories accessible to the public if there is no user, or user is not a space member, and create_proposal set to false', async () => {
    const permissions = new AvailableProposalCategoryPermissions().empty;

    let visibleCategories = await filterAccessibleProposalCategories({
      proposalCategories,
      userId: otherSpaceAdminUser.id
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });

    visibleCategories = await filterAccessibleProposalCategories({
      proposalCategories,
      userId: undefined
    });

    expect(visibleCategories.length).toBe(1);
    expect(visibleCategories).toContainEqual({ ...publicCategory, permissions });
  });
});
