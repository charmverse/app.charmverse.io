import { baseUrl, docusignClientId, docusignOauthBaseUri } from '@packages/config/constants';

import { encodeDocusignState } from './encodeAndDecodeDocusignState';

/**
 * https://developers.docusign.com/platform/auth/reference/scopes/
 */
export const docusignScopes = ['impersonation', 'extended', 'signature', 'cors'];

export async function generateDocusignOAuthUrl({
  spaceId,
  userId
}: {
  spaceId: string;
  userId: string;
}): Promise<string> {
  const state = await encodeDocusignState({ spaceId, userId });

  const oauthUri = `${docusignOauthBaseUri}/oauth/auth?response_type=code&scope=${docusignScopes.join(
    encodeURIComponent(' ')
  )}&client_id=${docusignClientId}&redirect_uri=${encodeURIComponent(
    `${baseUrl}/api/docusign/callback`
  )}&state=${state}`;

  return oauthUri;
}
