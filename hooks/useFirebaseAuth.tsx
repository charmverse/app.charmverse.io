import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { googleWebClientConfig } from 'config/constants';
import { useUser } from 'hooks/useUser';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { ExternalServiceError, InvalidInputError, SystemError } from 'lib/utilities/errors';

import type { AnyIdLogin } from '../components/login/Login';

export function useFirebaseAuth() {
  const [firebaseApp] = useState<FirebaseApp>(initializeApp(googleWebClientConfig));
  // Google client setup start
  const [provider] = useState(new GoogleAuthProvider());
  const { user, setUser } = useUser();

  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  useEffect(() => {
    provider.addScope('email');
    provider.addScope('openid');
    provider.addScope('profile');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
  }, []);

  async function getGoogleToken(): Promise<LoginWithGoogleRequest> {
    try {
      const auth = getAuth(firebaseApp);
      auth.languageCode = 'en';

      const result = await signInWithPopup(auth, provider);

      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new ExternalServiceError(`Could not authenticate with Google`);
      }

      const displayName = result.user.displayName ?? (result.user.email as string);

      return {
        accessToken: credential?.idToken as string,
        displayName,
        avatarUrl: result.user.photoURL as string
      };

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

      throw error;
      // ...
    }
  }

  async function loginWithGoogle(): Promise<AnyIdLogin> {
    setIsConnectingGoogle(true);
    try {
      const googleToken = await getGoogleToken();
      const loggedInUser = await charmClient.google.login(googleToken);
      return { user: loggedInUser, identityType: 'Google', displayName: googleToken.displayName };
    } finally {
      setIsConnectingGoogle(false);
    }
  }

  async function connectGoogleAccount(): Promise<void> {
    setIsConnectingGoogle(true);
    try {
      const googleToken = await getGoogleToken();
      const loggedInUser = await charmClient.google.connectAccount(googleToken);
      setUser(loggedInUser);
    } finally {
      setIsConnectingGoogle(false);
    }
  }

  async function disconnectGoogleAccount(): Promise<void> {
    if (!user?.googleAccounts.length) {
      throw new InvalidInputError('No Google account connected to user');
    }

    const loggedInUser = await charmClient.google.disconnectAccount({
      googleAccountEmail: user?.googleAccounts[0].email as string
    });
    setUser(loggedInUser);
  }

  return {
    loginWithGoogle,
    connectGoogleAccount,
    disconnectGoogleAccount,
    isConnectingGoogle
  };
}
