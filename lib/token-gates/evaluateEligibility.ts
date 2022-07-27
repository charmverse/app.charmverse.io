import { validate } from 'uuid';
import { prisma } from 'db';
import { DataNotFoundError, MissingDataError } from 'lib/utilities/errors';
import LitJsSdk, { LitNodeClient } from 'lit-js-sdk';
import { InvalidStateError } from 'lib/middleware';
import { Role, TokenGate } from '@prisma/client';
import { TokenGateVerificationAttempt, TokenGateVerificationResult, TokenGateWithRoleData } from './interfaces';
import getLitChainFromChainId from './getLitChainFromChainId';

const litClient = new LitNodeClient();

litClient.connect();

export async function evalueTokenGateEligibility ({ authSig, chainId, spaceIdOrDomain, userId }:TokenGateVerificationAttempt):
 Promise<TokenGateVerificationResult> {

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

  const litChain = getLitChainFromChainId(chainId);

  const matchingTokenGates = space.TokenGate.filter(gate => {
    return (gate.conditions as any).chain === litChain;
  }) as TokenGateWithRoleData[];

  if (!matchingTokenGates) {
    throw new MissingDataError('No token gates are available on the selected chain');
  }

  const tokenGateResults: {verified: boolean, tokenGate: TokenGateWithRoleData}[] = await Promise.all(
    matchingTokenGates.map(tokenGate => {
      return litClient.getSignedToken({
        authSig,
        chain: litChain,
        resourceId: tokenGate.resourceId,
        ...tokenGate.conditions as any
      })
        .then(() => {
          return {
            verified: true,
            tokenGate
          };
        })
        .catch(() => {
          return {
            verified: true,
            tokenGate
          };
        });
    })
  );

  const success = tokenGateResults.some(r => r.verified === true);

  if (!success) {
    return {
      canJoinSpace: false,
      userId,
      spaceId: space.id,
      chainId,
      walletAddress: authSig.address,
      roles: []
    };
  }

  const eligibleRoles = tokenGateResults.filter(g => g.verified).reduce((roleList, result) => {

    result.tokenGate.tokenGateToRoles.forEach(tokenGateRoleMapping => {
      if (roleList.every(role => role.id !== tokenGateRoleMapping.roleId)) {
        roleList.push(tokenGateRoleMapping.role);
      }
    });

    return roleList;

  }, [] as Role[]);

  return {
    canJoinSpace: false,
    userId,
    spaceId: space.id,
    chainId,
    walletAddress: authSig.address,
    roles: eligibleRoles
  };

}
