import { PageWrapper } from '@connect-shared/components/common/PageWrapper';

import { FeedListSkeleton } from 'components/feed/components/FeedListSkeleton';

export default function Loading() {
  return (
    <PageWrapper>
      <FeedListSkeleton />
    </PageWrapper>
  );
}
