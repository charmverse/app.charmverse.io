import type { Metadata } from 'next';

import { FeedList } from 'components/feed/FeedList';
import { getFeed } from 'lib/feed/getFeed';

export const metadata: Metadata = {
  title: 'Feed'
};

export default async function FeedPage() {
  const feed = await getFeed();
  return <FeedList feed={feed} />;
}
