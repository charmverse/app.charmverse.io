import { InvalidInputError } from '@charmverse/core/errors';
import type { Scout } from '@charmverse/core/prisma-client';

import { loginWithFarcaster } from 'lib/farcaster/loginWithFarcaster';

import type { LoginSchema } from './loginUserSchema';
import { loginWallet } from './loginWallet';

export async function loginUser(props: LoginSchema & { anonymousUserId?: string }): Promise<Scout> {
  const { type, anonymousUserId } = props;

  switch (type) {
    case 'warpcast': {
      if (!props.warpcast) {
        throw new InvalidInputError('Warpcast payload is required');
      }

      const loggedInUser = await loginWithFarcaster({
        ...props.warpcast,
        newUserId: anonymousUserId
      });

      return loggedInUser;
    }
    case 'wallet': {
      if (!props.wallet) {
        throw new InvalidInputError('Wallet payload is required');
      }

      const loggedInUser = await loginWallet({ wallet: props.wallet, newUserId: anonymousUserId });

      return loggedInUser;
    }
    default: {
      throw new InvalidInputError('Invalid or no login type');
    }
  }
}
