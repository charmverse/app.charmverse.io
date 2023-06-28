import { log } from '@charmverse/core/log';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import type { UserCredential } from 'firebase/auth';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { googleWebClientConfig } from 'config/constants';
import { usePopupLogin } from 'hooks/usePopupLogin';
import { useUser } from 'hooks/useUser';
import type { LoginWithGoogleRequest } from 'lib/google/loginWithGoogle';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import type { GooglePopupLoginState } from 'lib/oauth/interfaces';
import { getAppUrl } from 'lib/utilities/browser';
import { ExternalServiceError, InvalidInputError, SystemError } from 'lib/utilities/errors';

import type { AnyIdLogin } from '../components/login/LoginButton';

import { useLocalStorage } from './useLocalStorage';
import { useSnackbar } from './useSnackbar';

export function useFirebaseAuth() {
  const [firebaseApp] = useState<FirebaseApp>(initializeApp(googleWebClientConfig));
  // Google client setup start
  const [provider] = useState(new GoogleAuthProvider());
  const { user, setUser } = useUser();
  const [emailForSignIn, setEmailForSignIn] = useLocalStorage('emailForSignIn', '');
  const router = useRouter();
  const { openPopupLogin } = usePopupLogin<any>();

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

  async function getGoogleTokenWithRedirect(): Promise<void> {
    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    signInWithRedirect(auth, provider);
  }

  async function getGoogleRedirectResult(): Promise<LoginWithGoogleRequest> {
    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    const result = await getRedirectResult(auth);

    if (!result) {
      throw new ExternalServiceError(`Could not get credentials from Google`);
    }

    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential) {
      throw new ExternalServiceError(`Could not authenticate with Google`);
    }

    return getGoogleCredentials(result);
  }

  async function getGoogleToken(): Promise<LoginWithGoogleRequest> {
    try {
      const auth = getAuth(firebaseApp);
      auth.languageCode = 'en';

      const result = await signInWithPopup(auth, provider);

      return getGoogleCredentials(result);
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
    }
  }

  function getGoogleCredentials(googleResult: UserCredential): LoginWithGoogleRequest {
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(googleResult);

    if (!credential) {
      throw new ExternalServiceError(`Could not authenticate with Google`);
    }

    const displayName = googleResult.user.displayName ?? (googleResult.user.email as string);

    return {
      accessToken: credential?.idToken as string,
      displayName,
      avatarUrl: googleResult.user.photoURL as string
    };
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

  async function loginWithGooglePopup() {
    setIsConnectingGoogle(true);

    const loginCallback = async (state: GooglePopupLoginState) => {
      if ('googleToken' in state) {
        try {
          const loggedInUser = await charmClient.google.login(state.googleToken);
          setUser(loggedInUser);
        } finally {
          setIsConnectingGoogle(false);
        }
      }
    };

    let host = '';
    if (typeof window !== 'undefined') {
      host = window.location.host;
    }

    openPopupLogin(`${getCallbackDomain(host)}/authenticate/google?action=login`, loginCallback);
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

    const url = new URL(`${getAppUrl()}authenticate`);

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

    showMessage(`Magic link sent. Please check your inbox for ${email}`, 'success');
  }

  /**
   * Validate the data from a magic link, and login the user
   */
  async function validateMagicLink() {
    const email = emailForSignIn;

    if (!email) {
      throw new InvalidInputError(`Could not login`);
    }

    const auth = getAuth(firebaseApp);
    auth.languageCode = 'en';

    if (isSignInWithEmailLink(auth, window.location.href)) {
      try {
        const result = await signInWithEmailLink(auth, email, window.location.href);

        const token = await result.user.getIdToken();

        const loggedInUser = await (router.query.connectToExistingAccount === 'true'
          ? charmClient.google.connectEmailAccount({
              accessToken: token
            })
          : charmClient.google.authenticateMagicLink({
              accessToken: token
            }));

        setUser(loggedInUser);
        setEmailForSignIn('');
        // We want to bubble up the error, so we can show a relevant message, but always clear the email
      } catch (err) {
        setEmailForSignIn('');
        throw err;
      }
    } else {
      setEmailForSignIn('');
      throw new InvalidInputError(`Could not login`);
    }
  }

  function disconnectVerifiedEmailAccount(email: string) {
    charmClient.google.disconnectEmailAccount({ email }).then((loggedInUser) => {
      setUser(loggedInUser);
    });
  }

  return {
    loginWithGoogle,
    connectGoogleAccount,
    disconnectGoogleAccount,
    isConnectingGoogle,
    requestMagicLinkViaFirebase,
    validateMagicLink,
    disconnectVerifiedEmailAccount,
    emailForSignIn,
    setEmailForSignIn,
    getGoogleRedirectResult,
    getGoogleTokenWithRedirect,
    loginWithGooglePopup
  };
}
