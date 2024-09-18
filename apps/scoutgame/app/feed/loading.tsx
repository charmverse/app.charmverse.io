import { SinglePageWrapper } from 'components/common/SinglePageWrapper';
import { FeedListSkeleton } from 'components/feed/components/FeedListSkeleton';

export default function Loading() {
  return (
    <SinglePageWrapper>
      <FeedListSkeleton />
    </SinglePageWrapper>
  );
}
