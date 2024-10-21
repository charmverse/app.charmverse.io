import { getIronOptions as getIronOptionsRoot } from '@root/lib/session/getIronOptions';

export type SessionData = {
  user?: { id: string };
  anonymousUserId?: string;
  scoutId?: string; // for ScoutGame, users in the scout database
};

export function getIronOptions() {
  const cookieName = process.env.AUTH_COOKIE || getIronOptionsRoot().cookieName;
  // "LAX" allows us to redirect users to the app from other websites/emails while they are logged in
  return { ...getIronOptionsRoot({ sameSite: 'lax' }), cookieName };
}
