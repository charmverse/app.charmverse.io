import { InvalidInputError } from '@charmverse/core/errors';
import type { User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { isAddress } from 'viem';

export function getUserWalletProfile({ wallet }: { wallet: string }): Promise<User> {
  if (!isAddress(wallet)) {
    throw new InvalidInputError(`Invalid wallet address: ${wallet}`);
  }

  return prisma.user.findFirstOrThrow({
    where: {
      wallets: {
        some: {
          address: wallet
        }
      }
    }
  });
}
