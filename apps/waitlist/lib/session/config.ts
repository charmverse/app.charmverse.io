import { getIronOptions as getIronOptionsRoot } from '@root/lib/session/getIronOptions';

export type SessionData = {
  farcasterUser?: { fid: string; username?: string };
};

export const cookieName = process.env.AUTH_COOKIE || getIronOptionsRoot().cookieName;

export function getIronOptions() {
  return { ...getIronOptionsRoot(), cookieName };
}
