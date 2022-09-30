import getLayout from 'components/common/BaseLayout/BaseLayout';
import { LoginPageContent } from 'components/login';
import Footer from 'components/login/Footer';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { getKey } from 'hooks/useLocalStorage';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { lowerCaseEqual } from 'lib/utilities/strings';
import charmClient from 'charmClient';

export default function LoginPage () {
  const { account, walletAuthSignature } = useWeb3AuthSig();
  const { triedEager } = useContext(Web3Connection);
  const { showMessage } = useSnackbar();
  const router = useRouter();
  const defaultWorkspace = typeof window !== 'undefined' && localStorage.getItem(getKey('last-workspace'));
  const [, setTitleState] = usePageTitle();
  const { user, setUser, isLoaded } = useUser();
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
      const isValidDefaultWorkspace = !!defaultWorkspace && spaces.some(space => defaultWorkspace.startsWith(`/${space.domain}`));
      router.push(isValidDefaultWorkspace ? defaultWorkspace : `/${spaces[0].domain}`);
    }
    else {
      router.push('/signup');
    }
  }

  async function loginUser (authSig: AuthSig) {
    charmClient.login({ address: account as string, walletSignature: authSig })
      .then((_user) => {
        setUser(_user);
        redirectUserAfterLogin();
      })
      .catch((err) => {
        charmClient.createUser({
          address: account as string,
          walletSignature: authSig
        }).then((_user) => {
          setUser(_user);
          redirectUserAfterLogin();
        });
      });
  }

  useEffect(() => {

    // redirect user once wallet is connected
    if (isDataLoaded) {
      // redirect once account exists (user has connected wallet)
      if (user && (isLogInWithDiscord
        || (account && user.addresses.some(a => a === account) && lowerCaseEqual(walletAuthSignature?.address as string, account)))) {
        redirectUserAfterLogin();
      }
      else if (account && walletAuthSignature && lowerCaseEqual(walletAuthSignature?.address as string, account)) {
        loginUser(walletAuthSignature);
      }
      else {
        setShowLogin(true);
      }
    }
  }, [account, walletAuthSignature, isDataLoaded]);

  if (!showLogin) {
    return null;
  }

  return (
    isLogInWithDiscord ? null : getLayout(
      <>
        <LoginPageContent walletSigned={(authSig) => {
          showMessage('Wallet verified. Logging you in', 'success');
          loginUser(authSig);
        }}
        />
        <Footer />
      </>
    )
  );
}
