import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { googleOAuthWebClientConfig } from 'config/constants';
import { ExternalServiceError, SystemError } from 'lib/utilities/errors';

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

      const result = await signInWithPopup(auth, provider);

      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new ExternalServiceError(`Could not authenticate with Google`);
      }

      const loggedInUser = await charmClient.profile.loginWithGoogle({
        accessToken: credential?.idToken as string
      });

      return { user: loggedInUser, identityType: 'Google' };

      // ...
    } catch (error: any) {
      if (error instanceof SystemError) {
        throw error;
      }

      // Handle Errors here.
      const errorCode = error?.code;
      const errorMessage = error?.message;
      // The email of the user's account used.
      const email = error?.customData?.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      log.debug({ errorCode, errorMessage, email, receivedCreds: credential });
      // ...
    }

    return null as any;
  }

  return { loginWithGoogle };
}
