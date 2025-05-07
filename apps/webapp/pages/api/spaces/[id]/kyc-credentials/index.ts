import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { KycCredentials } from '@packages/lib/kyc/getKycCredentials';
import { getKycCredentials } from '@packages/lib/kyc/getKycCredentials';
import { upsertKycCredentials } from '@packages/lib/kyc/upsertKycCredentials';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .get(getKycCredentialsHandler)
  .post(requireKeys(['synaps', 'persona'], 'body'), upsertKycCredentialsHandler);

async function upsertKycCredentialsHandler(req: NextApiRequest, res: NextApiResponse<KycCredentials | null>) {
  const spaceId = req.query.id as string;
  const payload = req.body as KycCredentials;

  const data = await upsertKycCredentials({ ...payload, spaceId });

  res.status(200).json(data);
}

async function getKycCredentialsHandler(req: NextApiRequest, res: NextApiResponse<KycCredentials>) {
  const spaceId = req.query.id as string;

  const kycCredentials = await getKycCredentials(spaceId);

  res.status(200).json(kycCredentials);
}

export default withSessionRoute(handler);
