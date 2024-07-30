import type { FeedItem } from 'lib/feed/getFeed';

import { RecastCard } from './RecastCard';

export function FeedCard({ item }: { item: FeedItem }) {
  if (item.object === 'recast') {
    return <RecastCard recast={item} />;
  }

  return null;
}
