import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';

import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { getLayout } from 'components/common/BaseLayout/getLayout';
import { usePageTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import { AUTH_CODE_COOKIE } from '@packages/lib/discord/constants';
import { deleteCookie, getCookie } from '@packages/lib/utils/browser';

import Footer from './components/Footer';
import { LoginPageContent } from './LoginPageContent';

export function LoginPageView() {
  const { triedEager } = useContext(Web3Connection);
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const { user, isLoaded: isUserLoaded } = useUser();
  const discordCookie = getCookie(AUTH_CODE_COOKIE);
  const isLogInWithDiscord = Boolean(discordCookie);
  const isDataLoaded = triedEager && isUserLoaded;
  const isLoggedIn = !!user;

  useEffect(() => {
    setTitleState(''); // use default title
    if (discordCookie) {
      deleteCookie(AUTH_CODE_COOKIE);
    }
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      // redirect once user is logged in unless we are verifying their wallet
      if (isLoggedIn) {
        router.replace(router.asPath);
      }
    }
  }, [isDataLoaded, isLoggedIn, user]);

  return isLogInWithDiscord
    ? null
    : getLayout(
        <>
          <LoginPageContent />
          <Footer />
        </>,
        { bgcolor: 'default' }
      );
}
