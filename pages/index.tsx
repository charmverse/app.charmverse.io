import { useWeb3React } from '@web3-react/core';
import type { Space } from '@prisma/client';
import getLayout from 'components/common/BaseLayout/BaseLayout';
import Footer from 'components/login/Footer';
import LoginPageContent from 'components/login/LoginPageContent';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { getKey } from 'hooks/useLocalStorage';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

export default function LoginPage () {
  const { account } = useWeb3React();
  const { triedEager } = useContext(Web3Connection);
  const router = useRouter();
  const defaultWorkspace = typeof window !== 'undefined' && localStorage.getItem(getKey('last-workspace'));
  const [, setTitleState] = usePageTitle();
  const { user, isLoaded } = useUser();
  const [spaces,, isSpacesLoaded] = useSpaces();
  const [showLogin, setShowLogin] = useState(false); // capture isLoaded state to prevent render on route change
  const isLogInWithDiscord = typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'login';

  const isDataLoaded = triedEager && isSpacesLoaded && isLoaded;
  useEffect(() => {
    setTitleState('Welcome');
  }, []);

  function redirectUserAfterLogin () {
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

  useEffect(() => {
    // redirect user once wallet is connected
    if (isDataLoaded) {
      // redirect once account exists (user has connected wallet)
      if (account || user) {
        redirectUserAfterLogin();
      }
      else {
        setShowLogin(true);
      }
    }
  }, [account, isDataLoaded, user]);

  if (!showLogin) {
    return null;
  }

  return (
    isLogInWithDiscord ? null : getLayout(
      <>
        <LoginPageContent />
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
