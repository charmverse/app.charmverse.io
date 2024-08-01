import { log } from '@charmverse/core/log';
import type { Metadata } from 'next';

import { FeedList } from 'components/feed/FeedList';
import type { FeedItem } from 'lib/feed/getFeed';
import { getFeed } from 'lib/feed/getFeed';

export const metadata: Metadata = {
  title: 'Feed'
};

export default async function FeedPage() {
  let feed: FeedItem[] = [];
  try {
    feed = await getFeed();
  } catch (error) {
    log.error('Error retrieving feed', { error });
  }
  return <FeedList feed={feed} />;
}
