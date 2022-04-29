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
import log from 'lib/log';

// TODO: Discord login for /invite route

// Pages shared to the public that don't require user login
const publicPages = ['/', 'invite', 'share', 'api-docs'];

export default function RouteGuard ({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(true);
  const { triedEager } = useContext(Web3Connection);
  const { account } = useWeb3React();
  const [user, setUser, isUserRequestComplete] = useUser();
  const [spaces, _, isSpacesLoaded] = useSpaces();
  const isWalletLoading = (!triedEager && !account);
  const isRouterLoading = !router.isReady;
  const isLoading = !isUserRequestComplete || isWalletLoading || isRouterLoading || !isSpacesLoaded;

  useEffect(() => {
    // wait to listen to events until data is loaded
    if (isLoading) {
      return;
    }

    async function authCheckAndRedirect (path: string) {

      const result = await authCheck(path);

      setAuthorized(result.authorized);

      if (result.user) {
        setUser(result.user);
      }

      if (result.redirect) {
        router.push(result.redirect);
      }
    }

    authCheckAndRedirect(router.asPath);

    // on route change start - hide page content by setting authorized to false
    const hideContent = () => {
      setAuthorized(false);
    };
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

    const firstPathSegment = path.split('/').filter(pathElem => {
      // Only get segments that evaluate to some value
      return pathElem;
    })[0] ?? '/';

    const spaceDomain = path.split('/')[1];

    // condition: public page
    if (publicPages.some(basePath => firstPathSegment === basePath)) {
      return { authorized: true };
    }
    // condition: no user session and no wallet address
    else if (!user && !account) {
      log.info('[RouteGuard]: redirect to login');
      return {
        authorized: true,
        redirect: {
          pathname: '/',
          query: { returnUrl: router.asPath }
        }
      };
    }
    // condition: no session, but a wallet is connected
    else if (!user && account) {
      log.info('[RouteGuard]: log in user by wallet address');
      const _user = await charmClient.login(account).catch(err => null);
      if (_user) {
        return { authorized: true, user: _user };
      }
      else {
        const __user = await charmClient.createUser({ address: account });
        return { authorized: true, user: __user };
      }
    }
    // condition: user connected but the wallet address is new
    else if (user && account && !user.addresses.includes(account)) {
      log.info('[RouteGuard]: unknown address');
      const _user = await charmClient.login(account).catch(err => null);
      // log in existing user
      if (_user) {
        return { authorized: true, user: _user };
      }
      // add the address to current profile
      else if (user.addresses.length === 0) {
        const __user = await charmClient.updateUser({ addresses: [account] });
        return { authorized: true, user: __user };
      }
      // create a new user
      else {
        const __user = await charmClient.createUser({ address: account });
        return { authorized: true, user: __user };
      }
    }
    // condition: trying to access a space without access
    else if (isSpaceDomain(spaceDomain) && !spaces.some(s => s.domain === spaceDomain)) {
      log.info('[RouteGuard]: send to join workspace page');
      return {
        authorized: false,
        redirect: {
          pathname: '/join',
          query: { domain: spaceDomain, returnUrl: router.asPath }
        }
      };
    }
    else if (isSpaceDomain(spaceDomain) && path.match('/settings')) {

      const space = spaces.find(_space => _space.domain === spaceDomain);

      const isAdmin = user?.spaceRoles.some(role => role.spaceId === space?.id && (role.isAdmin || role.role === 'admin'));

      if (!isAdmin) {
        return {
          authorized: false,
          redirect: {
            pathname: `/${spaceDomain}`
          }
        };
      }
      return { authorized: true };

    }
    else {
      return { authorized: true };
    }
  }

  if (isLoading) {
    return null;
  }
  return (
    <span>
      {authorized
        ? children
        : null}
    </span>
  );
}
