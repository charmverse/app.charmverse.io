import { getSession as getSessionBase } from '@packages/scoutgame/session/getSession';

export const getSession = () => {
  return getSessionBase({ sameSite: 'none', secure: true, domain: 'ngrok.app' });
};
