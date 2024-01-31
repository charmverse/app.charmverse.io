import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getTrackOnChainAttestation } from 'lib/credentials/external/getExternalCredentials';
import type { ExternalCredentialChain } from 'lib/credentials/external/schemas';
import type { FavoriteCredentialPayload } from 'lib/credentials/favoriteCredential';
import { favoriteCredential } from 'lib/credentials/favoriteCredential';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(requireKeys(['favorite'], 'body'), favoriteCredentialsController);

async function favoriteCredentialsController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const payload = req.body as FavoriteCredentialPayload;
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      wallets: true
    }
  });
  const userWallets = user.wallets.map((w) => w.address);
  if (payload.issuedCredentialId) {
    const issuedCredential = await prisma.issuedCredential.findUnique({
      where: {
        id: payload.issuedCredentialId
      }
    });

    if (!issuedCredential) {
      throw new InvalidInputError(`Issued Credential not found`);
    }
  } else if (payload.attestationId) {
    const attestation = await getTrackOnChainAttestation({
      attestationId: payload.attestationId,
      chainId: payload.chainId as ExternalCredentialChain
    });
    if (!attestation || !userWallets.includes(attestation.recipient)) {
      throw new InvalidInputError(`Attestation not found`);
    }
  }

  await favoriteCredential(payload);
  return res.status(200).end();
}

export default withSessionRoute(handler);
