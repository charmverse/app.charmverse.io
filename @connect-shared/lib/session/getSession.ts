import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import type { SessionData } from './config';
import { getIronOptions } from './config';

export async function getSession() {
  return getIronSession<SessionData>(cookies(), getIronOptions());
}
