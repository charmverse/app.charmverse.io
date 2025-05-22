import { SystemError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import { RESTRICTED_TOKEN_GATE_CHAINS, TOKEN_GATE_LIMITS } from './constants';

type TokenGatePayload = {
  spaceId: string;
  conditions?: { chain: string }[];
};

export async function validateTokenGateRestrictions(payload: TokenGatePayload) {
  const { spaceId, conditions = [] } = payload;

  if (!spaceId) {
    throw new SystemError({
      message: 'Space ID is required',
      errorType: 'Invalid input',
      severity: 'warning'
    });
  }

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { subscriptionTier: true }
  });

  if (!space) {
    throw new SystemError({
      message: 'Space not found',
      errorType: 'Invalid input',
      severity: 'warning'
    });
  }

  const tier = space.subscriptionTier || 'public';
  const limits = TOKEN_GATE_LIMITS[tier as keyof typeof TOKEN_GATE_LIMITS];

  // Check the number of existing token gates
  const existingTokenGates = await prisma.tokenGate.count({
    where: { spaceId }
  });

  if (existingTokenGates >= limits.count) {
    throw new SystemError({
      message: `You have reached the maximum number of token gates (${limits.count}) for your subscription tier`,
      errorType: 'Subscription required',
      severity: 'warning'
    });
  }

  // Check chain restrictions only for public and bronze tiers
  if (limits.restrictedChains) {
    const unsupportedChains = conditions
      .map((condition) => condition.chain)
      .filter(
        (chain) => !RESTRICTED_TOKEN_GATE_CHAINS.includes(chain as (typeof RESTRICTED_TOKEN_GATE_CHAINS)[number])
      );

    if (unsupportedChains.length > 0) {
      throw new SystemError({
        message: `Your subscription tier only supports the following chains: ${RESTRICTED_TOKEN_GATE_CHAINS.join(', ')}`,
        errorType: 'Subscription required',
        severity: 'warning'
      });
    }
  }

  return true;
}
