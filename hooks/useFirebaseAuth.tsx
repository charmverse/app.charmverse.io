import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { googleWebClientConfig } from 'config/constants';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import log from 'lib/log';
import { ExternalServiceError, InvalidInputError, SystemError } from 'lib/utilities/errors';

import type { AnyIdLogin } from '../components/login/Login';

import { useLocalStorage } from './useLocalStorage';

export function useFirebaseAuth() {
  const [firebaseApp] = useState<FirebaseApp>(initializeApp(googleWebClientConfig));
  // Google client setup start
  const [provider] = useState(new GoogleAuthProvider());
  const { user, setUser } = useUser();
  const [emailForSignIn, setEmailForSignIn] = useLocalStorage('emailForSignIn', '');

  const { showMessage } = useSnackbar();

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

  async function requestMagicLinkViaFirebase({ email }: { email: string }) {
    // console.log('IN', { email });
    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    const actionCodeSettings = {
      url: `${window.location.origin}/authenticate?strategy=email`,
      handleCodeInApp: true
    };

    // Always set this, so a prevuous email is overwritten
    setEmailForSignIn(email);

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      // .then((success) => {
      //   // The link was successfully sent. Inform the user.
      //   // Save the email locally so you don't need to ask the user for it again
      //   // if they open the link on the same device.
      //   // ...
      // })
      .catch((error) => {
        const errorMessage = error.message;
        showMessage(errorMessage, 'error');
        // ...
      });
  }

  async function validateMagicLink() {
    const email = emailForSignIn;

    // console.log('Signing in with email', email);

    if (!email) {
      throw new InvalidInputError(`No email found in local storage`);
    }

    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    if (isSignInWithEmailLink(auth, window.location.href)) {
      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          // This is where we should make a call to API to login the profile
          // console.log('Login result', result);
        })
        .catch((error) => {
          // console.log('Login error', error);
        });

      // The client SDK will parse the code from the link for you.
    }
    // The client SDK will parse the code from the link for you.
  }

  return {
    loginWithGoogle,
    connectGoogleAccount,
    disconnectGoogleAccount,
    isConnectingGoogle,
    requestMagicLinkViaFirebase,
    validateMagicLink
  };
}
