import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { getLayout } from 'components/common/BaseLayout/getLayout';
import Loader from 'components/common/LoadingComponent';
import { getKey } from 'hooks/useLocalStorage';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { AUTH_CODE_COOKIE } from 'lib/discord/constants';
import { isSpaceDomain } from 'lib/spaces/utils';
import { deleteCookie, getCookie, getSpaceUrl } from 'lib/utilities/browser';

import Footer from './components/Footer';
import { LoginPageContent } from './LoginPageContent';

export function LoginPageView() {
  const { triedEager } = useContext(Web3Connection);
  const router = useRouter();
  const [, setTitleState] = usePageTitle();
  const { user, isLoaded } = useUser();
  const { spaces, isLoaded: isSpacesLoaded } = useSpaces();
  const discordCookie = getCookie(AUTH_CODE_COOKIE);
  const { onClick: openSettingsModal, open: isSettingsDialogOpen } = useSettingsDialog();
  const [showLogin, setShowLogin] = useState(false); // capture isLoaded state to prevent render on route change
  const isLogInWithDiscord = Boolean(discordCookie);
  const isDataLoaded = triedEager && isSpacesLoaded && isLoaded;
  const isLoggedIn = !!user;
  const returnUrl = router.query.returnUrl as string | undefined;

  function redirectToDefaultPage() {
    // Send the user in priority to the invites page if they logged in looking to join a space
    if (returnUrl?.match('join') || returnUrl?.match('invite')) {
      log.info('Redirect user to given url');
      router.push(returnUrl);
    } else if (spaces.length === 0 && !isSpaceDomain(returnUrl?.replaceAll('/', ''))) {
      // Note that a user logging in will be redirected to /signup, because the 'user' and 'spaces' are loaded async after the wallet address appears.
      log.info('Redirect user to create a space');
      router.push('/createSpace');
      // send to signup for users without a workspace unless they are being redirected to an existing workspace
    } else if (returnUrl) {
      log.info('Redirect user to given url');
      router.push(returnUrl);
    } else {
      const defaultWorkspace = getDefaultWorkspaceUrl(spaces);
      log.info('Redirect user to default workspace');
      router.push(defaultWorkspace);
    }
  }

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
        redirectToDefaultPage();
      } else {
        setShowLogin(true);
      }
    }
  }, [isDataLoaded, isLoggedIn, user]);

  if (!showLogin) {
    return <Loader isLoading />;
  }

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
