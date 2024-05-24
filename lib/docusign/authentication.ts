import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { hasAccessToSpace } from '@charmverse/core/permissions';
import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { sealData, unsealData } from 'iron-session';

import { DELETE, GET, POST } from 'adapters/http';
import {
  authSecret,
  docusignClientId,
  docusignClientSecret,
  docusignOauthBaseUri,
  isDevEnv,
  isStagingEnv
} from 'config/constants';
import { isCharmVerseSpace } from 'lib/featureFlag/isCharmVerseSpace';

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
const demoBaseUrl = 'https://demo.docusign.net';

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
  accessToken,
  spaceId
}: {
  accessToken: string;
  spaceId: string;
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
    .catch(async (err) => {
      log.error('Failed to fetch user Docusign profile', err);

      const space = await prisma.space.findUniqueOrThrow({
        where: {
          id: spaceId
        },
        select: {
          domain: true
        }
      });

      if (isDevEnv || isStagingEnv || isCharmVerseSpace({ space })) {
        return {
          docusignAccountId: demoAccountId,
          docusignApiBaseUrl: demoBaseUrl,
          docusignAccountName: 'CharmVerse'
        };
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

  const profile = await getUserDocusignAccountInfo({ accessToken: token.access_token, spaceId });

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

type DocusignOAuthState = {
  userId: string;
  spaceId: string;
};

export async function encodeDocusignState(input: DocusignOAuthState): Promise<string> {
  if (!stringUtils.isUUID(input.spaceId) || !stringUtils.isUUID(input.userId)) {
    throw new InvalidInputError('Invalid spaceId or userId');
  }

  const sealedSpaceAndUserId = await sealData(input, { password: authSecret as string, ttl: 60 * 60 });

  return sealedSpaceAndUserId;
}

export async function decodeDocusignState(input: string): Promise<DocusignOAuthState> {
  const data = (await unsealData(input, { password: authSecret as string })) as DocusignOAuthState;

  if (!stringUtils.isUUID(data.spaceId) || !stringUtils.isUUID(data.userId)) {
    throw new InvalidInputError('Invalid spaceId or userId found in docusign data');
  }

  return data;
}
