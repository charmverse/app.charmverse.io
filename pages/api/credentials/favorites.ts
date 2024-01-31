import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .put(reorderFavoriteCredentialsHandler)
  .delete(removeFavoriteCredential)
  .post(addFavoriteCredential);

export type AddFavoriteCredentialPayload = {
  attestationId?: string;
  chainId: number;
  issuedCredentialId?: string;
};

async function addFavoriteCredential(req: NextApiRequest, res: NextApiResponse) {
  const payload = req.body as AddFavoriteCredentialPayload;
  if (!payload.attestationId && !payload.issuedCredentialId) {
    throw new InvalidInputError('Either attestationId or issuedCredentialId must be provided');
  }
  const favoriteCredential = await prisma.favoriteCredential.create({
    data: {
      attestationId: payload.attestationId,
      chainId: payload.chainId,
      issuedCredentialId: payload.issuedCredentialId
    }
  });
  return res.status(200).send({
    index: favoriteCredential.index,
    favoriteCredentialId: favoriteCredential.id
  });
}

async function removeFavoriteCredential(req: NextApiRequest, res: NextApiResponse) {
  const favoriteCredentialId = req.query.favoriteCredentialId as string;
  await prisma.favoriteCredential.delete({
    where: {
      id: favoriteCredentialId
    }
  });

  return res.status(200).end();
}

export type ReorderFavoriteCredentialsPayload = {
  id: string;
  index: number;
}[];

async function reorderFavoriteCredentialsHandler(req: NextApiRequest, res: NextApiResponse) {
  const favoriteCredentials = req.body as ReorderFavoriteCredentialsPayload;

  await prisma.$transaction(
    favoriteCredentials.map((favoriteCredential) =>
      prisma.favoriteCredential.update({
        where: {
          id: favoriteCredential.id
        },
        data: {
          index: favoriteCredential.index
        }
      })
    )
  );

  return res.status(200).end();
}

export default withSessionRoute(handler);
