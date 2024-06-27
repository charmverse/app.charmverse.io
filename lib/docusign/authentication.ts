import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { DELETE, POST } from 'adapters/http';
import { docusignOauthBaseUri } from 'config/constants';

import { getSpaceDocusignCredentials } from './getSpaceDocusignCredentials';
import { docusignIntegrationAuthHeader, docusignUserOAuthTokenHeader } from './headers';

type DocusignAccount = {
  account_id: string;
  is_default: boolean;
  account_name: string;
  base_uri: string;
};

type DocusignOauthResponse = {
  access_token: string;
  token_type: 'Bearer';
  refresh_token: string;
  expires_in: number;
};

export async function getUserDocusignOAuthTokenFromCode({ code }: { code: string }): Promise<DocusignOauthResponse> {
  const oauthUri = `${docusignOauthBaseUri}/oauth/token`;

  const token = await POST<DocusignOauthResponse>(oauthUri, undefined, {
    headers: docusignIntegrationAuthHeader(),
    query: {
      grant_type: 'authorization_code',
      code
    }
  });

  return token;
}

export async function refreshDocusignAccessToken({
  refreshToken
}: {
  refreshToken: string;
}): Promise<Pick<DocusignCredential, 'accessToken' | 'refreshToken'>> {
  const refreshTokenUri = `${docusignOauthBaseUri}/oauth/token`;

  const existingCredential = await prisma.docusignCredential.findFirstOrThrow({
    where: {
      refreshToken
    },
    select: {
      id: true
    }
  });

  const newToken = await POST<DocusignOauthResponse>(
    refreshTokenUri,
    {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    },
    {
      headers: docusignIntegrationAuthHeader()
    }
  );

  const updatedCredentials = await prisma.docusignCredential.update({
    where: {
      id: existingCredential.id
    },
    data: {
      accessToken: newToken.access_token,
      refreshToken: newToken.refresh_token
    },
    select: {
      accessToken: true,
      refreshToken: true
    }
  });

  return updatedCredentials;
}

export type PublicDocuSignProfile = Pick<DocusignCredential, 'docusignAccountId' | 'docusignAccountName' | 'spaceId'>;

export async function disconnectDocusignAccount({ spaceId }: { spaceId: string }): Promise<void> {
  const credentials = await getSpaceDocusignCredentials({ spaceId });

  if (credentials.docusignWebhookId) {
    await DELETE(
      `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/connect/${credentials.docusignWebhookId}`,
      undefined,
      {
        headers: docusignUserOAuthTokenHeader({ accessToken: credentials.accessToken })
      }
    );
  }

  await prisma.docusignCredential.delete({
    where: {
      spaceId
    }
  });
}
