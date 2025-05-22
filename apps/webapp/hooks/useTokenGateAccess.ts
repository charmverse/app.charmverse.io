import type { Space } from '@charmverse/core/prisma-client';
import { RESTRICTED_TOKEN_GATE_CHAINS, TOKEN_GATE_LIMITS } from '@packages/lib/tokenGates/constants';

import { useGetTokenGates } from 'charmClient/hooks/tokenGates';

export function useTokenGateAccess({ space }: { space: Space }) {
  const { data: tokenGates = [] } = useGetTokenGates(space.id);

  const tier = space?.subscriptionTier || 'public';
  const limits = TOKEN_GATE_LIMITS[tier as keyof typeof TOKEN_GATE_LIMITS];

  const hasReachedLimit = tokenGates.length >= limits.count;
  const hasRestrictedChains = limits.restrictedChains;

  const canCreateTokenGate = !hasReachedLimit;
  const allowedChains = hasRestrictedChains ? RESTRICTED_TOKEN_GATE_CHAINS : undefined;

  return {
    canCreateTokenGate,
    allowedChains,
    hasReachedLimit,
    currentCount: tokenGates.length,
    maxCount: limits.count
  };
}
