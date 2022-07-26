import fetch from 'adapters/http/fetch.server';
import log from 'lib/log';
import { DeepDaoGetParticipationScoreResponse } from './interfaces';

const { DEEPDAO_API_KEY } = process.env;

export async function getParticipationScore (address: string): Promise<DeepDaoGetParticipationScoreResponse | null> {
  if (!DEEPDAO_API_KEY) {
    log.debug('Skip request: No API Key for DeepDAO');
    return null;
  }
  return fetch<DeepDaoGetParticipationScoreResponse>(`https://api.deepdao.io/v0.1/people/participation_score/${address}`, {
    method: 'GET',
    headers: {
      'x-api-key': DEEPDAO_API_KEY
    }
  });
}
