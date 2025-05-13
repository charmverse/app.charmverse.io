import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getCredentialsFromGoogleCode } from '@packages/lib/google/authorization/authClient';
import {
  deleteCredential,
  getCredentialsForUser,
  saveCredential
} from '@packages/lib/google/authorization/credentials';
import { validateFormScopes } from '@packages/lib/google/forms/validateFormScopes';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

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
  const query = req.body as CreateCredentialRequest;

  if (!query.code) {
    throw new InvalidInputError('Code is required');
  }
  if (!validateFormScopes(query.scope)) {
    throw new InvalidInputError('Required scopes are missing');
  }
  const credential = await getCredentialsFromGoogleCode(query.code);
  if (!credential?.tokens.refresh_token) {
    throw new InvalidInputError('No refresh token found');
  }
  if (!credential?.email) {
    throw new InvalidInputError('No email found');
  }
  const { id, name } = await saveCredential({
    name: credential.email,
    refreshToken: credential.tokens.refresh_token,
    scope: query.scope,
    userId: req.session.user.id
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

  // Remove req.body check after browser update - 06/2023
  const query = (req.query || req.body) as CredentialRequest;

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
