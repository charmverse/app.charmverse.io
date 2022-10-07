import type { Role } from '@prisma/client';
import { LitNodeClient } from 'lit-js-sdk';
import { validate } from 'uuid';

import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { DataNotFoundError, MissingDataError } from 'lib/utilities/errors';

import type { TokenGateEvaluationAttempt, TokenGateEvaluationResult, TokenGateJwt } from './interfaces';

const litClient = new LitNodeClient({
  debug: false
} as any);

export async function evalueTokenGateEligibility ({ authSig, spaceIdOrDomain, userId }:TokenGateEvaluationAttempt):
 Promise<TokenGateEvaluationResult> {
  if (!litClient.ready) {
    await litClient.connect();
  }

  const validUuid = validate(spaceIdOrDomain);

  const space = await prisma.space.findFirst({
    where: {
      domain: validUuid ? undefined : spaceIdOrDomain,
      id: validUuid ? spaceIdOrDomain : undefined
    },
    include: {
      TokenGate: {
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

  if (space.TokenGate.length === 0) {
    throw new MissingDataError('There are no token gates available in this space.');
  }

  if (!litClient.ready) {
    throw new InvalidStateError('Lit client is not available');
  }

  const tokenGateResults: (TokenGateJwt | null)[] = await Promise.all(
    space.TokenGate.map(tokenGate => {
      return litClient.getSignedToken({
        authSig,
        // note that we used to store 'chain' but now it is an array
        // TODO: migrate old token gate conditions to all be an array?
        chain: (tokenGate.conditions as any).chains?.[0],
        resourceId: tokenGate.resourceId,
        ...tokenGate.conditions as any
      })
        .then((signedToken: string) => {
          return {
            signedToken,
            tokenGate
          };
        })
        .catch(() => {
          return null;
        });
    })
  );

  const successGates = tokenGateResults.filter(result => result !== null) as TokenGateJwt[];

  if (successGates.length === 0) {
    return {
      canJoinSpace: false,
      userId,
      space,
      gateTokens: [],
      walletAddress: authSig.address,
      roles: []
    };
  }

  const eligibleRoles = successGates.reduce((roleList, result) => {

    result.tokenGate.tokenGateToRoles.forEach(tokenGateRoleMapping => {
      if (roleList.every(role => role.id !== tokenGateRoleMapping.roleId)) {
        roleList.push(tokenGateRoleMapping.role);
      }
    });

    return roleList;

  }, [] as Role[]);

  return {
    canJoinSpace: true,
    userId,
    space,
    walletAddress: authSig.address,
    gateTokens: successGates,
    roles: eligibleRoles
  };

}
