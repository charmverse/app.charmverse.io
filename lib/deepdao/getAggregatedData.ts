import { isUUID } from 'lib/utilities/strings';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { getCompletedApplicationsOfUser } from 'lib/applications/getCompletedApplicationsOfUser';
import { getParticipationScore } from './getParticipationScore';

export async function getAggregatedData (userPath: string) {
  const user = await prisma.user.findFirst({
    where: isUUID(userPath as string) ? {
      id: userPath as string
    } : {
      path: userPath as string
    }
  });

  if (!user) {
    throw new DataNotFoundError();
  }

  const participationScores = user.addresses.length !== 0 ? await Promise.all(user.addresses.map(address => getParticipationScore(address))) : [];

  const completedBounties = await getCompletedApplicationsOfUser(user.id);

  return {
    daos: participationScores.reduce((acc, cur) => acc + cur.data.daos, 0),
    proposals: participationScores.reduce((acc, cur) => acc + cur.data.proposals, 0),
    votes: participationScores.reduce((acc, cur) => acc + cur.data.votes, 0),
    bounties: completedBounties
  };
}
