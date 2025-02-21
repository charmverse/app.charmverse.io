import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/lib/utils/types';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { DataNotFoundError } from '@packages/utils/errors';

import type { TokenGateWithRoles } from './interfaces';
import { validateTokenGateWithMultipleWallets } from './validateTokenGate';

export type TokenGateResult = TokenGateWithRoles & { grantedRoles: string[]; verified: boolean };

export type Props = {
  userId: string;
  spaceId: string;
  tokenGateIds: string[];
};

export async function verifyTokenGates({ spaceId, userId, tokenGateIds }: Props): Promise<TokenGateResult[]> {
  const tokenGates = await prisma.tokenGate.findMany({
    where: {
      spaceId
    },
    include: {
      tokenGateToRoles: {
        include: {
          role: true
        }
      }
    }
  });

  // We need to have at least one token gate that succeeded in order to proceed
  if (tokenGates.length === 0) {
    trackUserAction('token_gate_verification', { result: 'fail', spaceId, userId });
    throw new DataNotFoundError('No token gates were found for this space.');
  }

  const wallets = await prisma.userWallet.findMany({ where: { userId } });

  if (wallets.length === 0) {
    return [];
  }

  const verifiedTokenGates: TokenGateResult[] = (
    await Promise.all(
      tokenGateIds.map(async (tkId) => {
        const matchingTokenGate = tokenGates.find((g) => g.id === tkId) as TokenGateWithRoles | undefined;

        if (!matchingTokenGate) {
          return null;
        }

        const verified = await validateTokenGateWithMultipleWallets(matchingTokenGate, wallets);

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
