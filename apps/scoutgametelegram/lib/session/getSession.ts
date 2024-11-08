import type { SessionData } from '@connect-shared/lib/session/config';
import type { SessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getIronOptions } from './getIronOptions';

const baseUrl = 'https://403f-85-204-75-2.ngrok-free.app';

export async function getSession<T extends object = SessionData>(o?: SessionOptions) {
  const options = getIronOptions({ domain: new URL(baseUrl).hostname, secure: true });

  const session = await getIronSession<T>(cookies(), options);

  return session;
}
