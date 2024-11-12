import type { SessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getIronOptions } from './getIronOptions';
import type { SessionData } from './interfaces';

export async function getSession<T extends object = SessionData>(o?: SessionOptions) {
  const options = getIronOptions({ sameSite: 'none' });

  const session = await getIronSession<T>(cookies(), options);

  return session;
}
