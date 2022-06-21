export interface GetParticipationScoreResponse {
  data: {
    score: number
    rank: number
    relativeScore: null | number
    daos: number
    proposals: number
    votes: number
  }
}

export type DeepDaoAggregateData = Pick<GetParticipationScoreResponse['data'], 'daos' | 'proposals' | 'votes'> & {bounties: number}
