import { getFarcasterUserCasts } from './getFarcasterUserCasts';
import type { Cast } from './getFarcasterUserReactions';
import { getFarcasterUserReactions } from './getFarcasterUserReactions';

export type FeedItem = { type: 'recast' | 'like' | 'cast'; cast: Cast };

export async function getFeed(): Promise<FeedItem[]> {
  const userReactions = await getFarcasterUserReactions({
    fid: 1501
  });
  const userCasts = await getFarcasterUserCasts({
    fid: 1501
  });
  return [
    ...userReactions.map((reaction): FeedItem => ({ type: reaction.reaction_type, cast: reaction.cast })),
    ...userCasts.map((cast): FeedItem => ({ type: 'cast', cast }))
  ].sort((a, b) => new Date(b.cast.timestamp).getTime() - new Date(a.cast.timestamp).getTime());
}
