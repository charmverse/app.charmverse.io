import { prisma } from 'db';
import log from 'lib/log';

import { getClient } from '../authClient';

type AccountRequest = {
  credentialId: string;
};

export async function getCredential({ credentialId }: AccountRequest) {
  return prisma.googleCredential.findUniqueOrThrow({
    where: {
      id: credentialId
    }
  });
}

// get credentials without throwing an error
export async function getCredentialMaybe({ credentialId }: AccountRequest) {
  const creds = await prisma.googleCredential.findUnique({
    where: {
      id: credentialId
    }
  });
  if (!creds ?? creds?.expiredAt) {
    log.warn('No valid credentials found for account', { credentialId, expiredAt: creds?.expiredAt });
    return null;
  }
  return creds;
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
