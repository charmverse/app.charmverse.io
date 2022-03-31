import { useContext, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useRouter } from 'next/router';
import getLayout from 'components/common/BaseLayout/BaseLayout';
import LoginPageContent from 'components/login/LoginPageContent';
import { usePageTitle } from 'hooks/usePageTitle';
import Footer from 'components/login/Footer';
import { useSpaces } from 'hooks/useSpaces';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useUser } from 'hooks/useUser';

export default function LoginPage () {
  const { account } = useWeb3React();
  const { triedEager } = useContext(Web3Connection);
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const [user, setUser, isUserLoaded] = useUser();
  const [spaces, setSpaces, isSpacesLoaded] = useSpaces();
  const [showLogin, setShowLogin] = useState(false); // capture isLoaded state to prevent render on route change
  const isLogInWithDiscord = typeof router.query.code === 'string' && router.query.discord === '1' && router.query.type === 'login';

  const isDataLoaded = triedEager && isSpacesLoaded && isUserLoaded;
  useEffect(() => {
    setTitleState('Welcome');
  }, []);

  function redirectUserAfterLogin () {
    if (typeof router.query.returnUrl === 'string') {
      router.push(router.query.returnUrl);
    }
    else if (spaces.length > 0) {
      router.push(`/${spaces[0].domain}`);
    }
    else {
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
