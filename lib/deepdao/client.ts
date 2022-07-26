import fetch from 'adapters/http/fetch.server';
import log from 'lib/log';

const { DEEPDAO_API_KEY } = process.env;
export const DEEP_DAO_BASE_URL = 'https://api.deepdao.io/v0.1';

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

export async function getParticipationScore (address: string, apiToken = DEEPDAO_API_KEY): Promise<DeepDaoGetParticipationScoreResponse | null> {
  if (!apiToken) {
    log.debug('Skip request: No API Key for DeepDAO');
    return null;
  }
  return fetch<DeepDaoGetParticipationScoreResponse>(`${DEEP_DAO_BASE_URL}/people/participation_score/${address}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiToken
    }
  });
}
