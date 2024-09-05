import { getIronOptions as getIronOptionsRoot } from '@root/lib/session/getIronOptions';

export type SessionData = {
  farcasterUser?: { fid: string; username?: string; hasJoinedWaitlist?: boolean };
};

export function getIronOptions() {
  const cookieName = process.env.AUTH_COOKIE || getIronOptionsRoot().cookieName;
  return { ...getIronOptionsRoot(), cookieName };
}
