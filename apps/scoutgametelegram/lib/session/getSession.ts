import type { SessionData } from '@connect-shared/lib/session/config';
import type { SessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getIronOptions } from './getIronOptions';

export async function getSession<T extends object = SessionData>(o?: SessionOptions) {
  const options = getIronOptions();

  const session = await getIronSession<T>(cookies(), options);

  return session;
}
