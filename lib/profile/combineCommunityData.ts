import type { CommunityDetails } from 'components/profile/components/CommunityRow';
import type { DeepDaoProposal, DeepDaoVote } from 'lib/deepdao/interfaces';

import type { ProfileBountyEvent, UserCommunity } from './interfaces';

interface CommunitiesData {
  communities: UserCommunity[];
  proposals: DeepDaoProposal[];
  votes: DeepDaoVote[];
  bounties: ProfileBountyEvent[];
}

export function combineCommunityData (params: CommunitiesData): CommunityDetails[] {

  const { communities, proposals, votes, bounties } = params;

  const communityMap = communities.reduce<Record<string, CommunityDetails>>((acc, org) => {
    acc[org.id] = {
      // Using empty values to indicate that these haven't been set yet
      joinDate: '',
      latestEventDate: '',
      bounties: [],
      proposals: [],
      votes: [],
      ...org
    };
    return acc;
  }, {});

  proposals
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach(event => {
      const organization = communityMap[event.organizationId];
      organization?.proposals.push(event);
    });

  votes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach(event => {
      const organization = communityMap[event.organizationId];
      organization?.votes.push(event);
    });

  bounties
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach(event => {
      const organization = communityMap[event.organizationId];
      organization?.bounties.push(event);
    });

  const communitiesResult = Object.values(communityMap)
    .map(community => {
      const commEvents = [...community.proposals, ...community.votes, ...community.bounties];
      commEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      community.joinDate ||= commEvents[0]?.createdAt;
      community.latestEventDate = commEvents[commEvents.length - 1]?.createdAt;
      return community;
    })
    .sort((commA, commB) => commA.joinDate > commB.joinDate ? -1 : 1);

  return communitiesResult;
}
