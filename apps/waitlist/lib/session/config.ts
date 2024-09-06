import { getIronOptions as getIronOptionsRoot } from '@root/lib/session/getIronOptions';

export type SessionData = {
  farcasterUser?: { fid: string; username?: string };
};

// Exported as a function so it does not throw at compile time
export function getCookieName() {
  return process.env.AUTH_COOKIE || getIronOptionsRoot().cookieName;
}

export function getIronOptions() {
  return { ...getIronOptionsRoot(), cookieName: getCookieName() };
}
