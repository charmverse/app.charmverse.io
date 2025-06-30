import { googleWebClientConfig, magicLinkEmailCookie } from '@packages/config/constants';
import { log } from '@packages/core/log';
import { getCookie, getAppUrl } from '@packages/lib/utils/browser';
import { InvalidInputError } from '@packages/utils/errors';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

import { useLocalStorage } from './useLocalStorage';

export function useFirebaseAuth({ authenticatePath = 'authenticate' } = {}) {
  const router = useRouter();
  // this cookie is set by the server when signing in thru onboarding
  const magicLinkEmailFromServer = getCookie(magicLinkEmailCookie);

  const [firebaseApp] = useState<FirebaseApp>(initializeApp(googleWebClientConfig));
  // Google client setup start
  const [provider] = useState(new GoogleAuthProvider());
  const { setUser } = useUser();
  const [emailForSignInFromClient, setEmailForSignIn] = useLocalStorage(
    'emailForSignIn',
    magicLinkEmailFromServer || ''
  );
  const emailForSignIn = emailForSignInFromClient || magicLinkEmailFromServer;
  useEffect(() => {
    provider.addScope('email');
    provider.addScope('openid');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
  }, []);

  async function requestMagicLinkViaFirebase({
    email,
    connectToExistingAccount,
    redirectUrl
  }: {
    redirectUrl?: string;
    email: string;
    connectToExistingAccount?: boolean;
  }) {
    // console.log('IN', { email });
    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    authenticatePath = authenticatePath.replace(/\/$/, ''); // remove beginning slash
    const url = new URL(`${getAppUrl()}${authenticatePath}`);
    if (connectToExistingAccount) {
      url.searchParams.set('connectToExistingAccount', 'true');
    }

    if (redirectUrl) {
      url.searchParams.set('redirectUrl', redirectUrl);
    }

    const actionCodeSettings = {
      url: url.toString(),
      handleCodeInApp: true
    };

    // Always set this, so a previous email is overwritten
    setEmailForSignIn(email);

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  }

  /**
   * Validate the data from a magic link, and login the user
   */
  async function validateMagicLink(email: string) {
    if (!email) {
      throw new InvalidInputError(`Email not provided`);
    }

    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';
    if (isSignInWithEmailLink(auth, window.location.href)) {
      try {
        const result = await signInWithEmailLink(auth, email, window.location.href);
        const token = await result.user.getIdToken();
        const resp = await (router.query.connectToExistingAccount === 'true'
          ? charmClient.google.connectEmailAccount({
              accessToken: token
            })
          : charmClient.google.authenticateMagicLink({
              accessToken: token
            }));

        if ('id' in resp) {
          setUser(resp);
        }

        setEmailForSignIn('');

        return resp;
        // We want to bubble up the error, so we can show a relevant message, but always clear the email
      } catch (err) {
        setEmailForSignIn('');
        throw err;
      }
    } else {
      setEmailForSignIn('');
      log.warn('Sign-in link is invalid', { href: window.location.href });
    }
  }

  function disconnectVerifiedEmailAccount(email: string) {
    charmClient.google.disconnectEmailAccount({ email }).then((loggedInUser) => {
      setUser(loggedInUser);
    });
  }

  return {
    requestMagicLinkViaFirebase,
    validateMagicLink,
    disconnectVerifiedEmailAccount,
    emailForSignIn,
    setEmailForSignIn
  };
}
