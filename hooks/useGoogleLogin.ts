/// <reference types="google.accounts" />

import { log } from '@charmverse/core/log';
import { useState } from 'react';

import charmClient from 'charmClient';
import { googleOAuthClientIdSensitive as googleOAuthClientId } from 'config/constants';
import { usePopupLogin } from 'hooks/usePopupLogin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import type { GooglePopupLoginState } from 'lib/oauth/interfaces';

export const googleSignInScript = 'https://accounts.google.com/gsi/client';

export function useGoogleLogin() {
  const [loaded, setLoaded] = useState(false);
  const { showMessage } = useSnackbar();
  const { openPopupLogin } = usePopupLogin<GooglePopupLoginState>();
  const { setUser } = useUser();

  function initClient({ hint, mode }: { hint?: string; mode?: 'redirect' | 'popup' } = {}) {
    if (!googleOAuthClientId) {
      log.error('Google OAuth Client ID is not set');
      return;
    }
    const redirectUri = `${getCallbackDomain(
      typeof window === 'undefined' ? '' : window.location.hostname
    )}/authenticate/google`;

    // docs: https://developers.google.com/identity/oauth2/web/reference/js-reference
    const client = google.accounts.oauth2.initCodeClient({
      client_id: googleOAuthClientId,
      hint,
      scope: 'profile email',
      ux_mode: mode || 'redirect',
      // for redirect mode
      redirect_uri: redirectUri
    });

    return client;
  }

  function onLoadScript() {
    setLoaded(true);
  }

  function loginWithGoogleRedirect({ hint }: { hint?: string } = {}) {
    if (!loaded) {
      throw new Error('Google Identity Service script is not loaded yet');
    }

    const client = initClient({ hint, mode: 'redirect' });
    // Request authorization code and obtain user consent
    client?.requestCode();
  }

  async function loginWithGooglePopup(params: { type?: 'login' | 'connect'; onSuccess?: () => void }) {
    const type = params?.type || 'login';
    const onSuccess = params?.onSuccess;

    const loginCallback = async (state: GooglePopupLoginState) => {
      if ('code' in state) {
        try {
          const loggedInUser = await charmClient.google.loginWithCode({ code: state.code, type });
          setUser(loggedInUser);
          const message = type === 'login' ? 'Logged in successfully' : 'Account connected successfully';
          if (onSuccess) {
            onSuccess?.();
          } else {
            showMessage(message, 'success');
          }
        } catch (error: any) {
          log.debug({ error });
        }
      }
    };

    let host = '';
    if (typeof window !== 'undefined') {
      host = window.location.host;
    }

    openPopupLogin(`${getCallbackDomain(host)}/authenticate/google?action=login`, loginCallback);
  }

  return {
    loginWithGoogleRedirect,
    loginWithGooglePopup,
    onLoadScript,
    isLoaded: loaded
  };
}
