/* eslint-disable no-console */
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

import type { AnyIdLogin } from 'components/login/Login';
import { ExternalServiceError, SystemError } from 'lib/utilities/errors';

export async function loginWIthGoogle(): Promise<AnyIdLogin> {
  // Google client setup start
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

  try {
    const auth = getAuth({
      options: { appId: '834736816902' },
      name: 'Charmverse-dev',
      automaticDataCollectionEnabled: true
    });
    const result = await signInWithPopup(auth, provider);

    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential) {
      throw new ExternalServiceError(`Could not authenticate with Google`);
    }

    const token = credential.accessToken;
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
    throw error;
    // ...
  }
}
