import type { Space } from '@charmverse/core/prisma-client';
import type { IChainDetails } from '@packages/blockchain/connectors/chains';
import { getChainList } from '@packages/blockchain/connectors/chains';
import { getTokenGateLimits, RESTRICTED_TOKEN_GATE_CHAINS } from '@packages/subscriptions/featureRestrictions';

import { useGetTokenGates } from 'charmClient/hooks/tokenGates';

export function useTokenGateAccess({ space, chains }: { space: Space; chains?: IChainDetails[] }) {
  const { data: tokenGates = [] } = useGetTokenGates(space.id);

  const filteredTokenGates = tokenGates.filter(
    (tokenGate) => !tokenGate.archived && tokenGate.tokenGateToRoles.every((role) => !role.role.archived)
  );

  const tier = space?.subscriptionTier || 'readonly';
  const limits = getTokenGateLimits(tier);

  const hasReachedLimit = filteredTokenGates.length >= limits.count;
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
    currentCount: filteredTokenGates.length,
    maxCount: limits.count
  };
}
