import type { SynapsCredential } from '@charmverse/core/dist/cjs/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { deleteSynapsCredential } from 'lib/kyc/deleteSynapsCredential';
import { getSynapsCredentials } from 'lib/kyc/getSynapsCredentials';
import { upsertSynapsCredential } from 'lib/kyc/upsertSynapsCredential';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getKycCredentials)
  .use(requirePaidPermissionsSubscription({ key: 'id', resourceIdType: 'space' }))
  .post(upsertKycCredentials)
  .delete(deleteKycCredentials);

async function upsertKycCredentials(req: NextApiRequest, res: NextApiResponse<SynapsCredential | null>) {
  const spaceId = req.query.id as string;
  const payload = req.body as Omit<SynapsCredential, 'id' | 'spaceId'>;

  const data = await upsertSynapsCredential({ ...payload, spaceId });

  res.status(200).json(data);
}

async function deleteKycCredentials(req: NextApiRequest, res: NextApiResponse<void>) {
  const spaceId = req.query.id as string;

  await deleteSynapsCredential({ spaceId });

  res.status(200).end();
}

async function getKycCredentials(req: NextApiRequest, res: NextApiResponse<SynapsCredential | null>) {
  const spaceId = req.query.id as string;

  const synapsCredentials = await getSynapsCredentials(spaceId);

  res.status(200).json(synapsCredentials);
}

export default withSessionRoute(handler);
