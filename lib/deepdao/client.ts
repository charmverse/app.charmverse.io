import { GET } from '@charmverse/core/http';
import { log } from '@charmverse/core/log';

import { isTestEnv } from 'config/constants';

import type { DeepDaoOrganizationDetails, DeepDaoParticipationScore, DeepDaoProfile } from './interfaces';

type ApiResponse<T> = { data: T };

type GetParticipationScoreResponse = ApiResponse<DeepDaoParticipationScore>;
type GetProfileResponse = ApiResponse<DeepDaoProfile>;
export type GetOrganizationsResponse = ApiResponse<{
  totalResources: number;
  resources: DeepDaoOrganizationDetails[];
}>;

export const { DEEPDAO_API_KEY } = process.env;
export const DEEPDAO_BASE_URL = 'https://api.deepdao.io';
export async function getParticipationScore(
  address: string,
  apiToken = DEEPDAO_API_KEY
): Promise<GetParticipationScoreResponse | null> {
  // Use this address for testing as it has alot of on-chain data
  // address = '0x155b6485305ccab44ef7da58ac886c62ce105cf9';
  return _requestGET(`/people/participation_score/${address}`, { apiToken });
}

export async function getProfile(address: string, apiToken?: string): Promise<GetProfileResponse | null> {
  // Use this address for testing as it has alot of on-chain data
  // address = '0xef8305e140ac520225daf050e2f71d5fbcc543e7';
  return _requestGET(`/people/profile/${address}`, { apiToken });
}

const emptyOrgsResponse: GetOrganizationsResponse = { data: { resources: [], totalResources: 0 } };

export async function getAllOrganizations(apiToken?: string): Promise<GetOrganizationsResponse> {
  return _requestGET<GetOrganizationsResponse>('/organizations', { apiToken }).then(
    (response) => response || emptyOrgsResponse
  );
}

function _requestGET<T>(endpoint: string, { apiToken = DEEPDAO_API_KEY }: { apiToken: string | undefined }) {
  // run requests even in test mode for now (see getAggregatedData.spec.ts)
  if (isTestEnv) {
    return GET<T>(`${DEEPDAO_BASE_URL}/v0.1${endpoint}`, {});
  }
  if (!apiToken) {
    log.debug('Skip request: No API Key or URL for DeepDAO');
    return Promise.resolve(null);
  }
  return GET<T>(`${DEEPDAO_BASE_URL}/v0.1${endpoint}`, undefined, {
    headers: {
      'x-api-key': apiToken
    }
  });
}
