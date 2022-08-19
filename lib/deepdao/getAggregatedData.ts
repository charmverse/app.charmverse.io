import { isUUID } from 'lib/utilities/strings';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { getCompletedApplicationsOfUser } from 'lib/applications/getCompletedApplicationsOfUser';
import { getSpacesCount } from 'lib/spaces/getSpacesCount';
import { isTruthy } from 'lib/utilities/types';
import log from 'lib/log';
import { getParticipationScore, DeepDaoAggregateData, getProfile, DeepDaoProfile } from './interfaces';

export async function getAggregatedData (userPath: string, apiToken?: string): Promise<DeepDaoAggregateData> {
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

  const participationScores = (await Promise.all(
    user.addresses.map(address => getParticipationScore(address, apiToken)
      .catch(error => {
        log.error('Error calling DEEP DAO API', error);
        return null;
      }))
  )).filter(isTruthy);

  const profiles = (await Promise.all(
    user.addresses.map(address => getProfile(address, apiToken)
      .catch(error => {
        log.error('Error calling DEEP DAO API', error);
        return null;
      }))
  )).filter(isTruthy);

  const [completedBountiesCount, workspacesCount, totalCharmverseVotes] = await Promise.all([
    getCompletedApplicationsOfUser(user.id),
    getSpacesCount(user.id),
    prisma.userVote.count({
      where: {
        userId: user.id
      }
    })
  ]);

  return {
    daos: workspacesCount + participationScores.reduce((acc, cur) => acc + cur.data.daos, 0),
    totalProposals: profiles.reduce((acc, profile) => acc + profile.data.totalProposals, 0),
    totalVotes: profiles.reduce((acc, profile) => acc + profile.data.totalVotes, 0),
    organizations: profiles.reduce<DeepDaoProfile['organizations']>((orgs, profile) => ([...orgs, ...profile.data.organizations]), []),
    proposals: profiles.reduce<DeepDaoProfile['proposals']>((proposals, profile) => ([...proposals, ...profile.data.proposals]), []),
    votes: profiles.reduce<DeepDaoProfile['votes']>((votes, profile) => ([...votes, ...profile.data.votes]), []),
    bounties: completedBountiesCount
  };
}
