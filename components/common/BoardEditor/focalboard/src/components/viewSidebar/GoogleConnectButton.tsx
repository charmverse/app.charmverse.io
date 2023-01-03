/// <reference types="google.accounts" />

import Script from 'next/script';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { googleOAuthClientId } from 'config/constants';
import { formScopes } from 'lib/google/forms/scope';
import log from 'lib/log';

// login flow example: https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#authorization_code_flow_examples
export const googleIdentityServiceUrl = 'https://accounts.google.com/gsi/client';

export function GoogleConnectButton(props: { onConnect?: () => void }) {
  const [loaded, setLoaded] = useState(false);

  function initClient() {
    if (!googleOAuthClientId) {
      log.error('Google OAuth Client ID is not set');
      return;
    }
    // docs: https://developers.google.com/identity/oauth2/web/reference/js-reference
    const client = google.accounts.oauth2.initCodeClient({
      client_id: googleOAuthClientId,
      scope: formScopes,
      ux_mode: 'popup',
      callback: async (response) => {
        await charmClient.google.forms.createCredential(response);
        props.onConnect?.();
      }
    });
    return client;
  }

  function onLoadScript() {
    setLoaded(true);
  }

  function loginWithGoogle() {
    if (!loaded) {
      throw new Error('Google Identity Service script is not loaded yet');
    }
    const client = initClient();
    // Request authorization code and obtain user consent
    client?.requestCode();
  }

  return (
    <>
      <Script src={googleIdentityServiceUrl} onReady={onLoadScript} />
      <Button onClick={loginWithGoogle} variant='outlined'>
        Connect Google Account
      </Button>
    </>
  );
}
