import { ReactNode, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useUser } from 'hooks/useUser';
import { useSpaces } from 'hooks/useSpaces';
import { isSpaceDomain } from 'lib/spaces';

// Pages shared to the public that don't require user login
const publicPages = ['/login', '/invite', '/share'];
// Pages to create a user account but require a wallet connected
const walletRequiredPages = ['/signup', '/invite', '/join'];

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
  const [spaces] = useSpaces();
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
  }, [account, isLoading, isUserLoaded, spaces, user]);

  // authCheck runs before each page load and redirects to login if user is not logged in
  async function authCheck (url: string) {
    const path = url.split('?')[0];
    const spaceDomain = path.split('/')[1];

    // condition: public page
    if (publicPages.some(basePath => path.startsWith(basePath))) {
      setAuthorized(true);
    }
    // condition: wallet not connected
    else if (!account) {
      setAuthorized(false);
      console.log('[RouteGuard]: redirect to login');
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
    }
    // condition: signed in but needing access to a space
    else if (isSpaceDomain(spaceDomain) && (
      !user || (spaces.length > 0 && !spaces.some(s => s.domain === spaceDomain))
    )) {
      setAuthorized(false);
      console.log('[RouteGuard]: send to join workspace page');
      router.push({
        pathname: '/join',
        query: { domain: spaceDomain, returnUrl: router.asPath }
      });
    }
    // condition: wallet connected, but no user in session
    else if (!user && !walletRequiredPages.some(basePath => path.startsWith(basePath))) {
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
