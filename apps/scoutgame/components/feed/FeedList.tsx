import 'server-only';
import { Stack } from '@mui/material';

import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import type { FeedItem } from 'lib/feed/getFeed';

import { CastCard } from './components/CastCard';

export function FeedList({ feed }: { feed: FeedItem[] }) {
  return (
    <SinglePageWrapper>
      <Stack gap={1}>
        {feed.map((feedItem) => (
          <CastCard key={feedItem.cast.hash} item={feedItem} />
        ))}
      </Stack>
    </SinglePageWrapper>
  );
}
