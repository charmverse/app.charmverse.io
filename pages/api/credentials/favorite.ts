import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { FavoriteCredentialPayload } from 'lib/credentials/favoriteCredential';
import { favoriteCredential } from 'lib/credentials/favoriteCredential';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(requireKeys(['favorite'], 'body'), favoriteCredentialsController);

async function favoriteCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const payload = req.body as FavoriteCredentialPayload;

  if (!payload.attestationId && !payload.issuedCredentialId) {
    throw new InvalidInputError(`Either Attestation ID or Issued Credential ID must be provided`);
  }

  const issuedCredential = payload.issuedCredentialId
    ? await prisma.issuedCredential.findUnique({
        where: {
          id: payload.issuedCredentialId,
          userId
        }
      })
    : null;

  if (!issuedCredential) {
    // TODO: How can we make sure that the user owns the attestation without fetching all the onchain attestations that the user owns?
    // throw new InvalidInputError(`Issued Credential not found`);
  }

  await favoriteCredential(payload);
  return res.status(200).end();
}

export default withSessionRoute(handler);
