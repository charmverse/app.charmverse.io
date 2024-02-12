import { prisma } from '@charmverse/core/prisma-client';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import { getHypersubValidTokenGate, getUnlockProtocolValidTokenGate } from './evaluateEligibility';
import type { TokenGateWithRoles } from './interfaces';
import { litNodeClient } from './litProtocol/litNodeClientNodeJs';

type TokenGateJwtResult = { jwt?: string; id: string; verified: boolean; grantedRoles: string[] };

export type TokenGateResult = TokenGateWithRoles & TokenGateJwtResult;

type Props = {
  userId: string;
  spaceId: string;
  tokens: { signedToken: string; tokenGateId: string }[];
  walletAddress: string;
};

export async function verifyTokenGates({ spaceId, userId, tokens, walletAddress }: Props): Promise<TokenGateResult[]> {
  if (!spaceId || !userId) {
    throw new InvalidInputError(`Please provide a valid ${!spaceId ? 'space' : 'user'} id.`);
  }

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    include: {
      roles: true,
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

  const { tokenGates } = space;

  // We need to have at least one token gate that succeeded in order to proceed
  if (tokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new DataNotFoundError('No token gates were found for this space.');
  }

  const verifiedTokenGates: TokenGateResult[] = (
    await Promise.all(
      tokens.map(async (tk) => {
        const matchingTokenGate = tokenGates.find((g) => g.id === tk.tokenGateId) as TokenGateWithRoles | undefined;

        if (!matchingTokenGate) {
          return null;
        }

        if (matchingTokenGate.type === 'lit' && tk.signedToken) {
          if (!litNodeClient.ready) {
            await litNodeClient.connect();
          }
          const { verifyJwt } = await import('@lit-protocol/lit-node-client');
          const result = verifyJwt({ jwt: tk.signedToken, publicKey: litNodeClient.networkPubKey || '' });
          const payload = result?.payload;

          if (result?.verified) {
            return {
              ...matchingTokenGate,
              jwt: tk.signedToken,
              verified: true,
              grantedRoles: matchingTokenGate.tokenGateToRoles.map((tgr) => tgr.role.id)
            };
          }
        } else if (matchingTokenGate.type === 'unlock') {
          const valid = await getUnlockProtocolValidTokenGate(matchingTokenGate, walletAddress);

          if (valid) {
            return {
              ...matchingTokenGate,
              jwt: tk.signedToken,
              verified: true,
              grantedRoles: matchingTokenGate.tokenGateToRoles.map((tgr) => tgr.role.id)
            };
          }
        } else if (matchingTokenGate.type === 'hypersub') {
          const valid = await getHypersubValidTokenGate(matchingTokenGate, walletAddress);

          if (valid) {
            return {
              ...matchingTokenGate,
              jwt: tk.signedToken,
              verified: true,
              grantedRoles: matchingTokenGate.tokenGateToRoles.map((tgr) => tgr.role.id)
            };
          }
        }

        return null;
      })
    )
  ).filter(isTruthy);

  return verifiedTokenGates;
}
