import type { Recast } from './getFarcasterUserRecasts';
import { getFarcasterUserRecasts } from './getFarcasterUserRecasts';

export type FeedItem = Recast;

export async function getFeed(): Promise<FeedItem[]> {
  const recasts = await getFarcasterUserRecasts();
  return [...recasts];
}
