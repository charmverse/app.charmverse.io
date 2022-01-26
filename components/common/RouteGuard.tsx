import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0';

const publicPaths = ['/login', '/signup', '/'];

export default function RouteGuard ({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

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
    router.events.on('routeChangeComplete', authCheck)

    // unsubscribe from events in useEffect return function
    return () => {
      router.events.off('routeChangeStart', hideContent);
      router.events.off('routeChangeComplete', authCheck);
    }
  }, [isLoading]);

  function authCheck (url: string) {
    // redirect to login page if accessing a private page and not logged in
    const path = url.split('?')[0];
    if (!user && !publicPaths.some(basePath => path.startsWith(basePath))) {
      setAuthorized(false);
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
    }
    else {
      setAuthorized(true);
    }
  }

  if (isLoading) {
    return <></>;
  }
  return authorized ? children : null;
}