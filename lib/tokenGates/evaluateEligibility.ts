import { log } from '@charmverse/core/log';
import type { Role, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import type { AuthSig } from '@lit-protocol/types';
import promiseRetry from 'promise-retry';
import { validate } from 'uuid';

import { InvalidStateError } from 'lib/middleware';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { TokenGateConditions, TokenGateWithRoles } from './interfaces';

type TokenGateJwt = {
  signedToken: string;
  tokenGate: TokenGateWithRoles;
};

const litClient = new LitNodeClient({
  debug: false
} as any);

export type TokenGateEvaluationAttempt = {
  authSig: AuthSig;
  spaceIdOrDomain: string;
};

/**
 * @gateTokens List of Lit-generated tokens we can verify when joining a space
 */
export type TokenGateEvaluationResult = {
  space: Space;
  walletAddress: string;
  canJoinSpace: boolean;
  gateTokens: TokenGateJwt[];
  roles: { id: string; name: string }[];
};

export async function evaluateTokenGateEligibility({
  authSig,
  spaceIdOrDomain
}: TokenGateEvaluationAttempt): Promise<TokenGateEvaluationResult> {
  if (!litClient.ready) {
    await litClient.connect().catch((err) => {
      log.debug('Error connecting to lit node', err);
    });
  }

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

  if (!litClient.ready) {
    throw new InvalidStateError('Lit client is not available');
  }

  const tokenGateResults: (TokenGateJwt | null)[] = await Promise.all(
    space.tokenGates.map(async (tokenGate) => {
      return promiseRetry<TokenGateJwt | null>(
        async (retry, retryCount): Promise<TokenGateJwt | null> => {
          return litClient
            .getSignedToken({
              authSig,
              // note that we used to store 'chain' but now it is an array
              // TODO: migrate old token gate conditions to all be an array?
              chain: (tokenGate.conditions as TokenGateConditions).chains?.[0],
              resourceId: tokenGate.resourceId as any,
              ...(tokenGate.conditions as TokenGateConditions)
            })
            .then((signedToken: string) => {
              return {
                signedToken,
                tokenGate: tokenGate as TokenGateWithRoles
              };
            })
            .catch((error) => {
              if (error.errorCode === 'rpc_error') {
                log.warn('Network error when verifying token gate. Could be improper conditions configuration', {
                  retryCount,
                  tokenGateId: tokenGate.id
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
      ).catch((error) => {
        log.warn('Error verifying token gate', {
          error,
          spaceId: space.id,
          tokenGateId: tokenGate.id,
          conditions: (tokenGate.conditions as any)?.unifiedAccessControlConditions?.[0]
        });
        return null;
      });
    })
  );

  const successGates = tokenGateResults.filter((result) => result !== null) as TokenGateJwt[];

  if (successGates.length === 0) {
    return {
      canJoinSpace: false,
      space,
      gateTokens: [],
      walletAddress: authSig.address,
      roles: []
    };
  }

  const eligibleRoles = successGates.reduce((roleList, result) => {
    result.tokenGate.tokenGateToRoles.forEach(({ role }) => {
      if (roleList.every((_role) => _role.id !== role.id)) {
        roleList.push(role);
      }
    });

    return roleList;
  }, [] as { id: string; name: string }[]);

  return {
    canJoinSpace: true,
    space,
    walletAddress: authSig.address,
    gateTokens: successGates,
    roles: eligibleRoles
  };
}
