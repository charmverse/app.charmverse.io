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

export type DeepDaoProfile = {
  totalVotes: number
  totalProposals: number
  organizations: {
    name: string
    organizationId: string
    description: string
  }[]
  proposals: {
    title: string
    status: string
    choices: string[]
    outcome: number
    createdAt: string
    description: string
    voteChoice: number
    organizationId: string
    successfulVote: boolean
  }[]
  votes: {
    title: string
    daoId: string
    organizationId: string
    choices: string[]
    voteId: string
    createdAt: string
    successful: null | boolean
    description: string
  }[]
}

type GetParticipationScoreResponse = DeepDaoApiResponse<DeepDaoParticipationScore>
type GetProfileResponse = DeepDaoApiResponse<DeepDaoProfile>

export type DeepDaoAggregateData = Pick<DeepDaoParticipationScore, 'daos'> & Pick<DeepDaoProfile, 'organizations' | 'totalProposals' | 'totalVotes' | 'proposals' | 'votes'> & {bounties: number}

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
