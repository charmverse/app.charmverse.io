import type { UrlObject } from 'url';

import type { User } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { getKey } from 'hooks/useLocalStorage';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import log from 'lib/log';
import { isSpaceDomain } from 'lib/spaces';
import { lowerCaseEqual } from 'lib/utilities/strings';

// Pages shared to the public that don't require user login
const publicPages = ['/', 'share', 'api-docs', 'u'];
const accountPages = ['profile'];

export default function RouteGuard ({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(true);
  const { account, walletAuthSignature, triedEager } = useWeb3AuthSig();
  const { user, setUser, isLoaded } = useUser();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();
  const isWalletLoading = (!triedEager && !account);
  const isRouterLoading = !router.isReady;
  const isLoading = !isLoaded || isWalletLoading || isRouterLoading || !isSpacesLoaded;

  if (typeof window !== 'undefined') {
    const pathSegments: string[] = router.asPath.split('?')[0].split('/').filter(segment => !!segment);
    const firstSegment: string = pathSegments[0];
    const isDomain: boolean = !!isSpaceDomain(firstSegment) || firstSegment === 'nexus';
    const workspaceDomain = isDomain ? firstSegment : null;
    const defaultPageKey: string = workspaceDomain ? getKey(`last-page-${workspaceDomain}`) : '';
    const defaultWorkspaceKey: string = getKey('last-workspace');

    if (workspaceDomain) {
      localStorage.setItem(defaultWorkspaceKey, router.asPath);
    }

    if (workspaceDomain && pathSegments.length > 1) {
      localStorage.setItem(defaultPageKey, router.asPath);
    }
  }

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
  }, [isLoading, account, walletAuthSignature, user, spaces]);

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
    else if (!user) {
      log.info('[RouteGuard]: redirect to login');
      return {
        authorized: true,
        redirect: {
          pathname: '/',
          query: { returnUrl: router.asPath }
        }
      };
    }
    // condition: account but no valid wallet signature
    else if (account && !lowerCaseEqual(walletAuthSignature?.address as string, account)) {
      log.info('[RouteGuard]: redirect to verify wallet');
      return {
        authorized: true,
        redirect: {
          pathname: '/',
          query: { returnUrl: router.asPath }
        }
      };

    }
    // condition: user accesses account pages (profile, tasks)
    else if (accountPages.some(basePath => firstPathSegment === basePath)) {
      return { authorized: true };
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
