import type { CookieValueTypes } from 'cookies-next';
import { getCookies, getCookie } from 'cookies-next';
import { getIronSession } from 'iron-session';
import { useRouter } from 'next/router';
import { useState } from 'react';

export function UserAcquisition () {

  const router = useRouter();

  const [appReferrer, setAppReferrer] = useState<CookieValueTypes | null>(getCookie('appReferrer'));
  const [appLandingPage, setAppLandingPage] = useState<CookieValueTypes | null>(getCookie('appLandingPage'));

  return null;
}
