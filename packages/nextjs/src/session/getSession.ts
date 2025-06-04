import type { IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getIronOptions } from './getIronOptions';
import type { SessionData } from './interfaces';

export async function getSession(req: NextApiRequest, res: NextApiResponse): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(req, res, getIronOptions());

  // allow for a user override in development
  const userOverride = process.env.NODE_ENV === 'development' ? process.env.DEV_USER_ID : undefined;

  if (userOverride) {
    // eslint-disable-next-line no-console
    console.log('Overriding session with user override', { userOverride });
    session.user = { id: userOverride };
  }

  return session as unknown as IronSession<SessionData>;
}
