import { getIronOptions as getIronOptionsRoot } from '@packages/nextjs/session/getIronOptions';

export type SessionData = {
  user?: { id: string };
  anonymousUserId?: string;
};

export function getIronOptions() {
  const cookieName = process.env.AUTH_COOKIE || getIronOptionsRoot().cookieName;
  // "LAX" allows us to redirect users to the app from other websites/emails while they are logged in
  return { ...getIronOptionsRoot({ sameSite: 'lax' }), cookieName };
}
