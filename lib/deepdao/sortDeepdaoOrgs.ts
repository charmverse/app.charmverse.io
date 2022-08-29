import type { OrganizationDetails } from 'components/profile/components/DeepDaoOrganizationRow';
import { isTruthy } from 'lib/utilities/types';
import { DeepDaoOrganization, DeepDaoProposal, DeepDaoVote } from './interfaces';

export function sortDeepdaoOrgs ({ organizations, proposals, votes }: {
  organizations: DeepDaoOrganization[],
  proposals: DeepDaoProposal[],
  votes: DeepDaoVote[]
}) {

  const organizationsRecord = organizations.reduce<Record<string, OrganizationDetails | undefined>>((acc, org) => {
    acc[org.organizationId] = {
      // Using empty values to indicate that these haven't been set yet
      joinDate: '',
      latestEventDate: '',
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

  // Remove the organizations that have not votes or proposals, so there wont be any latest or earliest dates
  return (Object.values(organizationsRecord)
    .filter(isTruthy)
    .sort((orgA, orgB) => orgA.joinDate > orgB.joinDate ? -1 : 1));
}
