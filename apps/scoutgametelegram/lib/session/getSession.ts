import type { SessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getIronOptions } from './getIronOptions';

export type SessionData = {
  anonymousUserId?: string;
  scoutId?: string;
};

const baseUrl = 'https://5afa-2a02-2f04-8212-300-693c-507e-16d1-6b98.ngrok-free.app';

export async function getSession<T extends object = SessionData>(o?: SessionOptions) {
  const options = getIronOptions({ domain: new URL(baseUrl).hostname, secure: true, sameSite: 'none' });

  const session = await getIronSession<T>(cookies(), options);

  return session;
}
