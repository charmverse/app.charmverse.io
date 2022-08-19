import log from 'loglevel';
import fetch from 'adapters/http/fetch.server';
import { GetParticipationScoreResponse, GetProfileResponse } from './interfaces';

export const { DEEPDAO_API_KEY, DEEP_DAO_BASE_URL } = process.env;

export async function getParticipationScore (address: string, apiToken = DEEPDAO_API_KEY): Promise<GetParticipationScoreResponse | null> {
  address = '0xef8305e140ac520225daf050e2f71d5fbcc543e7';

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

export async function getProfile (address: string, apiToken = DEEPDAO_API_KEY): Promise<GetProfileResponse | null> {
  if (!apiToken) {
    log.debug('Skip request: No API Key for DeepDAO');
    return null;
  }

  return fetch<GetProfileResponse>(`${DEEP_DAO_BASE_URL}/v0.1/people/profile/${address}`, {
    method: 'GET',
    headers: {
      'x-api-key': apiToken
    }
  });
}
