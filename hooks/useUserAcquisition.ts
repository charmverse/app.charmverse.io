import { setCookie } from 'cookies-next';
import { useRouter } from 'next/router';

import { useUser } from 'hooks/useUser';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';

// 2 weeks maximum age
const maxCookieAge = 60 * 60 * 24 * 14;

export function useUserAcquisition () {

  const { user } = useUser();

  const router = useRouter();

  function setReferrer () {

    const currentReferrer = document.referrer;

    if (currentReferrer && !currentReferrer.match(window.location.origin)) {
      setCookie('appReferrer' as SignupCookieType, currentReferrer, {
        sameSite: 'strict',
        maxAge: maxCookieAge,
        path: '/'
      });
    }
  }

  function setLandingPage () {
    const currentPage = window.location.href.split('?')[0];

    if (currentPage) {
      setCookie('appLandingPage' as SignupCookieType, currentPage, {
        sameSite: 'strict',
        maxAge: maxCookieAge,
        path: '/'
      });
    }

  }

  function setCampaign () {
    const currentCampaign = router.query.utm_campaign;

    if (currentCampaign) {
      setCookie('appCampaign' as SignupCookieType, currentCampaign, {
        sameSite: 'strict',
        maxAge: maxCookieAge,
        path: '/'
      });
    }

  }

  /**
   * Nulls out data if there is an active user
   *
   * Otherwise, assigns the data
   */
  function refreshSignupData () {

    if (!user) {
      setLandingPage();
      setReferrer();
      setCampaign();
    }
  }

  return {
    refreshSignupData
  };
}

