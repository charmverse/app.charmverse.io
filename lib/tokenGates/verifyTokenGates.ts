import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { DataNotFoundError } from 'lib/utils/errors';
import { isTruthy } from 'lib/utils/types';

import type { TokenGateWithRoles } from './interfaces';
import { validateTokenGate } from './validateTokenGate';

export type TokenGateResult = TokenGateWithRoles & { grantedRoles: string[]; verified: boolean };

type Props = {
  userId: string;
  spaceId: string;
  tokenGateIds: string[];
  walletAddress: string;
};

export async function verifyTokenGates({
  spaceId,
  userId,
  tokenGateIds,
  walletAddress
}: Props): Promise<TokenGateResult[]> {
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
      tokenGateIds.map(async (tkId) => {
        const matchingTokenGate = tokenGates.find((g) => g.id === tkId) as TokenGateWithRoles | undefined;

        if (!matchingTokenGate) {
          return null;
        }

        const verified = await validateTokenGate(matchingTokenGate, walletAddress).catch((error) => {
          log.debug(`Error verifying token gate`, { tokenGateId: matchingTokenGate.id, error });
          return null;
        });

        if (!verified) {
          return null;
        }

        return {
          ...matchingTokenGate,
          verified: !!verified,
          grantedRoles: matchingTokenGate.tokenGateToRoles.map((tgr) => tgr.role.id)
        };
      })
    )
  ).filter(isTruthy);

  return verifiedTokenGates;
}
