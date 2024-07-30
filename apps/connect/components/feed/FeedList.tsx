import 'server-only';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Stack } from '@mui/system';

import type { FeedItem } from 'lib/feed/getFeed';

import { CastCard } from './CastCard';

export function FeedList({ feed }: { feed: FeedItem[] }) {
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
