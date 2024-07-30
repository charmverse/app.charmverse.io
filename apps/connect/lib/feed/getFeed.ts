import type { Cast } from './getFarcasterUserReactions';
import { getFarcasterUserReactions } from './getFarcasterUserReactions';

export type FeedItem = { type: 'recast' | 'like' | 'cast'; cast: Cast };

export async function getFeed(): Promise<FeedItem[]> {
  const recasts = await getFarcasterUserReactions();
  return [...recasts.map((recast): FeedItem => ({ type: recast.reaction_type, cast: recast.cast }))];
}
