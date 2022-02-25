import { ReactNode, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useUser } from 'hooks/useUser';

// Pages to connect your wallet
const walletConnectPages = ['/login', '/invite'];
// Pages to create a user account
const signupPages = ['/signup', '/invite'];
// Pages shared to the public that don't require user login
const publicPages = ['/share'];

/**
 * Page loading:
 * 1. React loads
 * 2a. Request user from session
 * 2b. Request connected wallet from browser extension
 *
 */

export default function RouteGuard ({ children }: { children: ReactNode }) {

  const router = useRouter();
  const [authorized, setAuthorized] = useState(true);
  const { triedEager } = useContext(Web3Connection);
  const { account, active } = useWeb3React();
  const [user, _, isUserLoaded] = useUser();
  const isUserLoading = !!(account && !isUserLoaded);
  const isWalletLoading = (!triedEager && !account);
  const isReactLoading = !router.isReady;
  const isLoading = isUserLoading || isWalletLoading || isReactLoading;

  // console.log('isLoading', isLoading, { isReactLoading, isWalletLoading, isUserLoading });

  useEffect(() => {
    // wait to listen to events until user is loaded
    if (isLoading) {
      return;
    }

    // on initial load - run auth check
    authCheck(router.asPath);

    // on route change start - hide page content by setting authorized to false
    const hideContent = () => setAuthorized(false);
    router.events.on('routeChangeStart', hideContent);

    // on route change complete - run auth check
    router.events.on('routeChangeComplete', authCheck);

    // unsubscribe from events in useEffect return function
    // eslint-disable-next-line consistent-return
    return () => {
      router.events.off('routeChangeStart', hideContent);
      router.events.off('routeChangeComplete', authCheck);
    };
  }, [account, isLoading, isUserLoaded, user]);

  function authCheck (url: string) {
    // redirect to login page if accessing a private page and not logged in
    const path = url.split('?')[0];

    if (publicPages.some(basePath => path.startsWith(basePath))) {
      setAuthorized(true);
    }// redirect to connect wallet
    else if (!account && !walletConnectPages.some(basePath => path.startsWith(basePath))) {
      setAuthorized(false);
      console.log('[RouteGuard]: redirect to login');
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
    }
    // redirect to create a user
    else if (account && !user && !signupPages.some(basePath => path.startsWith(basePath))) {
      setAuthorized(false);
      console.log('[RouteGuard]: redirect to signup', account, path);
      router.push({
        pathname: '/signup'
      });
    }
    else {
      setAuthorized(true);
    }
  }

  if (isLoading) {
    return null;
  }
  return <span>{authorized ? children : null}</span>;
}
