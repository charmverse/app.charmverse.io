import type { Space } from '@charmverse/core/prisma';
import { getMaxRolesCount } from '@packages/lib/roles/getMaxRolesCount';

import { useCurrentSpace } from './useCurrentSpace';
import { useRoles } from './useRoles';

export function useRoleAccess({ space }: { space?: Space | null } = {}) {
  const { space: currentSpace } = useCurrentSpace();
  const { roles } = useRoles();
  const targetSpace = space || currentSpace;

  if (!targetSpace) {
    return {
      canCreateRole: false,
      hasReachedLimit: true,
      currentCount: 0,
      maxCount: 0
    };
  }

  const tier = targetSpace.subscriptionTier;
  const currentRoleCount = roles?.filter((role) => !role.archived).length || 0;

  // Get max roles based on tier
  const maxRoles = getMaxRolesCount(tier);

  const canCreateRole = tier !== 'free' && currentRoleCount < maxRoles;
  const hasReachedLimit = currentRoleCount >= maxRoles;

  return {
    canCreateRole,
    hasReachedLimit,
    currentCount: currentRoleCount,
    maxCount: maxRoles
  };
}
