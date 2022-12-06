import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import getLayout from 'components/common/BaseLayout/BaseLayout';
import { LoginPageContent } from 'components/login';
import Footer from 'components/login/Footer';
import { getKey } from 'hooks/useLocalStorage';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { AUTH_CODE_COOKIE } from 'lib/discord/constants';
import log from 'lib/log';
import { isSpaceDomain } from 'lib/spaces/utils';
import { deleteCookie, getCookie } from 'lib/utilities/browser';
import { lowerCaseEqual } from 'lib/utilities/strings';

export default function LoginPage() {
  const { account, walletAuthSignature, verifiableWalletDetected, getStoredSignature } = useWeb3AuthSig();
  const { triedEager } = useContext(Web3Connection);
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const { user, isLoaded, loginFromWeb3Account } = useUser();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();
  const discordCookie = getCookie(AUTH_CODE_COOKIE);

  const [loggingIn, setLoggingIn] = useState(false);

  const [showLogin, setShowLogin] = useState(false); // capture isLoaded state to prevent render on route change
  const isLogInWithDiscord = Boolean(discordCookie);
  const isDataLoaded = triedEager && isSpacesLoaded && isLoaded;
  const isLoggedIn = !!user;
  const returnUrl = router.query.returnUrl as string | undefined;

  function redirectToDefaultPage() {
    // Send the user in priority to the invites page if they logged in looking to join a space
    if (returnUrl?.match('join') || returnUrl?.match('invite')) {
      log.info('Redirect user to given url');
      router.push(returnUrl);
    } else if (spaces.length === 0 && !isSpaceDomain(returnUrl?.replaceAll('/', ''))) {
      // Note that a user logging in will be redirected to /signup, because the 'user' and 'spaces' are loaded async after the wallet address appears.
      log.info('Redirect user to signup');
      router.push('/signup');
      // send to signup for users without a workspace unless they are being redirected to an existing workspace
    } else if (returnUrl) {
      log.info('Redirect user to given url');
      router.push(returnUrl);
    } else {
      const defaultWorkspace = getDefaultWorkspaceUrl(spaces);
      log.info('Redirect user to default workspace');
      router.push(defaultWorkspace);
    }
  }

  useEffect(() => {
    setTitleState('Welcome');
    if (discordCookie) {
      deleteCookie(AUTH_CODE_COOKIE);
    }
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      // redirect once user is logged in unless we are verifying their wallet
      if (isLoggedIn) {
        redirectToDefaultPage();
      } else {
        setShowLogin(true);
      }
    }
  }, [isDataLoaded, isLoggedIn, user]);

  const signature = getStoredSignature();

  useEffect(() => {
    if (verifiableWalletDetected && signature && !user) {
      setLoggingIn(true);
      loginFromWeb3Account(signature).finally(() => setLoggingIn(false));
    }
  }, [verifiableWalletDetected]);

  if (!showLogin || loggingIn) {
    return null;
  }

  return isLogInWithDiscord
    ? null
    : getLayout(
        <>
          <LoginPageContent
            walletSigned={(authSig) => {
              // console.log('Received authSig', authSig);
              loginFromWeb3Account(authSig);
            }}
          />
          <Footer />
        </>
      );
}

export function getDefaultWorkspaceUrl(spaces: Space[]) {
  const defaultWorkspace = typeof window !== 'undefined' && localStorage.getItem(getKey('last-workspace'));
  if (defaultWorkspace === '/nexus') {
    return defaultWorkspace;
  }
  const isValidDefaultWorkspace =
    !!defaultWorkspace && spaces.some((space) => defaultWorkspace.startsWith(`/${space.domain}`));
  return isValidDefaultWorkspace ? defaultWorkspace : `/${spaces[0].domain}`;
}
