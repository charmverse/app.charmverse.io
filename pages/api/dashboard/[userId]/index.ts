
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { getParticipationScore } from 'lib/deepdao/getParticipationScore';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getAggregatedDashboardData);

async function getAggregatedDashboardData (req: NextApiRequest, res: NextApiResponse<any>) {
  const { userId } = req.query;
  const user = await prisma.user.findUnique({
    where: {
      id: userId as string
    }
  });

  if (!user) {
    throw new DataNotFoundError();
  }

  if (user.addresses.length === 0) {
    throw new DataNotFoundError();
  }

  const participationScore = await getParticipationScore(user.addresses[0]);

  return res.status(200).json(participationScore.data);
}

export default withSessionRoute(handler);
