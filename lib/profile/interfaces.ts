export type ProfileProposalEvent = {
  title: string;
  status: string;
  choices: string[];
  outcome: number;
  createdAt: string;
  description: string;
  voteChoice: number;
  organizationId: string;
  successfulVote: boolean;
  proposalId: string;
};

export type ProfileVoteEvent = {
  title: string;
  organizationId: string;
  voteId: string;
  createdAt: string;
  successful: null | boolean;
  description: string;
};

type DeepDaoOrganization = {
  name: string;
  organizationId: string;
  isHidden: boolean;
  logo: string | null;
};

export type DeepDaoProfile = {
  totalVotes: number;
  totalProposals: number;
  organizations: DeepDaoOrganization[];
  proposals: ProfileProposalEvent[];
  votes: ProfileVoteEvent[];
};

export type UserCommunity = {
  id: string;
  name: string;
  isHidden: boolean;
  isPinned: boolean;
  logo: string | null;
  walletId: string | null;
};

export type ProfileBountyEvent = {
  bountyId: string;
  bountyPath: string;
  createdAt: string;
  organizationId: string;
  eventName: 'bounty_created' | 'bounty_started' | 'bounty_completed';
  bountyTitle?: string;
  hasCredential?: boolean;
};

export type CommunityDetails = UserCommunity & {
  votes: ProfileVoteEvent[];
  bounties: ProfileBountyEvent[];
  proposals: ProfileProposalEvent[];
  joinDate: string;
  latestEventDate?: string;
};
