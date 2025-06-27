import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';

import { getClient } from './authClient';
import { decryptToken, encryptToken } from './token';

type AccountRequest = {
  credentialId: string;
};

export function saveCredential({
  userId,
  name,
  refreshToken,
  scope
}: {
  userId: string;
  name: string;
  refreshToken: string;
  scope: string;
}) {
  refreshToken = encryptToken(refreshToken);

  return prisma.googleCredential.upsert({
    where: {
      userId_name: {
        userId,
        name
      }
    },
    update: {
      refreshToken,
      scope,
      error: Prisma.DbNull,
      expiredAt: null
    },
    create: {
      userId,
      name,
      scope,
      refreshToken
    }
  });
}

export async function getCredential({ credentialId }: AccountRequest) {
  return prisma.googleCredential.findUniqueOrThrow({
    where: {
      id: credentialId
    }
  });
}

export async function getCredentialToken({ credentialId }: AccountRequest) {
  const credential = await prisma.googleCredential.findUniqueOrThrow({
    where: {
      id: credentialId
    }
  });
  return decryptToken(credential.refreshToken);
}

export async function getCredentialsForUser({ userId }: { userId: string }) {
  return prisma.googleCredential.findMany({
    where: {
      userId
    }
  });
}

export async function deleteCredential({ credentialId }: AccountRequest) {
  try {
    const keys = await getCredential({ credentialId });
    const client = getClient();
    await client.revokeToken(keys.refreshToken);
  } catch (error) {
    log.warn('Was not able to revoke token from google', { error, credentialId });
  }

  await prisma.googleCredential.delete({
    where: {
      id: credentialId
    }
  });
}

export async function invalidateCredential({ credentialId, error }: AccountRequest & { error?: any }) {
  try {
    await prisma.googleCredential.update({
      where: {
        id: credentialId,
        expiredAt: null
      },
      data: {
        error,
        expiredAt: new Date()
      }
    });
    log.info('Invalidated Google credential for user', { credentialId, error });
  } catch (err) {
    // this error is expected behavior when the credential is already expired
  }
}
