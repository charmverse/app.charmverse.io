import { authSecret } from '@root/config/constants';
import { sealData } from 'iron-session';

import type { SessionData } from './config';

export async function embedFarcasterUser(data: SessionData): Promise<`farcaster_user=${string}`> {
  const sealedFarcasterUser = await sealData({ farcasterUser: data } as SessionData, {
    password: authSecret as string
  });

  return `farcaster_user=${sealedFarcasterUser}`;
}
