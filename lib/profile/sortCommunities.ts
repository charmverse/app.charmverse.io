import type { CommunityDetails } from 'components/profile/components/CommunityRow';
import type { DeepDaoProposal, DeepDaoVote } from 'lib/deepdao/interfaces';

import type { UserCommunity } from './interfaces';

export function sortCommunities ({ communities, proposals, votes }: {
  communities: UserCommunity[];
  proposals: DeepDaoProposal[];
  votes: DeepDaoVote[];
}) {

  const organizationsRecord = communities.reduce<Record<string, CommunityDetails>>((acc, org) => {
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

  // Sort the proposals and votes based on their created at date
  const events = [...proposals.map(proposal => ({ type: 'proposal', ...proposal })), ...votes.map(vote => ({ type: 'vote', ...vote }))];

  events.forEach(event => {
    const organization = organizationsRecord[event.organizationId];
    if (organization) {
      if (event.type === 'proposal') {
        organization.proposals.push(event as DeepDaoProposal);
      }
      else if (event.type === 'vote') {
        organization.votes.push(event as DeepDaoVote);
      }
      if (!organization.joinDate) {
        organization.joinDate = event.createdAt;
      }
      else if (organization.joinDate > event.createdAt) {
        organization.joinDate = event.createdAt;
      }

      if (!organization.latestEventDate) {
        organization.latestEventDate = event.createdAt;
      }
      else if (organization.latestEventDate < event.createdAt) {
        organization.latestEventDate = event.createdAt;
      }
    }
  });

  return (Object.values(organizationsRecord)
    .sort((orgA, orgB) => orgA.joinDate > orgB.joinDate ? -1 : 1));
}
