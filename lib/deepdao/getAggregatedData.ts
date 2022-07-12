import { isUUID } from 'lib/utilities/strings';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { getCompletedApplicationsOfUser } from 'lib/applications/getCompletedApplicationsOfUser';
import { getSpacesCount } from 'lib/spaces/getSpacesCount';
import { getParticipationScore } from './getParticipationScore';
import { DeepDaoAggregateData } from './interfaces';

export async function getAggregatedData (userPath: string): Promise<DeepDaoAggregateData> {
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

  const completedBountiesCount = await getCompletedApplicationsOfUser(user.id);
  const workspacesCount = await getSpacesCount(user.id);
  const totalCharmverseVotes = await prisma.userVote.count({
    where: {
      userId: user.id
    }
  });
  return {
    daos: workspacesCount + participationScores.reduce((acc, cur) => acc + cur.data.daos, 0),
    proposals: participationScores.reduce((acc, cur) => acc + cur.data.proposals, 0),
    votes: participationScores.reduce((acc, cur) => acc + cur.data.votes, 0) + totalCharmverseVotes,
    bounties: completedBountiesCount
  };
}
