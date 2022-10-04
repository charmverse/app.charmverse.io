import log from 'loglevel';

import fetch from 'adapters/http/fetch.server';

import type { DeepDaoOrganizationDetails, DeepDaoParticipationScore, DeepDaoProfile } from './interfaces';

type ApiResponse<T> = { data: T };

type GetParticipationScoreResponse = ApiResponse<DeepDaoParticipationScore>;
type GetProfileResponse = ApiResponse<DeepDaoProfile>;
type GetOrganizationsResponse = ApiResponse<{
  totalResources: number;
  resources: DeepDaoOrganizationDetails[];
}>;

export const { DEEPDAO_API_KEY, DEEP_DAO_BASE_URL } = process.env;

export async function getParticipationScore (address: string, apiToken = DEEPDAO_API_KEY): Promise<GetParticipationScoreResponse | null> {
  // Use this address for testing as it has alot of on-chain data
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9';

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
  // Use this address for testing as it has alot of on-chain data
  // address = '0xef8305e140ac520225daf050e2f71d5fbcc543e7';

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

export async function getAllOrganizations (apiToken = DEEPDAO_API_KEY): Promise<GetOrganizationsResponse> {
  if (!apiToken) {
    log.debug('Skip request: No API Key for DeepDAO');
    return { data: { resources: [], totalResources: 0 } };
  }

  return fetch<GetOrganizationsResponse>(`${DEEP_DAO_BASE_URL}/v0.1/organizations`, {
    method: 'GET',
    headers: {
      'x-api-key': apiToken
    }
  });
}
