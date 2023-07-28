import { initializeApp } from 'firebase/app';
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';

import { googleWebClientConfig } from 'config/constants';

type MagicLinkDispatch = {
  email: string;
  redirectUrl?: string;
};

const firebaseClientApp = initializeApp(googleWebClientConfig);

export async function sendMagicLink({ email, redirectUrl }: MagicLinkDispatch): Promise<true> {
  const actionCodeSettings = {
    url: `${process.env.DOMAIN}/authenticate${redirectUrl ? `?redirectUrl=${encodeURIComponent(redirectUrl)}` : ''}`,
    handleCodeInApp: true
  };

  const auth = getAuth(firebaseClientApp);

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);

  return true;
}
