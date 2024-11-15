import { getSession as getInitialSession } from '@packages/scoutgame/session/getSession';

export async function getSession() {
  return getInitialSession({ sameSite: 'none' });
}
