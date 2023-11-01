import { InvalidInputError } from '@charmverse/core/errors';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { generateBounty } from 'testing/setupDatabase';

import type { ExportedPermissions, SpacePermissionsExport } from '../exportSpacePermissions';
import { exportSpacePermissions } from '../exportSpacePermissions';

describe('exportSpacePermissions', () => {
  it('return reward reviewer permissions for roles', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const rewardReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });
    const secondRewardReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    const firstReward = await generateBounty({
      createdBy: space.createdBy,
      spaceId: space.id,
      bountyPermissions: {
        reviewer: [{ group: 'role', id: rewardReviewerRole.id }]
      }
    });
    const secondReward = await generateBounty({
      createdBy: space.createdBy,
      spaceId: space.id,
      bountyPermissions: {
        reviewer: [
          { group: 'role', id: rewardReviewerRole.id },
          { group: 'role', id: secondRewardReviewerRole.id }
        ]
      }
    });

    const exportedPermissions = await exportSpacePermissions({ spaceId: space.id });

    expect(exportedPermissions.roles).toHaveLength(2);

    expect(exportedPermissions).toMatchObject<SpacePermissionsExport>({
      roles: [rewardReviewerRole, secondRewardReviewerRole],
      permissions: {
        roles: expect.arrayContaining<{ id: string; permissions: ExportedPermissions }>([
          {
            id: rewardReviewerRole.id,
            permissions: {
              proposalCategoryPermissions: [],
              proposalsWithReviewerPermission: [],
              rewardsWithReviewerPermission: [firstReward.id, secondReward.id]
            }
          },
          {
            id: secondRewardReviewerRole.id,
            permissions: {
              proposalCategoryPermissions: [],
              proposalsWithReviewerPermission: [],
              rewardsWithReviewerPermission: [secondReward.id]
            }
          }
        ]),
        space: {
          id: space.id,
          permissions: {
            proposalCategoryPermissions: [],
            proposalsWithReviewerPermission: [],
            rewardsWithReviewerPermission: []
          }
        }
      }
    });
  });

  it('return proposal reviewer and proposal category permissions', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposalReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });
    const secondProposalReviewerRole = await testUtilsMembers.generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    const category1WithoutPermissions = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
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
        roles: expect.arrayContaining<{ id: string; permissions: ExportedPermissions }>([
          {
            id: proposalReviewerRole.id,
            permissions: {
              proposalCategoryPermissions: [
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
                }
              ],
              proposalsWithReviewerPermission: [proposalInCategory1.id, proposalInCategory2.id],
              rewardsWithReviewerPermission: []
            }
          },
          {
            id: secondProposalReviewerRole.id,
            permissions: {
              proposalCategoryPermissions: [
                {
                  assignee: { group: 'role', id: secondProposalReviewerRole.id },
                  permissionLevel: 'view_comment_vote',
                  id: expect.any(String),
                  proposalCategoryId: category3WithRolePermissions.id
                }
              ],
              proposalsWithReviewerPermission: [proposalInCategory2.id, proposalInCategory3.id],
              rewardsWithReviewerPermission: []
            }
          }
        ]),
        space: {
          id: space.id,
          permissions: {
            proposalCategoryPermissions: [
              {
                assignee: { group: 'space', id: space.id },
                permissionLevel: 'view_comment',
                id: expect.any(String),
                proposalCategoryId: category2WithSpacePermissions.id
              }
            ],
            proposalsWithReviewerPermission: [],
            rewardsWithReviewerPermission: []
          }
        }
      }
    });
  });

  it('returns an object with empty arrays for a valid space ID without data', async () => {
    const { space: newSpace } = await testUtilsUser.generateUserAndSpace();

    const { permissions } = await exportSpacePermissions({ spaceId: newSpace.id });

    expect(permissions).toBeDefined();
    expect(permissions.roles).toEqual([]);
    expect(permissions.space.id).toBe(newSpace.id);
    // Assertions to verify that the arrays are empty
  });

  it.each([undefined, 'invalid-space-id'])(
    'throws InvalidInputError for invalid space IDs (testing with %s)',
    async (invalidSpaceId) => {
      await expect(exportSpacePermissions({ spaceId: invalidSpaceId as any })).rejects.toThrow(InvalidInputError);
    }
  );
});
