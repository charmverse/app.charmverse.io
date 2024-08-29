import { getIronOptions as getIronOptionsRoot } from '@root/lib/session/getIronOptions';

export type SessionData = {
  user?: { id: string };
  anonymousUserId?: string;
};

export function getIronOptions() {
  const cookieName = process.env.AUTH_COOKIE || getIronOptionsRoot().cookieName;
  return { ...getIronOptionsRoot(), cookieName };
}
