import type { ProfileProposalEvent, ProfileVoteEvent, ProfileBountyEvent, UserCommunity } from './interfaces';

export type CommunityDetails = UserCommunity & {
  votes: ProfileVoteEvent[];
  bounties: ProfileBountyEvent[];
  proposals: ProfileProposalEvent[];
  joinDate: string;
  latestEventDate?: string;
};

interface CommunitiesData {
  communities: UserCommunity[];
  proposals: ProfileProposalEvent[];
  votes: ProfileVoteEvent[];
  bounties: ProfileBountyEvent[];
}

export function combineCommunityData(params: CommunitiesData): CommunityDetails[] {
  const { communities, bounties, votes } = params;

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

  // proposals
  //   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  //   .forEach((event) => {
  //     const organization = communityMap[event.organizationId];
  //     organization?.proposals.push(event);
  //   });

  votes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((event) => {
      const organization = communityMap[event.organizationId];
      organization?.votes.push(event);
    });

  bounties
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((event) => {
      const organization = communityMap[event.organizationId];
      organization?.bounties.push(event);
    });

  const communitiesResult = Object.values(communityMap)
    .map((community) => {
      const commEvents = [...community.proposals, ...community.votes, ...community.bounties];
      commEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      community.joinDate ||= commEvents[0]?.createdAt;
      community.latestEventDate = commEvents[commEvents.length - 1]?.createdAt;
      return community;
    })
    .sort((commA, commB) => (commA.joinDate > commB.joinDate ? -1 : 1));

  return communitiesResult;
}
