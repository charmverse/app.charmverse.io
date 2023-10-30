import { prisma } from '@charmverse/core/prisma-client';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import type { TokenGateWithRoles } from './interfaces';

export type TokenGateJwtResult = { jwt?: string; id: string; verified: boolean; grantedRoles: string[] };

type TokenGateResult = TokenGateWithRoles & TokenGateJwtResult;

type Props = {
  userId: string;
  spaceId: string;
  tokens: { signedToken: string; tokenGateId: string }[];
};
export async function verifyTokenGates({ spaceId, userId, tokens }: Props): Promise<TokenGateResult[]> {
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
        const { verifyJwt } = await import('@lit-protocol/lit-node-client');
        const result = verifyJwt({ jwt: tk.signedToken });
        const matchingTokenGate = tokenGates.find((g) => g.id === tk.tokenGateId);
        const payload = result?.payload as any;
        // Only check against existing token gates for this space
        if (
          matchingTokenGate &&
          // Perform additional checks here as per https://github.com/LIT-Protocol/lit-minimal-jwt-example/blob/main/server.js
          result?.verified &&
          payload?.orgId === space.id
        ) {
          const embeddedTokenGateId = JSON.parse(payload.extraData).tokenGateId;

          if (embeddedTokenGateId === tk.tokenGateId) {
            return {
              ...matchingTokenGate,
              jwt: tk.signedToken,
              verified: true,
              grantedRoles: matchingTokenGate.tokenGateToRoles.map((tgr) => tgr.roleId)
            };
          }
        }

        return null;
      })
    )
  ).filter(isTruthy);

  return verifiedTokenGates;
}
