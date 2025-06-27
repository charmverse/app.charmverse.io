import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import type { AssignedPostCategoryPermission } from '@packages/core/permissions';
import { mapSpacePermissionToAssignee } from '@packages/lib/permissions/spaces/mapSpacePermissionToAssignee';

import type { SpacePermissionsExport } from '../exportSpacePermissions';
import { exportSpacePermissions } from '../exportSpacePermissions';

describe('exportSpacePermissions', () => {
  it('return roles, proposal category permissions, post category permissions and space permissions', async () => {
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
          operations: ['reviewProposals', 'deleteAnyProposal', 'createPage'],
          forSpace: { connect: { id: space.id } },
          role: { connect: { id: proposalReviewerRole.id } }
        }
      }),
      prisma.spacePermission.create({
        data: {
          operations: ['reviewProposals', 'deleteAnyProposal', 'createPage'],
          forSpace: { connect: { id: space.id } },
          role: { connect: { id: secondProposalReviewerRole.id } }
        }
      }),
      prisma.spacePermission.create({
        data: {
          operations: ['createPage'],
          forSpace: { connect: { id: space.id } },
          space: { connect: { id: space.id } }
        }
      })
    ]);

    const postCategory1 = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      name: 'First',
      permissions: [
        { assignee: { group: 'space', id: space.id }, permissionLevel: 'view' },
        { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'full_access' },
        { assignee: { group: 'role', id: secondProposalReviewerRole.id }, permissionLevel: 'moderator' }
      ]
    });

    const postCategory2 = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      name: 'Second',
      permissions: [
        { assignee: { group: 'role', id: proposalReviewerRole.id }, permissionLevel: 'comment_vote' },
        { assignee: { group: 'role', id: secondProposalReviewerRole.id }, permissionLevel: 'view' }
      ]
    });

    const exportedPermissions = await exportSpacePermissions({ spaceIdOrDomain: space.id });

    expect(exportedPermissions.roles).toHaveLength(2);

    expect(exportedPermissions).toMatchObject<SpacePermissionsExport>({
      roles: [proposalReviewerRole, secondProposalReviewerRole],
      permissions: {
        postCategoryPermissions: expect.arrayContaining<AssignedPostCategoryPermission>([
          {
            assignee: { group: 'space', id: space.id },
            permissionLevel: 'view',
            id: expect.any(String),
            postCategoryId: postCategory1.id
          },
          {
            assignee: { group: 'role', id: proposalReviewerRole.id },
            permissionLevel: 'full_access',
            id: expect.any(String),
            postCategoryId: postCategory1.id
          },
          {
            assignee: { group: 'role', id: secondProposalReviewerRole.id },
            permissionLevel: 'moderator',
            id: expect.any(String),
            postCategoryId: postCategory1.id
          },
          {
            assignee: { group: 'role', id: proposalReviewerRole.id },
            permissionLevel: 'comment_vote',
            id: expect.any(String),
            postCategoryId: postCategory2.id
          },
          {
            assignee: { group: 'role', id: secondProposalReviewerRole.id },
            permissionLevel: 'view',
            id: expect.any(String),
            postCategoryId: postCategory2.id
          }
        ]),
        spacePermissions: expect.arrayContaining(spacePermissions.map(mapSpacePermissionToAssignee))
      }
    });
  });

  it('returns an object with empty arrays for a valid space ID without data', async () => {
    const { space: newSpace } = await testUtilsUser.generateUserAndSpace();

    const { permissions } = await exportSpacePermissions({ spaceIdOrDomain: newSpace.id });

    expect(permissions).toBeDefined();
    expect(permissions.spacePermissions).toEqual([]);
    // Assertions to verify that the arrays are empty
  });

  it.each([undefined, 'invalid-space-id'])(
    'throws InvalidInputError for invalid space IDs (testing with %s)',
    async (invalidSpaceId) => {
      await expect(exportSpacePermissions({ spaceIdOrDomain: invalidSpaceId as any })).rejects.toThrowError();
    }
  );
});
