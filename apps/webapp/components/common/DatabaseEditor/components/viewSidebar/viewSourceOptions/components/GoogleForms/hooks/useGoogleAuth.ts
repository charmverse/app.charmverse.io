/// <reference types="google.accounts" />

import { log } from '@charmverse/core/log';
import { googleOAuthClientIdSensitive as googleOAuthClientId } from '@packages/config/constants';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { formScopes } from '@packages/lib/google/forms/config';
import { validateFormScopes } from '@packages/lib/google/forms/validateFormScopes';
import type { CredentialItem } from 'pages/api/google/credentials';

// login flow example: https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#authorization_code_flow_examples
export const googleIdentityServiceScript = 'https://accounts.google.com/gsi/client';

export function useGoogleAuth(props: { onConnect?: (credential: CredentialItem) => void }) {
  const [loaded, setLoaded] = useState(false);
  const { showMessage } = useSnackbar();
  function initClient({ hint }: { hint?: string } = {}) {
    if (!googleOAuthClientId) {
      log.error('Google OAuth Client ID is not set');
      return;
    }
    // docs: https://developers.google.com/identity/oauth2/web/reference/js-reference
    const client = google.accounts.oauth2.initCodeClient({
      client_id: googleOAuthClientId,
      hint,
      scope: formScopes,
      ux_mode: 'popup',
      callback: async (response) => {
        if (!validateFormScopes(response.scope)) {
          showMessage('Please check all permissions to enable access to Forms API', 'error');
        } else {
          const credential = await charmClient.google.forms.createCredential(response);
          props.onConnect?.(credential);
        }
      }
    });
    return client;
  }

  function onLoadScript() {
    setLoaded(true);
  }

  function loginWithGoogle({ hint }: { hint?: string } = {}) {
    if (!loaded) {
      throw new Error('Google Identity Service script is not loaded yet');
    }
    const client = initClient({ hint });
    // Request authorization code and obtain user consent
    client?.requestCode();
  }

  return {
    loginWithGoogle,
    onLoadScript
  };
}
