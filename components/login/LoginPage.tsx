import type { Space } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { getLayout } from 'components/common/BaseLayout/getLayout';
import { getKey } from 'hooks/useLocalStorage';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { AUTH_CODE_COOKIE } from 'lib/discord/constants';
import { deleteCookie, getCookie, getSpaceUrl } from 'lib/utilities/browser';

import Footer from './components/Footer';
import { LoginPageContent } from './LoginPageContent';

export function LoginPageView() {
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const discordCookie = getCookie(AUTH_CODE_COOKIE);
  const { onClick: openSettingsModal, open: isSettingsDialogOpen } = useSettingsDialog();
  const isLogInWithDiscord = Boolean(discordCookie);

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
