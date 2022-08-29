
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

export type GetParticipationScoreResponse = DeepDaoApiResponse<DeepDaoParticipationScore>
export type GetProfileResponse = DeepDaoApiResponse<DeepDaoProfile>

export type DeepDaoAggregateData = Pick<DeepDaoParticipationScore, 'daos'> & Pick<DeepDaoProfile, 'organizations' | 'totalProposals' | 'totalVotes' | 'proposals' | 'votes'> & {bounties: number}
