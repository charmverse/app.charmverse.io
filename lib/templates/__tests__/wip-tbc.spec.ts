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
      proposalCategoryPermissions: [{assignee: {group: 'role', id"}}]
    }
  });
});