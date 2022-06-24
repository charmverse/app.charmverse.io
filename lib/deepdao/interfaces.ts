export type DeepDaoApiResponse<T> = {data: T};

export interface DeepDaoParticipationScore {
  score: number
  rank: number
  relativeScore: null | number
  daos: number
  proposals: number
  votes: number
}
export type DeepDaoGetParticipationScoreResponse = DeepDaoApiResponse<DeepDaoParticipationScore>

export type DeepDaoAggregateData = Pick<DeepDaoParticipationScore, 'daos' | 'proposals' | 'votes'> & {bounties: number}
