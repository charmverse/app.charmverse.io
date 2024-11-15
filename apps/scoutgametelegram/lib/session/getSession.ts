import { getSession as getInitialSession } from '@packages/scoutgame/session/getSession';

const baseUrl = 'https://5afa-2a02-2f04-8212-300-693c-507e-16d1-6b98.ngrok-free.app';

export async function getSession() {
  return getInitialSession({ domain: new URL(baseUrl).hostname, secure: true, sameSite: 'none' });
}
