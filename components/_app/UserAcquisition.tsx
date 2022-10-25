import type { CookieValueTypes } from 'cookies-next';
import { getCookies, getCookie, setCookie, deleteCookie } from 'cookies-next';
import { getIronSession } from 'iron-session';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

// 2 weeks maximum age
const maxCookieAge = 60 * 60 * 24 * 14;

export function useUserAcquisition () {

  const { user } = useUser();

  const router = useRouter();

  // console.log('Router path', router);

  const [storedId, setStoredId] = useState<CookieValueTypes | null>(getCookie('storedId'));

  const [appReferrer, setAppReferrer] = useState<CookieValueTypes | null>(getCookie('appReferrer'));
  const [appLandingPage, setAppLandingPage] = useState<CookieValueTypes | null>(getCookie('appLandingPage'));

  const setReferrer = useCallback(() => {

    const currentReferrer = document.referrer;

    if (!appReferrer && currentReferrer && !currentReferrer.match(window.location.origin)) {
      setAppReferrer(currentReferrer);
      setCookie('appReferrer', currentReferrer, {
        domain: window.location.origin,
        maxAge: maxCookieAge
      });
    }
  }, []);

  const setLandingPage = useCallback(() => {
    const currentPage = router.asPath;

    if (!appLandingPage && currentPage) {
      setAppLandingPage(currentPage);
      setCookie('appLandingPage', currentPage, {
        domain: window.location.origin,
        maxAge: maxCookieAge
      });
    }

  }, []);

  /**
   * Nulls out data if there is an active user
   *
   * Otherwise, assigns the data
   */
  const refreshSignupData = useCallback(() => {
    if (user) {
      deleteCookie('appReferrer');
      deleteCookie('appLandingPage');
    }
    else {
      setLandingPage();
      setReferrer();
    }
  }, []);

  return null;
}
