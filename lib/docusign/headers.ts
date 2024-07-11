import { docusignClientId, docusignClientSecret } from '@root/config/constants';

export function docusignIntegrationAuthHeader() {
  return {
    Authorization: `Basic ${btoa(`${docusignClientId}:${docusignClientSecret}`)}`
  };
}

export function docusignUserOAuthTokenHeader({ accessToken }: { accessToken: string }) {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}
