
type DeepDaoApiResponse<T> = { data: T };

interface DeepDaoParticipationScore {
  score: number
  rank: number
  relativeScore: null | number
  daos: number
  proposals: number
  votes: number
}

export type DeepDaoOrganization = {
  name: string
  organizationId: string
  logo: string | null
}

export type DeepDaoProposal = {
  title: string
  status: string
  choices: string[]
  outcome: number
  createdAt: string
  description: string
  voteChoice: number
  organizationId: string
  successfulVote: boolean
  proposalId: string
}

export type DeepDaoVote = {
  title: string
  organizationId: string
  voteId: string
  createdAt: string
  successful: null | boolean
  description: string
}

export type DeepDaoProfile = {
  totalVotes: number
  totalProposals: number
  organizations: DeepDaoOrganization[]
  proposals: DeepDaoProposal[]
  votes: DeepDaoVote[]
}

export interface DeepDaoOrganizationDetails {
  organizationId: string,
  name: string,
  description: string,
  logo: string | null,
  members: 21,
  activeMembers: 0,
  proposals: 1,
  votes: 20,
  tokens: string[],
  governance:
    {
      platform: string,
      id: string,
      name: string,
      address: string
    }[],
    updatedAt: string
}

export type GetParticipationScoreResponse = DeepDaoApiResponse<DeepDaoParticipationScore>
export type GetProfileResponse = DeepDaoApiResponse<DeepDaoProfile>
export type GetAllDeepDaoOrganizationsResponse = DeepDaoApiResponse<{
  totalResources: number
  resources: DeepDaoOrganizationDetails[]
}>;

export type DeepDaoAggregateData = Pick<DeepDaoProfile, 'organizations' | 'totalProposals' | 'totalVotes' | 'proposals' | 'votes'> & { bounties: number }
