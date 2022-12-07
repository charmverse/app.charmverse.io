/* eslint-disable import/order */
/* eslint-disable no-console */
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import { useEffect, useState } from 'react';

import { ExternalServiceError, SystemError } from 'lib/utilities/errors';

import type { AnyIdLogin } from '../LoginWithAnyId';

export function useGoogleAuth() {
  const [firebaseApp] = useState<FirebaseApp>(
    initializeApp({
      //      appId: '834736816902-el27p3t3og92l0g7gslchl5r0r5q0rea.apps.googleusercontent.com',
      // Unique project-level ID
      projectId: '834736816902',
      // Project-level webAPI key ID
      apiKey: 'AIzaSyBhfFP-ZSD06cUCAc8AMXrnpNYHtrjn2tU',
      authDomain: '21e4762df101.eu.ngrok.io',
      appId: '834736816902-el27p3t3og92l0g7gslchl5r0r5q0rea.apps.googleusercontent.com'
    })
  );
  // Google client setup start
  const [provider] = useState(new GoogleAuthProvider());

  useEffect(() => {
    provider.addScope('email');
    provider.addScope('openid');
    provider.addScope('profile');
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

      return { user: user as any, identityType: 'Google' };

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
