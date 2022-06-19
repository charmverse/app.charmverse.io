
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { getParticipationScore } from 'lib/deepdao/getParticipationScore';
import { GetParticipationScoreResponse } from 'lib/deepdao/interfaces';
import { getCompletedApplicationsOfUser } from 'lib/applications/getCompletedApplicationsOfUser';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getAggregatedData);

async function getAggregatedData (req: NextApiRequest, res: NextApiResponse<GetParticipationScoreResponse['data'] & {bounties: number}>) {
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
  const completedBounties = await getCompletedApplicationsOfUser(user.id);

  return res.status(200).json({
    ...participationScore.data,
    bounties: completedBounties
  });
}

export default withSessionRoute(handler);
