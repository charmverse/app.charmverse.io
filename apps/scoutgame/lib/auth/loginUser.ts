import { InvalidInputError } from '@charmverse/core/errors';

import { findOrCreateWalletUser } from 'lib/blockchain/findOrCreateWalletUser';
import { verifyWalletSignature } from 'lib/blockchain/verifyWallet';
import { findOrCreateFarcasterUser } from 'lib/farcaster/findOrCreateFarcasterUser';
import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';

import type { LoginSchema } from './loginSchema';

export async function loginUser(props: LoginSchema & { newUserId?: string }): Promise<{ id: string }> {
  const { type, newUserId } = props;

  switch (type) {
    case 'farcaster': {
      if (!props.farcaster) {
        throw new InvalidInputError('Warpcast payload is required');
      }

      const { fid } = await verifyFarcasterUser({ ...props.farcaster });
      const loggedInUser = await findOrCreateFarcasterUser({ fid, newUserId });

      return loggedInUser;
    }
    case 'wallet': {
      if (!props.wallet) {
        throw new InvalidInputError('Wallet payload is required');
      }

      const { walletAddress } = await verifyWalletSignature({ ...props.wallet });
      const loggedInUser = await findOrCreateWalletUser({ wallet: walletAddress, newUserId });

      return loggedInUser;
    }
    default: {
      throw new InvalidInputError('Invalid or no login type');
    }
  }
}
