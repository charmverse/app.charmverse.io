import { getSession as rootGetSession } from '@connect-shared/lib/session/getSession';

import type { SessionData } from './interfaces';

export function getSession() {
  return rootGetSession<SessionData>();
}
