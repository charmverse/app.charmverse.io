import { GET } from '@root/adapters/http';
import type { Cast } from '@root/lib/neynar/interfaces';

const neynarBaseUrl = 'https://api.neynar.com/v2/farcaster';

type Reaction = {
  reaction_type: 'like' | 'cast';
  cast: Cast;
  reaction_timestamp: string;
  object: 'likes' | 'recasts';
};

type UserReactionsResponse = {
  reactions: Reaction[];
  next: {
    cursor: string | null;
  };
};

export async function getFarcasterUserReactions({ fid }: { fid: number }): Promise<Reaction[]> {
  const userReactionsResponse = await GET<UserReactionsResponse>(
    `${neynarBaseUrl}/reactions/user`,
    {
      fid,
      type: 'all'
    },
    {
      headers: {
        Api_key: process.env.NEYNAR_API_KEY
      }
    }
  );

  return userReactionsResponse.reactions;
}
