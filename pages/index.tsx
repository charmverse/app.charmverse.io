import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import getLayout from 'components/common/BaseLayout/BaseLayout';
import { LoginPageContent } from 'components/login';
import Footer from 'components/login/Footer';
import { getKey } from 'hooks/useLocalStorage';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { lowerCaseEqual } from 'lib/utilities/strings';

export default function LoginPage () {
  const { account, walletAuthSignature } = useWeb3AuthSig();
  const { triedEager } = useContext(Web3Connection);
  const { showMessage } = useSnackbar();
  const router = useRouter();
  const defaultWorkspace = typeof window !== 'undefined' && localStorage.getItem(getKey('last-workspace'));
  const [, setTitleState] = usePageTitle();
  const { user, isLoaded, loginFromWeb3Account } = useUser();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();

  const [showLogin, setShowLogin] = useState(false); // capture isLoaded state to prevent render on route change
  const isLogInWithDiscord = typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'login';

  const isDataLoaded = triedEager && isSpacesLoaded && isLoaded;
  const isLoggedIn = !!user;
  const walletIsVerified = !!account && !!walletAuthSignature && lowerCaseEqual(walletAuthSignature.address, account);
  const isVerificationStep = !!account && !walletIsVerified;

  function redirectToDefaultPage () {
    if (typeof router.query.returnUrl === 'string') {
      router.push(router.query.returnUrl);
    }
    else if (defaultWorkspace === '/nexus') {
      router.push('/nexus');
    }
    else if (spaces.length > 0) {
      router.push(getDefaultWorkspaceUrl(spaces));
    }
    else {
      // Note that a user logging in will be redirected to /signup, because the 'user' and 'spaces' are loaded async after the wallet address appears.
      // TODO: Find a way to connect the state between hooks (wallet address and loaded user)
      router.push('/signup');
    }
  }

  async function loginFromWeb3 () {
    await loginFromWeb3Account();
    redirectToDefaultPage();
  }

  useEffect(() => {
    setTitleState('Welcome');
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      // redirect once user is logged in unless we are verifying their wallet
      if (isLoggedIn && !isVerificationStep) {
        redirectToDefaultPage();
      }
      else if (!isLoggedIn && walletIsVerified) {
        loginFromWeb3();
      }
      else {
        setShowLogin(true);
      }
    }
  }, [isDataLoaded, isLoggedIn, isVerificationStep]);

  if (!showLogin) {
    return null;
  }

  return (
    isLogInWithDiscord ? null : getLayout(
      <>
        <LoginPageContent walletSigned={loginFromWeb3} />
        <Footer />
      </>
    )
  );
}

export function getDefaultWorkspaceUrl (spaces: Space[]) {
  const defaultWorkspace = typeof window !== 'undefined' && localStorage.getItem(getKey('last-workspace'));
  const isValidDefaultWorkspace = !!defaultWorkspace && spaces.some(space => defaultWorkspace.startsWith(`/${space.domain}`));
  return isValidDefaultWorkspace ? defaultWorkspace : `/${spaces[0].domain}`;
}
