import { docusignClientId, docusignOauthBaseUri } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';

/**
 * https://developers.docusign.com/platform/auth/reference/scopes/
 */
const scopes = ['impersonation', 'extended', 'signature', 'cors'];

export function useDocusign() {
  const { space } = useCurrentSpace();
  function docusignOauthUrl() {
    const redirectUri = encodeURIComponent(
      `${getCallbackDomain(typeof window === 'undefined' ? '' : window.location.hostname)}/api/docusign/callback`
    );

    const oauthUri = `${docusignOauthBaseUri}/oauth/auth?response_type=code&scope=${scopes.join(
      encodeURIComponent(' ')
    )}&client_id=${docusignClientId}&redirect_uri=${redirectUri}&state=${space?.id}`;

    return oauthUri;
  }

  return {
    docusignOauthUrl
  };
}
