import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import type { SessionData } from './config';
import { getIronOptions } from './config';

export async function getSession<T extends object = SessionData>() {
  return getIronSession<T>(await cookies(), getIronOptions());
}
