import type { SignupCookieType } from '@packages/metrics/userAcquisition/interfaces';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { useCharmRouter } from 'hooks/useCharmRouter';
import { useUser } from 'hooks/useUser';
import { setCookie } from '@packages/lib/utils/browser';

// 2 weeks maximum age
const maxCookieAge = 14;

export function useUserAcquisition() {
  const [refreshedData, setRefreshedData] = useState(false);

  const { user } = useUser();

  const { router } = useCharmRouter();

  function setReferrer() {
    const currentReferrer = document.referrer;

    if (currentReferrer && !currentReferrer.match(window.location.origin)) {
      setCookie({ name: 'appReferrer' as SignupCookieType, value: currentReferrer, expiresInDays: maxCookieAge });
    }
  }

  function setLandingPage() {
    const currentPage = window.location.href.split('?')[0];

    setCookie({ name: 'appLandingPage' as SignupCookieType, value: currentPage, expiresInDays: maxCookieAge });
  }

  function setCampaign() {
    const currentCampaign = router.query.utm_campaign;

    if (currentCampaign) {
      setCookie({
        name: 'appCampaign' as SignupCookieType,
        value: currentCampaign as string,
        expiresInDays: maxCookieAge
      });
    }
  }

  function setUserReferrerCode() {
    const referrerCode = router.query.ref;

    if (referrerCode) {
      setCookie({
        name: 'userReferrerCode' as SignupCookieType,
        value: referrerCode as string,
        expiresInDays: maxCookieAge
      });
    }
  }

  /**
   * Nulls out data if there is an active user
   *
   * Otherwise, assigns the data
   */
  function refreshSignupData() {
    // Ensure this only runs once per session
    if (!user && !refreshedData) {
      setRefreshedData(true);
      setLandingPage();
      setReferrer();
      setCampaign();
      setUserReferrerCode();
    }
  }

  return {
    refreshSignupData
  };
}
