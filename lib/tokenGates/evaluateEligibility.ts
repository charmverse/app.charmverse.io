import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { validate } from 'uuid';

import type { AuthSig } from 'lib/blockchain/interfaces';
import { DataNotFoundError } from 'lib/utils/errors';
import { isTruthy } from 'lib/utils/types';

import type { TokenGate } from './interfaces';
import { validateTokenGate } from './validateTokenGate';

export type TokenGateEvaluationAttempt = {
  authSig: AuthSig;
  spaceIdOrDomain: string;
};

export type TokenGateEvaluationResult = {
  walletAddress: string;
  canJoinSpace: boolean;
  eligibleGates: string[];
};

/**
 * @eligibleGates List of generated tokens we can verify when joining a space
 */
export async function evaluateTokenGateEligibility({
  authSig,
  spaceIdOrDomain
}: TokenGateEvaluationAttempt): Promise<TokenGateEvaluationResult> {
  const tokenGates = await validateSpaceWithTokenGates(spaceIdOrDomain);
  const result = await evaluateTokenGate({ authSig, tokenGates });

  return result;
}

export async function evaluateTokenGate({ authSig, tokenGates }: { authSig: AuthSig; tokenGates: TokenGate[] }) {
  const tokenGateResults = await Promise.all(
    tokenGates.map(async (tokenGate) =>
      validateTokenGate(tokenGate, authSig.address).catch((error) => {
        log.debug(`Error evaluating token gate`, { tokenGateId: tokenGate.id, error });
        return null;
      })
    )
  );

  const successGates = tokenGateResults.filter(isTruthy);

  if (successGates.length === 0) {
    return {
      canJoinSpace: false,
      eligibleGates: [],
      walletAddress: authSig.address
    };
  }

  return {
    canJoinSpace: true,
    walletAddress: authSig.address,
    eligibleGates: successGates
  };
}

async function validateSpaceWithTokenGates(spaceIdOrDomain: string) {
  const validUuid = validate(spaceIdOrDomain);
  const where = validUuid ? { id: spaceIdOrDomain } : { domain: spaceIdOrDomain };

  const space = await prisma.space.findFirst({
    where,
    include: {
      tokenGates: true
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with ${validUuid ? 'id' : 'domain'} ${spaceIdOrDomain} not found.`);
  }

  return space.tokenGates as any as TokenGate[];
}
