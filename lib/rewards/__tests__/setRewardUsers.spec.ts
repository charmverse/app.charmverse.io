import type { TargetPermissionGroup } from '@charmverse/core/dist/cjs/permissions';
import type { Space, Role, User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import { InvalidInputError } from 'lib/utilities/errors';
import { generateBounty } from 'testing/setupDatabase';

import { setRewardUsers } from '../setRewardUsers';

let user: User;
let space: Space;
let role1: Role;
let role2: Role;
let reward: any;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;

  reward = await generateBounty({
    createdBy: user.id,
    spaceId: generated.space.id
  });

  role1 = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: generated.space.id
  });

  role2 = await testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: generated.space.id
  });
});

describe('setRewardUsers', () => {
  it('should successfully set allowed submitter roles for a reward', async () => {
    const result = await setRewardUsers({
      rewardId: reward.id,
      users: {
        allowedSubmitterRoles: [role1.id, role2.id]
      }
    });

    expect(result.allowedSubmitterRoles).toEqual([role1.id, role2.id]);
  });

  it('should successfully set reviewers for a reward', async () => {
    const reviewerRole = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });
    const reviewers: TargetPermissionGroup<'user' | 'role'>[] = [
      { group: 'user', id: user.id },
      { group: 'role', id: reviewerRole.id }
    ];

    const result = await setRewardUsers({
      rewardId: reward.id,
      users: {
        reviewers
      }
    });

    expect(result.reviewers).toEqual(reviewers);
  });

  it('should successfully set both allowed submitter roles and reviewers for a reward', async () => {
    const reviewers: TargetPermissionGroup<'user'>[] = [{ group: 'user', id: user.id }];
    const result = await setRewardUsers({
      rewardId: reward.id,
      users: {
        allowedSubmitterRoles: [role1.id, role2.id],
        reviewers
      }
    });

    expect(result.allowedSubmitterRoles).toEqual([role1.id, role2.id]);
    expect(result.reviewers).toEqual(reviewers);
  });

  it('should throw InvalidInputError for non-UUID rewardId', async () => {
    await expect(setRewardUsers({ rewardId: 'invalid-id', users: {} })).rejects.toThrow(InvalidInputError);
  });

  it('should throw error when no users object provided', async () => {
    await expect(setRewardUsers({ rewardId: reward.id } as any)).rejects.toThrow(Error); // Modify this to a more specific error if needed.
  });

  it('should throw error for invalid role or user IDs for reviewers', async () => {
    await expect(
      setRewardUsers({
        rewardId: reward.id,
        users: {
          reviewers: [{ group: 'role', id: 'invalid-id' }]
        }
      })
    ).rejects.toThrow(Error); // Modify this to a more specific error if needed.
  });
});
