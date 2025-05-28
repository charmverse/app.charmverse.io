import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';
import { isTruthy } from '@packages/utils/types';
import { validate } from 'uuid';

import type { TokenGate } from './interfaces';
import { validateTokenGateWithMultipleWallets } from './validateTokenGate';

export type TokenGateEvaluationAttempt = {
  spaceIdOrDomain: string;
  userId: string;
};

export type TokenGateEvaluationResult = {
  canJoinSpace: boolean;
  eligibleGates: string[];
};

/**
 * @eligibleGates List of generated tokens we can verify when joining a space
 */
export async function evaluateTokenGateEligibility({
  spaceIdOrDomain,
  userId
}: TokenGateEvaluationAttempt): Promise<TokenGateEvaluationResult> {
  const tokenGates = await validateSpaceWithTokenGates(spaceIdOrDomain);
  const result = await evaluateTokenGate({ tokenGates, userId });

  return result;
}

export async function evaluateTokenGate({ tokenGates, userId }: { tokenGates: TokenGate[]; userId: string }) {
  const userWallets = await prisma.userWallet.findMany({
    where: {
      userId
    }
  });

  const tokenGateResults = await Promise.all(
    tokenGates.map(async (tokenGate) => validateTokenGateWithMultipleWallets(tokenGate, userWallets))
  );

  const successGates = tokenGateResults.filter(isTruthy);

  if (successGates.length === 0) {
    return {
      canJoinSpace: false,
      eligibleGates: []
    };
  }

  return {
    canJoinSpace: true,
    eligibleGates: successGates
  };
}

async function validateSpaceWithTokenGates(spaceIdOrDomain: string) {
  const validUuid = validate(spaceIdOrDomain);
  const where = validUuid ? { id: spaceIdOrDomain } : { domain: spaceIdOrDomain };

  const space = await prisma.space.findFirst({
    where,
    include: {
      tokenGates: {
        where: {
          archived: false
        }
      }
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with ${validUuid ? 'id' : 'domain'} ${spaceIdOrDomain} not found.`);
  }

  return space.tokenGates as any as TokenGate[];
}
