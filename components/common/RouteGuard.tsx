import { ReactNode, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useUser } from 'hooks/useUser';

const publicPaths = ['/login'];

export default function RouteGuard ({ children }: { children: ReactNode }) {

  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const { triedEager } = useContext(Web3Connection);
  const { account, active } = useWeb3React();
  const [user, _, isUserLoaded] = useUser();
  const isLoading = !isUserLoaded || !router.isReady || (!triedEager && !account && active);
  console.log('isLoading', isUserLoaded, isLoading, user, (!triedEager && !account && active));
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
  }, [account, isLoading, isUserLoaded]);

  function authCheck (url: string) {
    // redirect to login page if accessing a private page and not logged in
    const path = url.split('?')[0];
    // redirect to connect wallet
    if (!account && !publicPaths.some(basePath => path.startsWith(basePath))) {
      setAuthorized(false);
      console.log('[RouteGuard]: redirect to login');
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
    }
    // redirect to create a user
    else if (account && !user && path !== '/signup') {
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
