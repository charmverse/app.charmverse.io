import type { UrlObject } from 'url';

import { log } from '@charmverse/core/log';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useRef, useEffect, useState } from 'react';

import { getKey } from 'hooks/useLocalStorage';
import { useSharedPage } from 'hooks/useSharedPage';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { filterSpaceByDomain } from 'lib/spaces/filterSpaceByDomain';
import { redirectToAppLogin, shouldRedirectToAppLogin } from 'lib/utilities/browser';
import { getValidCustomDomain } from 'lib/utilities/domains/getValidCustomDomain';
// Pages shared to the public that don't require user login
// When adding a page here or any new top-level pages, please also add this page to DOMAIN_BLACKLIST in lib/spaces/config.ts
const publicPages = ['/', 'share', 'api-docs', 'u', 'join', 'invite', 'authenticate', 'test'];
// pages that should be always available to logged in users
const publicLoggedInPages = ['createSpace'];

export default function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { accessChecked, hasSharedPageAccess } = useSharedPage();
  const [authorized, setAuthorized] = useState(true);
  const { user, isLoaded } = useUser();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();
  const isLoading = !isLoaded || !isSpacesLoaded || !accessChecked;
  const authorizedSpaceDomainRef = useRef('');
  const spaceDomain = (router.query.domain as string) || '';
  const hasSpaceDomain = !!spaceDomain;

  useEffect(() => {
    const defaultPageKey: string = spaceDomain ? getKey(`last-page-${spaceDomain}`) : '';
    const defaultWorkspaceKey: string = getKey('last-workspace');
    if (spaceDomain) {
      localStorage.setItem(defaultWorkspaceKey, spaceDomain);
    }

    // pathname with domain pattern /[domain]/page_path_pattern
    const hasPageInPath = !!router.pathname.split('/[domain]')[1];
    if (spaceDomain && hasPageInPath) {
      localStorage.setItem(defaultPageKey, router.asPath);
    }
  }, [router.asPath, router.pathname, spaceDomain]);

  useEffect(() => {
    // wait to listen to events until data is loaded
    if (isLoading) {
      return;
    }

    async function authCheckAndRedirect(path: string) {
      const result = await authCheck(path);

      setAuthorized(result.authorized);

      if (result.redirect) {
        router.push(result.redirect);
      }
    }

    authCheckAndRedirect(router.asPath);
    // on route change complete - run auth check
    router.events.on('routeChangeComplete', authCheckAndRedirect);

    return () => {
      router.events.off('routeChangeComplete', authCheckAndRedirect);
    };
  }, [isLoading, user, spaces]);

  // authCheck runs before each page load and redirects to login if user is not logged in
  async function authCheck(url: string): Promise<{ authorized: boolean; redirect?: UrlObject }> {
    const path = url.split('?')[0];

    const firstPathSegment =
      path.split('/').filter((pathElem) => {
        // Only get segments that evaluate to some value
        return pathElem;
      })[0] ?? '/';
    const isPublicPath = publicPages.some((basePath) => firstPathSegment === basePath);
    // special case, when visiting main app url on space subdomain
    const isSpaceSubdomainPath = firstPathSegment === '/' && !!spaceDomain;
    // visiting page that shoould be alway available to logged in users
    const isAvailableToLoggedInUsers = publicLoggedInPages.some((basePath) => firstPathSegment === basePath);

    // condition: public page
    if ((isPublicPath && !isSpaceSubdomainPath) || hasSharedPageAccess) {
      return { authorized: true };
    }

    // condition: no user session and no wallet address
    else if (!user) {
      if (getValidCustomDomain()) {
        // if app is running on a custom domain, main url will handle login
        return { authorized: true };
      }

      // if app is running on a subdomain, redirect to main app login
      if (shouldRedirectToAppLogin() && redirectToAppLogin()) {
        return { authorized: false };
      }

      log.info('[RouteGuard]: redirect to login');
      return {
        authorized: true,
        redirect: {
          pathname: '/',
          query: { returnUrl: router.asPath }
        }
      };
    }
    // condition: trying to access a space without access
    else if (!isAvailableToLoggedInUsers && hasSpaceDomain && !filterSpaceByDomain(spaces, spaceDomain)) {
      log.info('[RouteGuard]: send to join space page');
      if (authorizedSpaceDomainRef.current === spaceDomain) {
        authorizedSpaceDomainRef.current = '';
        return {
          authorized: false,
          redirect: {
            pathname: spaces.length !== 0 ? `/${spaces[0].domain}` : '/createSpace'
          }
        };
      }

      return {
        authorized: false,
        redirect: {
          pathname: '/join',
          query: { domain: spaceDomain, returnUrl: router.asPath }
        }
      };
    } else {
      authorizedSpaceDomainRef.current = spaceDomain;
      return { authorized: true };
    }
  }

  if (!authorized) {
    return null;
  }
  return <span>{children}</span>;
}
