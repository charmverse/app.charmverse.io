import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { AuthSig } from '@lit-protocol/types';
import promiseRetry from 'promise-retry';
import { validate } from 'uuid';

import { InvalidStateError } from 'lib/middleware';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import { getHypersubDetails } from './hypersub/getHypersubDetails';
import type { TokenGate, TokenGateWithRoles } from './interfaces';
import { litNodeClient } from './litProtocol/litNodeClientNodeJs';
import { getLockDetails } from './unlock/getLockDetails';

type TokenGateJwt = {
  signedToken: string;
  tokenGateId: string;
};

export type TokenGateEvaluationAttempt = {
  authSig: AuthSig;
  spaceIdOrDomain: string;
};

export type TokenGateEvaluationResult = {
  walletAddress: string;
  canJoinSpace: boolean;
  eligibleGates: TokenGateJwt[];
};

/**
 * @eligibleGates List of Lit-generated tokens we can verify when joining a space
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
  if (!litNodeClient.ready) {
    await litNodeClient.connect().catch((error: Error) => {
      log.debug('Error connecting to lit node', { error });
    });
  }

  if (!litNodeClient.ready) {
    throw new InvalidStateError('Lit client is not available');
  }

  const tokenGateResults = await Promise.all(
    tokenGates.map(async (tokenGate) => {
      return getTokenGateResults(tokenGate as TokenGateWithRoles, authSig).catch((error) => {
        log.warn('Error verifying token gate', {
          error,
          tokenGateId: tokenGate.id,
          conditions: (tokenGate.conditions as any)?.unifiedAccessControlConditions?.[0]
        });
        return null;
      });
    })
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

async function getTokenGateResults(tokenGate: TokenGateWithRoles, authSig: AuthSig) {
  if (tokenGate.type === 'unlock') {
    return getUnlockProtocolValidTokenGate(tokenGate, authSig.address);
  } else if (tokenGate.type === 'hypersub') {
    return getHypersubValidTokenGate(tokenGate, authSig.address);
  } else if (tokenGate.type === 'lit') {
    return getLitValidTokenGate(tokenGate, authSig);
  } else {
    return null;
  }
}

export async function getUnlockProtocolValidTokenGate<T extends TokenGate<'unlock'>>(
  tokenGate: T,
  walletAddress: string
) {
  const result = await getLockDetails({
    walletAddress,
    contract: tokenGate.conditions.contract,
    chainId: tokenGate.conditions.chainId
  });

  if (result.validKey) {
    return {
      signedToken: '',
      tokenGateId: tokenGate.id
    };
  }

  return null;
}

async function getLitValidTokenGate(tokenGate: TokenGateWithRoles<'lit'>, authSig: AuthSig) {
  return promiseRetry<{ tokenGateId: string; signedToken: string } | null>(
    async (retry, retryCount): Promise<{ tokenGateId: string; signedToken: string } | null> => {
      return litNodeClient
        .getSignedToken({
          authSig,
          chain: tokenGate.conditions.chains?.[0], // Check if this is correct
          ...tokenGate.conditions
        })
        .then((signedToken: string) => {
          return {
            signedToken,
            tokenGateId: tokenGate.id
          };
        })
        .catch((error: any) => {
          if (error.errorCode === 'rpc_error') {
            log.warn('Network error when verifying token gate. Could be improper conditions configuration', {
              retryCount,
              tokenGateId: tokenGate.id,
              spaceId: tokenGate.spaceId
            });
            retry(error);
          }
          return null;
        });
    },
    {
      factor: 1.1, // default is 2, but we don't want to wait that long because we are expecting 400 errors sometimes from the Lit network unrelated to capacity
      maxTimeout: 5000,
      minTimeout: 100,
      retries: 5
    }
  );
}

export async function getHypersubValidTokenGate<T extends TokenGate<'hypersub'>>(tokenGate: T, walletAddress: string) {
  const result = await getHypersubDetails({
    walletAddress,
    contract: tokenGate.conditions.contract,
    chainId: tokenGate.conditions.chainId
  });

  if (result.validKey) {
    return {
      signedToken: '',
      tokenGateId: tokenGate.id
    };
  }

  return null;
}

async function validateSpaceWithTokenGates(spaceIdOrDomain: string) {
  const validUuid = validate(spaceIdOrDomain);

  const space = await prisma.space.findFirst({
    where: {
      domain: validUuid ? undefined : spaceIdOrDomain,
      id: validUuid ? spaceIdOrDomain : undefined
    },
    include: {
      tokenGates: {
        include: {
          tokenGateToRoles: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with ${validUuid ? 'id' : 'domain'} ${spaceIdOrDomain} not found.`);
  }

  return space.tokenGates as TokenGateWithRoles[];
}
