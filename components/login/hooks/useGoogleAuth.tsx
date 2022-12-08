/* eslint-disable import/order */
/* eslint-disable no-console */
import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { useEffect, useState } from 'react';

import { googleOAuthWebClientConfig } from 'config/constants';
import { ExternalServiceError, SystemError } from 'lib/utilities/errors';

import charmClient from 'charmClient';
import type { AnyIdLogin } from '../Login';

export function useGoogleAuth() {
  const [firebaseApp] = useState<FirebaseApp>(initializeApp(googleOAuthWebClientConfig));
  // Google client setup start
  const [provider] = useState(new GoogleAuthProvider());

  useEffect(() => {
    provider.addScope('email');
    provider.addScope('openid');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
  }, []);

  async function loginWithGoogle(): Promise<AnyIdLogin> {
    try {
      const auth = getAuth(firebaseApp);
      auth.languageCode = 'en';

      console.log('Authed, getting creds', auth);
      const result = await signInWithPopup(auth, provider);

      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        console.log(new ExternalServiceError(`Could not authenticate with Google`));
      }

      const token = credential?.accessToken;
      // The signed-in user info.
      const user = result.user;

      console.log({ 'Printed token': token, user });

      const loggedInUser = await charmClient.profile.loginWithGoogle({
        ...credential,
        email: user.email,
        refresh_token: user.refreshToken
      });

      return { user: loggedInUser, identityType: 'Google' };

      // ...
    } catch (error: any) {
      if (error instanceof SystemError) {
        console.log('SYSTEM Error', error);
        throw error;
      }

      // Handle Errors here.
      const errorCode = error?.code;
      const errorMessage = error?.message;
      // The email of the user's account used.
      const email = error?.customData?.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.warn({ errorCode, errorMessage, email, receivedCreds: credential });
      // ...
    }

    return null as any;
  }

  return { loginWithGoogle };
}
