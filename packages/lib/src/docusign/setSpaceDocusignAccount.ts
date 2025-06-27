import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { hasAccessToSpace } from '@packages/core/permissions';

import { ensureSpaceWebhookExists } from './connect';
import { getSpaceDocusignCredentials } from './getSpaceDocusignCredentials';
import { getUserDocusignAccountsInfo } from './getUserDocusignAccountsInfo';

/**
 * Works for saving the docusign account the first time, or updating an account for a space
 */
export async function setSpaceDocusignAccount({
  docusignAccountId,
  accessToken,
  refreshToken,
  spaceId,
  userId
}: Pick<DocusignCredential, 'docusignAccountId' | 'spaceId' | 'userId'> &
  Partial<Pick<DocusignCredential, 'refreshToken' | 'accessToken'>>): Promise<DocusignCredential> {
  if (!accessToken || !refreshToken) {
    const existingCredentials = await getSpaceDocusignCredentials({ spaceId });
    refreshToken = existingCredentials.refreshToken;
    accessToken = existingCredentials.accessToken;
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (!spaceRole?.isAdmin) {
    throw new InvalidInputError('Only admin users can save credentials for the space');
  }

  const accounts = await getUserDocusignAccountsInfo({ accessToken });

  const selectedAccount = accounts.find((acc) => acc.docusignAccountId === docusignAccountId);

  if (!selectedAccount) {
    throw new InvalidInputError(`Docusign account with ${docusignAccountId} not found`);
  }

  if (!selectedAccount.isAdmin) {
    throw new InvalidInputError(`User is not an admin for docusign account ${docusignAccountId}`);
  }

  const existingCredentials = await prisma.docusignCredential.findFirst({
    where: {
      spaceId
    }
  });

  const updatedCreds = await prisma.$transaction(async (tx) => {
    if (existingCredentials) {
      await tx.docusignCredential.update({
        where: {
          id: existingCredentials.id
        },
        data: {
          accessToken,
          refreshToken,
          docusignAccountId,
          docusignAccountName: selectedAccount.docusignAccountName,
          docusignApiBaseUrl: selectedAccount.docusignApiBaseUrl
        }
      });
    } else {
      await tx.docusignCredential.create({
        data: {
          docusignAccountId,
          docusignAccountName: selectedAccount.docusignAccountName,
          docusignApiBaseUrl: selectedAccount.docusignApiBaseUrl,
          accessToken,
          refreshToken,
          userId,
          spaceId
        }
      });
    }
    const credsWithWebhook = await ensureSpaceWebhookExists({ spaceId, tx });

    return credsWithWebhook;
  });

  return updatedCreds;
}
