
import { getAggregatedData, AggregateProfileData } from 'lib/profile/getAggregatedData';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getAggregatedDataHandler);

async function getAggregatedDataHandler (req: NextApiRequest, res: NextApiResponse<AggregateProfileData>) {
  const aggregatedData = await getAggregatedData(req.query.userPath as string);
  return res.status(200).json(aggregatedData);
}

export default withSessionRoute(handler);
