import { Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getCredentialsFromGoogleCode } from 'lib/google/authorization/authClient';
import { deleteCredential, getCredentialsForUser } from 'lib/google/authorization/credentials';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors/errors';

export type CreateCredentialRequest = {
  code: string;
  scope: string;
};

export type CredentialRequest = {
  credentialId: string;
};

export type CredentialItem = {
  id: string;
  name: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createCredentialEndpoint).get(getCredentialEndpoint).delete(deleteCredentialEndpoint);

async function createCredentialEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;

  const query = req.body as CreateCredentialRequest;
  const credential = await getCredentialsFromGoogleCode(query.code);
  if (!credential?.tokens.refresh_token) {
    throw new InvalidInputError('No refresh token found');
  }
  if (!credential?.email) {
    throw new InvalidInputError('No email found');
  }
  const { id, name } = await prisma.googleCredential.upsert({
    where: {
      userId_name: {
        userId,
        name: credential.email
      }
    },
    update: {
      refreshToken: credential.tokens.refresh_token,
      scope: query.scope,
      error: Prisma.DbNull,
      expiredAt: null
    },
    create: {
      userId,
      name: credential.email,
      scope: query.scope,
      refreshToken: credential.tokens.refresh_token
    }
  });

  const response: CredentialItem = {
    id,
    name
  };

  res.send(response);
}

async function getCredentialEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;

  const creds = await getCredentialsForUser({
    userId
  });

  const credentials: CredentialItem[] = creds.map((cred) => ({
    id: cred.id,
    name: cred.name
  }));

  res.send(credentials);
}

async function deleteCredentialEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;

  const query = req.body as CredentialRequest;

  if (!query.credentialId) {
    throw new InvalidInputError('Credential id is required');
  }

  // make sure the credential exists and that this user has permission
  await prisma.googleCredential.findFirstOrThrow({
    where: {
      userId,
      id: query.credentialId
    }
  });

  await deleteCredential({ credentialId: query.credentialId });

  res.status(200).end();
}

export default withSessionRoute(handler);
