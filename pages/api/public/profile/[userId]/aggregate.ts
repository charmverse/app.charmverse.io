import type { AggregatedProfileData } from '@packages/profile/getAggregatedData';
import { getAggregatedData } from '@packages/profile/getAggregatedData';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getAggregatedDataHandler);

async function getAggregatedDataHandler(req: NextApiRequest, res: NextApiResponse<AggregatedProfileData>) {
  const aggregatedData = await getAggregatedData(req.query.userId as string);
  return res.status(200).json(aggregatedData);
}

export default withSessionRoute(handler);
