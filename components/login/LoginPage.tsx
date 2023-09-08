import type { Space } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import { useContext, useEffect } from 'react';

import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { getLayout } from 'components/common/BaseLayout/getLayout';
import { getKey } from 'hooks/useLocalStorage';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { AUTH_CODE_COOKIE } from 'lib/discord/constants';
import { deleteCookie, getCookie, getSpaceUrl } from 'lib/utilities/browser';

import Footer from './components/Footer';
import { LoginPageContent } from './LoginPageContent';

export function LoginPageView() {
  const { triedEager } = useContext(Web3Connection);
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const { user, isLoaded } = useUser();
  const discordCookie = getCookie(AUTH_CODE_COOKIE);
  const { onClick: openSettingsModal, open: isSettingsDialogOpen } = useSettingsDialog();
  const isLogInWithDiscord = Boolean(discordCookie);
  const isDataLoaded = triedEager && isLoaded;
  const isLoggedIn = !!user;

  useEffect(() => {
    const account = router.query.account;
    const subscription = router.query.subscription;

    if (!isSettingsDialogOpen && router.isReady) {
      if (account) {
        openSettingsModal('account');
      }
      if (subscription) {
        openSettingsModal('subscription');
      }
    }
  }, [
    isSettingsDialogOpen,
    router.isReady,
    router.query.task,
    router.query.account,
    router.query.notifications,
    openSettingsModal
  ]);

  useEffect(() => {
    setTitleState('Welcome');
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

export function getDefaultWorkspaceUrl(spaces: Space[]) {
  const defaultSpaceDomain = typeof window !== 'undefined' && localStorage.getItem(getKey('last-workspace'));

  const defaultSpace =
    !!defaultSpaceDomain && spaces.find((space) => defaultSpaceDomain.startsWith(`/${space.domain}`));

  return getSpaceUrl(defaultSpace || spaces[0]);
}
