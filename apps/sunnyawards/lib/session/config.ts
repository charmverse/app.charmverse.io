import { getIronOptions as getIronOptionsRoot } from '@root/lib/session/getIronOptions';

export type SessionData = {
  user: { id: string };
};

export function getIronOptions() {
  return { ...getIronOptionsRoot(), cookieName: 'sunnyawards-session' };
}
