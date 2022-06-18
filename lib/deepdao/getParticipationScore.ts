import fetch from 'node-fetch';

const { DEEPDAO_API_KEY } = process.env;

export interface GetParticipationScoreResponse {
  data: {
    score: number
    rank: number
    relativeScore: null | number
    doas: number
    proposals: number
    votes: number
  }
}

// 0xd9293636ee3aa663fc563adb0912b0705dafb62c

export async function getParticipationScore (address: string) {
  const participationScore = await ((await fetch(`https://api.deepdao.io/v0.1/people/participation_score/${address}`, {
    method: 'GET',
    headers: {
      'x-api-key': DEEPDAO_API_KEY as string
    }
  })).json()) as GetParticipationScoreResponse;

  return participationScore;
}
