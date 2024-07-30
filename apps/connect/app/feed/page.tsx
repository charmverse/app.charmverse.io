import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Stack } from '@mui/material';
import type { Metadata } from 'next';

import { CastCard } from 'components/feed/CastCard';
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
          <CastCard key={feedItem.cast.hash} item={feedItem} />
        ))}
      </Stack>
    </PageWrapper>
  );
}
