import type { BountyPermission } from '@charmverse/core/prisma-client';

import type { ApplicationMeta, Reward, RewardReviewer, RewardWithUsers } from './interfaces';

export function mapDbRewardToReward(
  reward: Reward & {
    applications: ApplicationMeta[];
    permissions: Pick<BountyPermission, 'roleId' | 'userId' | 'permissionLevel'>[];
  }
): RewardWithUsers {
  const reviewers = reward.permissions
    .filter((p) => (p.roleId || p.userId) && p.permissionLevel === 'reviewer')
    .map((p) => {
      const group = p.roleId ? 'role' : 'user';
      return {
        group,
        id: (group === 'role' ? p.roleId : p.userId) as string
      } as RewardReviewer;
    });

  const allowedSubmitterRoles = reward.permissions.filter((p) => p.permissionLevel === 'submitter' && p.roleId);
  const assignedSubmitters = reward.permissions.filter((p) => p.permissionLevel === 'submitter' && p.userId);

  const rewardWithUsers: RewardWithUsers = {
    ...reward,
    applications: reward.applications,
    reviewers,
    allowedSubmitterRoles:
      allowedSubmitterRoles.length > 0 ? allowedSubmitterRoles.map((r) => r.roleId as string) : null,
    assignedSubmitters: assignedSubmitters.length > 0 ? assignedSubmitters.map((r) => r.userId as string) : null
  };
  return rewardWithUsers;
}
