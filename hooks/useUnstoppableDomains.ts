import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { useState, useEffect } from 'react';

import charmClient from 'charmClient';
import { useWeb3ConnectionManager } from 'components/_app/Web3ConnectionManager/Web3ConnectionManager';
import type { AnyIdLogin } from 'components/login/components/LoginButton';
import { useCustomDomain } from 'hooks/useCustomDomain';
import { usePopupLogin } from 'hooks/usePopupLogin';
import { extractDomainFromProof, type UnstoppableDomainsAuthSig } from 'lib/blockchain/unstoppableDomains';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import type { UdomainsPopupLoginState } from 'lib/oauth/interfaces';
import { getAppUrl } from 'lib/utilities/browser';
import { DisabledAccountError, BrowserPopupError } from 'lib/utilities/errors';

const clientID = env('UNSTOPPABLE_DOMAINS_CLIENT_ID');

const UDOMAINS_AUTH_URL = '/authenticate/udomains';

export function useUnstoppableDomains() {
  const [uAuthPopupError, setUAuthPopupError] = useState<BrowserPopupError | null>(null);
  const { isWalletSelectorModalOpen, setIsConnectingIdentity } = useWeb3ConnectionManager();
  const { isOnCustomDomain } = useCustomDomain();
  const { openPopupLogin } = usePopupLogin<UdomainsPopupLoginState>();

  useEffect(() => {
    if (!isWalletSelectorModalOpen) {
      setUAuthPopupError(null);
    }
  }, [isWalletSelectorModalOpen]);

  const getUauthClient = async (callbackPath = '') => {
    const redirectUri = getCallbackDomain(typeof window === 'undefined' ? '' : window.location.hostname).toString();
    log.info('Connect unstoppable domains redirectUri', redirectUri);

    const UAuth = (await import('@uauth/js')).default;
    const uauth = new UAuth({
      clientID,
      redirectUri: `${redirectUri}${callbackPath}`,
      scope: 'openid wallet'
    });

    return uauth;
  };

  async function loginWithAuthSig(authSig: UnstoppableDomainsAuthSig) {
    const user = await charmClient.unstoppableDomains.login({ authSig });
    const domain = extractDomainFromProof(authSig);

    return { user, domain };
  }

  async function unstoppableDomainsLogin({
    loginSuccess,
    onError
  }: {
    loginSuccess: (loginInfo: AnyIdLogin<'UnstoppableDomain'>) => any;
    onError?: (err: DisabledAccountError) => void;
  }) {
    setIsConnectingIdentity(true);

    if (isOnCustomDomain) {
      const popupLoginCallback = async (data: UdomainsPopupLoginState) => {
        if ('authSig' in data) {
          const { user, domain } = await loginWithAuthSig(data.authSig);
          loginSuccess({ displayName: domain, identityType: 'UnstoppableDomain', user });
        } else if ('error' in data) {
          onError?.(new DisabledAccountError(data.error));
        }
      };

      return openPopupLogin(`${getAppUrl().toString()}${UDOMAINS_AUTH_URL}?action=login`, popupLoginCallback);
    }

    const uauth = await getUauthClient();

    try {
      const authSig = (await uauth.loginWithPopup()) as any as UnstoppableDomainsAuthSig;
      const { user, domain } = await loginWithAuthSig(authSig);

      loginSuccess({ displayName: domain, identityType: 'UnstoppableDomain', user });
    } catch (err) {
      if ((err as DisabledAccountError)?.errorType === 'Disabled account') {
        onError?.(err as DisabledAccountError);
      } else if ((err as Error).message.match('failed to be constructed')) {
        setUAuthPopupError(new BrowserPopupError());
      }
      setIsConnectingIdentity(false);
      log.error(err);
    }
  }

  async function unstoppableDomainsRedirectLogin() {
    const uauth = await getUauthClient(UDOMAINS_AUTH_URL);
    uauth.login();
  }

  async function loginCallback() {
    const uauth = await getUauthClient(UDOMAINS_AUTH_URL);
    const res = await uauth.loginCallback();

    return res.authorization as unknown as UnstoppableDomainsAuthSig;
  }

  return { uAuthPopupError, unstoppableDomainsLogin, unstoppableDomainsRedirectLogin, loginCallback };
}
