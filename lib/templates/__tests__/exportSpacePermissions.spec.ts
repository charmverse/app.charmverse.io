import { InvalidInputError } from '@charmverse/core/errors';
import type { AssignedProposalCategoryPermission } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import type { SpacePermissionsExport } from '../exportSpacePermissions';
import { exportSpacePermissions } from '../exportSpacePermissions';

describe('exportSpacePermissions', () => {
  it('return roles, proposal category permissions and space permissions', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposalReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });
    const secondProposalReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    const spacePermissions = await prisma.$transaction([
      prisma.spacePermission.create({
        data: {
          forSpace: { connect: { id: space.id } },
          role: { connect: { id: proposalReviewerRole.id } }
        }
      })
    ]);

    const category1WithoutPermissions = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'view_comment_vote' }
      ]
    });

    const category2WithSpacePermissions = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        { assignee: { group: 'space', id: space.id }, permissionLevel: 'view_comment' },
        { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'full_access' }
      ]
    });

    const category3WithRolePermissions = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'full_access' },
        { assignee: { group: 'role', id: secondProposalReviewerRole.id }, permissionLevel: 'view_comment_vote' }
      ]
    });

    const proposalInCategory1 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: space.createdBy,
      reviewers: [
        { group: 'role', id: proposalReviewerRole.id },
        // This permission should be ignored because it's not a role-reviewer
        { group: 'user', id: user.id }
      ]
    });

    const proposalInCategory2 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: space.createdBy,
      reviewers: [
        { group: 'role', id: proposalReviewerRole.id },
        { group: 'role', id: secondProposalReviewerRole.id }
      ]
    });

    const proposalInCategory3 = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: space.createdBy,
      reviewers: [{ group: 'role', id: secondProposalReviewerRole.id }]
    });
    const exportedPermissions = await exportSpacePermissions({ spaceId: space.id });

    expect(exportedPermissions.roles).toHaveLength(2);

    expect(exportedPermissions).toMatchObject<SpacePermissionsExport>({
      roles: [proposalReviewerRole, secondProposalReviewerRole],
      permissions: {
        spacePermissions: [],
        proposalCategoryPermissions: expect.arrayContaining<AssignedProposalCategoryPermission>([
          {
            assignee: { group: 'role', id: proposalReviewerRole.id },
            permissionLevel: 'full_access',
            id: expect.any(String),
            proposalCategoryId: category2WithSpacePermissions.id
          },
          {
            assignee: { group: 'role', id: proposalReviewerRole.id },
            permissionLevel: 'full_access',
            id: expect.any(String),
            proposalCategoryId: category3WithRolePermissions.id
          },
          {
            assignee: { group: 'role', id: secondProposalReviewerRole.id },
            permissionLevel: 'view_comment_vote',
            id: expect.any(String),
            proposalCategoryId: category3WithRolePermissions.id
          },
          {
            assignee: { group: 'space', id: space.id },
            permissionLevel: 'view_comment',
            id: expect.any(String),
            proposalCategoryId: category2WithSpacePermissions.id
          }
        ])
      }
    });
  });

  it('returns an object with empty arrays for a valid space ID without data', async () => {
    const { space: newSpace } = await testUtilsUser.generateUserAndSpace();

    const { permissions } = await exportSpacePermissions({ spaceId: newSpace.id });

    expect(permissions).toBeDefined();
    expect(permissions.proposalCategoryPermissions).toEqual([]);
    expect(permissions.spacePermissions).toEqual([]);
    // Assertions to verify that the arrays are empty
  });

  it.each([undefined, 'invalid-space-id'])(
    'throws InvalidInputError for invalid space IDs (testing with %s)',
    async (invalidSpaceId) => {
      await expect(exportSpacePermissions({ spaceId: invalidSpaceId as any })).rejects.toThrow(InvalidInputError);
    }
  );
});
