import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export const dynamic = 'force-dynamic';

export async function ScoutPageBuildersGallery({
  sort,
  showHotIcon,
  userId
}: {
  sort: BuildersSort;
  showHotIcon: boolean;
  userId?: string;
}) {
  const { builders, nextCursor } = await getSortedBuilders({
    sort: sort as BuildersSort,
    limit: 15,
    week: getCurrentWeek(),
    season: currentSeason
  });
  return (
    <BuildersGalleryContainer
      sort={sort}
      initialCursor={nextCursor}
      initialBuilders={builders}
      showHotIcon={showHotIcon}
      userId={userId}
    />
  );
}
