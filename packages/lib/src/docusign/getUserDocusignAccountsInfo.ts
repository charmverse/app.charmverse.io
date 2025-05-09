import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { GET } from '@packages/adapters/http';
import { redisClient } from '@packages/adapters/redis/redisClient';
import { docusignOauthBaseUri } from '@packages/config/constants';

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

export type UserDocusignAccountsInfo = Pick<
  DocusignCredential,
  'docusignAccountId' | 'docusignAccountName' | 'docusignApiBaseUrl'
> & {
  isAdmin: boolean;
  isDefaultAccount: boolean;
};

/**
 * Provides baseUri and accountId for the user's Docusign account
 */
export async function getUserDocusignAccountsInfo({
  accessToken,
  adminOnly
}: {
  accessToken: string;
  adminOnly?: boolean;
}): Promise<UserDocusignAccountsInfo[]> {
  const redisKey = `docusign-accounts-${accessToken}`;

  const existingData = await redisClient?.get(redisKey);

  if (existingData) {
    const parsed = JSON.parse(existingData) as UserDocusignAccountsInfo[];
    if (adminOnly) {
      return parsed.filter((account) => account.isAdmin);
    }
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

  if (adminOnly) {
    return accountInfos.filter((account) => account.isAdmin);
  }

  return accountInfos;
}
