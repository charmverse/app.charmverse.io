import fetch from 'adapters/http/fetch.server';
import log from 'lib/log';

export const { DEEPDAO_API_KEY, DEEP_DAO_BASE_URL } = process.env;

type DeepDaoApiResponse<T> = { data: T };

interface DeepDaoParticipationScore {
  score: number
  rank: number
  relativeScore: null | number
  daos: number
  proposals: number
  votes: number
}
type GetParticipationScoreResponse = DeepDaoApiResponse<DeepDaoParticipationScore>

export type DeepDaoAggregateData = Pick<DeepDaoParticipationScore, 'daos' | 'proposals' | 'votes'> & {bounties: number}

export async function getParticipationScore (address: string, apiToken = DEEPDAO_API_KEY): Promise<GetParticipationScoreResponse | null> {
  if (!apiToken) {
    log.debug('Skip request: No API Key for DeepDAO');
    return null;
  }
  return fetch<GetParticipationScoreResponse>(`${DEEP_DAO_BASE_URL}/v0.1/people/participation_score/${address}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiToken
    }
  });
}
