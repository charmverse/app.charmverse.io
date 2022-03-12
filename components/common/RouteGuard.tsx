import { ReactNode, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { User } from '@prisma/client';
import { useUser } from 'hooks/useUser';
import { useSpaces } from 'hooks/useSpaces';
import { isSpaceDomain } from 'lib/spaces';
import charmClient from 'charmClient';
import type { UrlObject } from 'url';

// Pages shared to the public that don't require user login
const publicPages = ['/', '/invite', '/share'];

export default function RouteGuard ({ children }: { children: ReactNode }) {

  const router = useRouter();
  const [authorized, setAuthorized] = useState(true);
  const { triedEager } = useContext(Web3Connection);
  const { account, active } = useWeb3React();
  const [user, setUser, isUserLoaded] = useUser();
  const [spaces, _, isSpacesLoaded] = useSpaces();
  const isUserLoading = !!(account && !isUserLoaded);
  const isWalletLoading = (!triedEager && !account);
  const isReactLoading = !router.isReady;
  const isLoading = isUserLoading || isWalletLoading || isReactLoading || !isSpacesLoaded;

  // console.log('isLoading', isLoading, { isReactLoading, isWalletLoading, isUserLoading, isSpacesLoaded });

  useEffect(() => {
    // wait to listen to events until data is loaded
    if (isLoading) {
      return;
    }

    function authCheckAndRedirect (path: string) {
      authCheck(path)
        .then(result => {
          setAuthorized(result.authorized);
          if (result.user) {
            setUser(result.user);
          }
          if (result.redirect) {
            router.push(result.redirect);
          }
        });
    }

    authCheckAndRedirect(router.asPath);

    // on route change start - hide page content by setting authorized to false
    const hideContent = () => setAuthorized(false);
    router.events.on('routeChangeStart', hideContent);

    // on route change complete - run auth check
    router.events.on('routeChangeComplete', authCheckAndRedirect);

    // unsubscribe from events in useEffect return function
    // eslint-disable-next-line consistent-return
    return () => {
      router.events.off('routeChangeStart', hideContent);
      router.events.off('routeChangeComplete', authCheckAndRedirect);
    };
  }, [isLoading, account, user, spaces]);

  // authCheck runs before each page load and redirects to login if user is not logged in
  async function authCheck (url: string): Promise<{ authorized: boolean, redirect?: UrlObject, user?: User }> {
    const path = url.split('?')[0];
    const spaceDomain = path.split('/')[1];

    // condition: public page
    if (publicPages.some(basePath => path === basePath)) {
      return { authorized: true };
    }
    // condition: wallet not connected
    else if (!account) {
      console.log('[RouteGuard]: redirect to login');
      return {
        authorized: false,
        redirect: {
          pathname: '/',
          query: { returnUrl: router.asPath }
        }
      };
    }
    // condition: user not loaded
    else if (!user) {
      console.log('[RouteGuard]: user not loaded');
      let _user = await charmClient.login(account);
      if (!_user) {
        _user = await charmClient.createUser({ address: account });
      }
      return { authorized: false, user: _user };
    }
    // condition: user switches to a new/unknown address
    else if (!user.addresses.includes(account)) {
      console.log('[RouteGuard]: unknown address');
      let _user = await charmClient.login(account).catch(err => null);
      if (!_user) {
        _user = await charmClient.createUser({ address: account });
      }
      return { authorized: false, user: _user };
    }
    // condition: trying to access a space without access
    else if (isSpaceDomain(spaceDomain) && !spaces.some(s => s.domain === spaceDomain)) {
      console.log('[RouteGuard]: send to join workspace page');
      return {
        authorized: false,
        redirect: {
          pathname: '/join',
          query: { domain: spaceDomain, returnUrl: router.asPath }
        }
      };
    }
    // condition: no space associated with user
    // else if (spaces.length === 0 && !isSpaceDomain(spaceDomain)) {
    //   console.log('[RouteGuard]: redirect to create or join a workspace', router.pathname);
    //   return {
    //     authorized: false,
    //     redirect: {
    //       pathname: '/signup',
    //       query: { returnUrl: router.asPath }
    //     }
    //   };
    // }
    else {
      return { authorized: true };
    }
  }

  if (isLoading) {
    return null;
  }
  return <span>{authorized ? children : null}</span>;
}
