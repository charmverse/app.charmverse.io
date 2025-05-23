import type { Space } from '@charmverse/core/prisma-client';
import type { IChainDetails } from '@packages/blockchain/connectors/chains';
import { getChainList } from '@packages/blockchain/connectors/chains';
import { RESTRICTED_TOKEN_GATE_CHAINS, TOKEN_GATE_LIMITS } from '@packages/subscriptions/featureRestrictions';

import { useGetTokenGates } from 'charmClient/hooks/tokenGates';

export function useTokenGateAccess({ space, chains }: { space: Space; chains?: IChainDetails[] }) {
  const { data: tokenGates = [] } = useGetTokenGates(space.id);

  const tier = space?.subscriptionTier || 'public';
  const limits = TOKEN_GATE_LIMITS[tier as keyof typeof TOKEN_GATE_LIMITS];

  const hasReachedLimit = tokenGates.length >= limits.count;
  const hasRestrictedChains = limits.restrictedChains;

  const canCreateTokenGate = !hasReachedLimit;
  const allowedChains = hasRestrictedChains ? RESTRICTED_TOKEN_GATE_CHAINS : undefined;

  const chainList = chains || getChainList({ enableTestnets: !!space?.enableTestnets });
  const filteredChainList = allowedChains
    ? chainList.filter((chain) =>
        allowedChains.includes(chain.shortName.toLowerCase() as (typeof allowedChains)[number])
      )
    : chainList;

  return {
    canCreateTokenGate,
    allowedChains: filteredChainList,
    hasReachedLimit,
    currentCount: tokenGates.length,
    maxCount: limits.count
  };
}
