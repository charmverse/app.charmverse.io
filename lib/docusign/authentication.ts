import { InvalidInputError } from '@charmverse/core/errors';
import { hasAccessToSpace } from '@charmverse/core/permissions';
import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { DELETE, GET, POST } from 'adapters/http';
import { docusignClientId, docusignClientSecret, docusignOauthBaseUri, isDevEnv } from 'config/constants';

type DocusignAccount = {
  account_id: string;
  is_default: boolean;
  account_name: string;
  base_uri: string;
};

type DocusignUserProfile = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  created: string;
  email: string;
  accounts: DocusignAccount[];
};

const demoAccountId = process.env.DEMO_DOCUSIGN_ACCOUNT_ID as string;
const demoBaseUrl = process.env.DEMO_DOCUSIGN_BASE_URL as string;

function docusignIntegrationAuthHeader() {
  return {
    Authorization: `Basic ${btoa(`${docusignClientId}:${docusignClientSecret}`)}`
  };
}

export function docusignUserOAuthTokenHeader({ accessToken }: { accessToken: string }) {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

/**
 * Provides baseUri and accountId for the user's Docusign account
 */
async function getUserDocusignAccountInfo({
  accessToken
}: {
  accessToken: string;
}): Promise<Pick<DocusignCredential, 'docusignAccountId' | 'docusignAccountName' | 'docusignApiBaseUrl'>> {
  const profileUri = `${docusignOauthBaseUri}/oauth/userinfo`;

  return GET<DocusignUserProfile>(profileUri, {
    headers: docusignUserOAuthTokenHeader({ accessToken })
  })
    .then((userProfile) => {
      return {
        docusignAccountId: userProfile.accounts[0].account_id,
        docusignApiBaseUrl: userProfile.accounts[0].base_uri,
        docusignAccountName: userProfile.accounts[0].account_name
      };
    })
    .catch((err) => {
      if (isDevEnv) {
        return { docusignAccountId: demoAccountId, docusignApiBaseUrl: demoBaseUrl, docusignAccountName: 'CharmVerse' };
      }
      throw new InvalidInputError('Failed to fetch user profile');
    });
}

type DocusignOauthResponse = {
  access_token: string;
  token_type: 'Bearer';
  refresh_token: string;
  expires_in: number;
};
export async function saveUserDocusignOAuthToken({
  code,
  spaceId,
  userId
}: {
  code: string;
  userId: string;
  spaceId: string;
}): Promise<DocusignCredential> {
  const oauthUri = `${docusignOauthBaseUri}/oauth/token`;

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole?.isAdmin) {
    throw new InvalidInputError('Only admin users can save credentials for the space');
  }

  const token = await POST<DocusignOauthResponse>(oauthUri, undefined, {
    headers: docusignIntegrationAuthHeader(),
    query: {
      grant_type: 'authorization_code',
      code
    }
  });

  const profile = await getUserDocusignAccountInfo({ accessToken: token.access_token });

  const existingCredentials = await prisma.docusignCredential.findFirst({
    where: {
      spaceId
    }
  });

  if (existingCredentials) {
    return prisma.docusignCredential.update({
      where: {
        id: existingCredentials.id
      },
      data: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        docusignAccountId: profile.docusignAccountId,
        docusignAccountName: profile.docusignAccountName,
        docusignApiBaseUrl: profile.docusignApiBaseUrl
      }
    });
  } else {
    return prisma.docusignCredential.create({
      data: {
        docusignAccountId: profile.docusignAccountId,
        docusignAccountName: profile.docusignAccountName,
        docusignApiBaseUrl: profile.docusignApiBaseUrl,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        userId,
        spaceId
      }
    });
  }
}

export async function refreshAccessToken({
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

export async function getSpaceDocusignCredentials({ spaceId }: { spaceId: string }): Promise<DocusignCredential> {
  const credentials = await prisma.docusignCredential.findFirstOrThrow({
    where: {
      spaceId
    }
  });

  return credentials;
}

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
