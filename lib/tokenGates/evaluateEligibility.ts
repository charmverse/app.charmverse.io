import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { validate } from 'uuid';

import type { AuthSig } from 'lib/blockchain/interfaces';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import { getHypersubDetails } from './hypersub/getHypersubDetails';
import type { TokenGate, TokenGateWithRoles } from './interfaces';
import { getLockDetails } from './unlock/getLockDetails';
import { validateTokenGateCondition } from './validateTokenGateCondition';

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
  // @TODO validate authSig
  const tokenGates = await validateSpaceWithTokenGates(spaceIdOrDomain);
  const result = await evaluateTokenGate({ authSig, tokenGates });

  return result;
}

export async function evaluateTokenGate({ authSig, tokenGates }: { authSig: AuthSig; tokenGates: TokenGate[] }) {
  const tokenGateResults = await Promise.all(
    tokenGates.map(async (tokenGate) => getValidTokenGateId(tokenGate, authSig.address))
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

export async function getValidTokenGateId(tokenGate: TokenGate, walletAddress: string) {
  const tokenGatesValid = await Promise.all(
    tokenGate.conditions.accessControlConditions.map(async (condition) =>
      validateTokenGateCondition(condition, walletAddress).catch((error) => {
        log.debug(`Error validating token gate condition: ${condition}`, error);
        return false;
      })
    )
  );

  const allConditionsAreValid = tokenGate.conditions.operator === 'AND' && tokenGatesValid.every((v) => v);

  const someConditionsAreValid = tokenGate.conditions.operator === 'OR' && tokenGatesValid.some((v) => v);

  if (someConditionsAreValid || allConditionsAreValid) {
    return tokenGate.id;
  } else {
    return null;
  }
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
