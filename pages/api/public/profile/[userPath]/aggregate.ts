
import { getAggregatedData } from 'lib/deepdao/getAggregatedData';
import { GetParticipationScoreResponse } from 'lib/deepdao/interfaces';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getAggregatedDataHandler);

async function getAggregatedDataHandler (req: NextApiRequest, res: NextApiResponse<Pick<GetParticipationScoreResponse['data'], 'daos' | 'proposals' | 'votes'> & {bounties: number}>) {
  const aggregatedData = await getAggregatedData(req.query.userPath as string);
  return res.status(200).json(aggregatedData);
}

export default withSessionRoute(handler);
