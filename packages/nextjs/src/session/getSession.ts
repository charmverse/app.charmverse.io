import type { SessionOptions, IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getIronOptions } from './getIronOptions';
import type { SessionData } from './interfaces';

export async function getSession<T extends object = SessionData>(cookieOptions?: SessionOptions['cookieOptions']) {
  const options = getIronOptions({ ...cookieOptions });

  const session = await getIronSession<T>(cookies(), options);

  // allow for a user override in development
  const userOverride = process.env.NODE_ENV === 'development' ? process.env.DEV_USER_ID : undefined;

  if (userOverride) {
    // eslint-disable-next-line no-console
    console.log('Overriding session with user override', { userOverride });
    return { scoutId: userOverride } as unknown as IronSession<T>;
  }

  return session;
}
