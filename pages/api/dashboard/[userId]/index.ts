
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

async function getAggregatedData (req: NextApiRequest, res: NextApiResponse<Pick<GetParticipationScoreResponse['data'], 'daos' | 'proposals' | 'votes'> & {bounties: number}>) {
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

  const participationScores = await Promise.all(user.addresses.map(address => getParticipationScore(address)));

  const completedBounties = await getCompletedApplicationsOfUser(user.id);

  return res.status(200).json({
    daos: participationScores.reduce((acc, cur) => acc + cur.data.daos, 0),
    proposals: participationScores.reduce((acc, cur) => acc + cur.data.proposals, 0),
    votes: participationScores.reduce((acc, cur) => acc + cur.data.votes, 0),
    bounties: completedBounties
  });
}

export default withSessionRoute(handler);
