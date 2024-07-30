import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Stack } from '@mui/material';
import type { Metadata } from 'next';

import { FeedCard } from 'components/feed/FeedCard';
import { getFeed } from 'lib/feed/getFeed';

export const metadata: Metadata = {
  title: 'Feed'
};

export default async function FeedPage() {
  const feed = await getFeed();
  return (
    <PageWrapper>
      <Stack gap={1}>
        {feed.map((feedItem) => (
          <FeedCard key={feedItem.hash} item={feedItem} />
        ))}
      </Stack>
    </PageWrapper>
  );
}
