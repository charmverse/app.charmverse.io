import type { DocusignCredential } from '@charmverse/core/prisma-client';

import { GET } from 'adapters/http';
import { redisClient } from 'adapters/redis/redisClient';
import { docusignOauthBaseUri } from 'config/constants';

import { docusignPeriodBetweenRequestsInSeconds } from './constants';
import { docusignUserOAuthTokenHeader } from './headers';

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

async function isDocusignAccountAdmin({
  docusignAccountId,
  docusignApiBaseUrl,
  docusignUserId,
  accessToken
}: Pick<DocusignCredential, 'docusignAccountId' | 'docusignApiBaseUrl'> & {
  docusignUserId: string;
  accessToken: string;
}): Promise<boolean> {
  const accountInfoUri = `${docusignApiBaseUrl}/restapi/v2/accounts/${docusignAccountId}/users/${docusignUserId}`;

  const docusignUserProfile = await GET<{ isAdmin: 'True' | 'False' }>(accountInfoUri, undefined, {
    headers: docusignUserOAuthTokenHeader({ accessToken })
  });

  return docusignUserProfile.isAdmin === 'True';
}

/**
 * Provides baseUri and accountId for the user's Docusign account
 */
export async function getUserDocusignAccountsInfo({ accessToken }: { accessToken: string }): Promise<
  (Pick<DocusignCredential, 'docusignAccountId' | 'docusignAccountName' | 'docusignApiBaseUrl'> & {
    isAdmin: boolean;
    isDefaultAccount: boolean;
  })[]
> {
  const redisKey = `docusign-accounts-${accessToken}`;

  const existingData = await redisClient?.get(redisKey);

  if (existingData) {
    return JSON.parse(existingData);
  }

  const profileUri = `${docusignOauthBaseUri}/oauth/userinfo`;

  const docusignUserProfile = await GET<DocusignUserProfile>(profileUri, undefined, {
    headers: docusignUserOAuthTokenHeader({ accessToken })
  });

  const accountInfos = await Promise.all(
    docusignUserProfile.accounts.map(async (account) => {
      const isAdmin = await isDocusignAccountAdmin({
        docusignAccountId: account.account_id,
        docusignApiBaseUrl: account.base_uri,
        docusignUserId: docusignUserProfile.sub,
        accessToken
      });

      return {
        docusignAccountId: account.account_id,
        docusignAccountName: account.account_name,
        docusignApiBaseUrl: account.base_uri,
        isAdmin,
        isDefaultAccount: account.is_default
      };
    })
  );

  // Cache for an hour
  await redisClient?.set(redisKey, JSON.stringify(accountInfos), { EX: docusignPeriodBetweenRequestsInSeconds });

  return accountInfos;
}
