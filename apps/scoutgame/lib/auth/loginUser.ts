import { InvalidInputError } from '@charmverse/core/errors';
import { loginWithFarcaster } from '@root/lib/farcaster/loginWithFarcaster';

import type { LoggedInUser } from './interfaces';
import type { LoginSchema } from './loginUserSchema';
import { loginWallet } from './loginWallet';

export async function loginUser(props: LoginSchema & { anonymusUserId?: string }): Promise<LoggedInUser> {
  const { type, anonymusUserId } = props;

  switch (type) {
    case 'warpcast': {
      if (!props.warpcast) {
        throw new InvalidInputError('Warpcast payload is required');
      }

      const loggedInUser = await loginWithFarcaster({
        ...props.warpcast,
        newUserId: anonymusUserId
      });

      return loggedInUser;
    }
    case 'wallet': {
      if (!props.wallet) {
        throw new InvalidInputError('Wallet payload is required');
      }

      const loggedInUser = await loginWallet({ wallet: props.wallet, newUserId: anonymusUserId });

      return loggedInUser;
    }
    default: {
      throw new InvalidInputError('Invalid or no login type');
    }
  }
}
