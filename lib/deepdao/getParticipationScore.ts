import fetch from 'node-fetch';
import { DeepDaoGetParticipationScoreResponse } from './interfaces';

const { DEEPDAO_API_KEY } = process.env;

export async function getParticipationScore (address: string) {
  const participationScore = await ((await fetch(`https://api.deepdao.io/v0.1/people/participation_score/${address}`, {
    method: 'GET',
    headers: {
      'x-api-key': DEEPDAO_API_KEY as string
    }
  })).json()) as DeepDaoGetParticipationScoreResponse;

  return participationScore;
}
