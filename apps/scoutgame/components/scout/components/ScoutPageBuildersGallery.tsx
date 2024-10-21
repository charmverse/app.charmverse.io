import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export const dynamic = 'force-dynamic';

export async function ScoutPageBuildersGallery({ sort, showHotIcon }: { sort: BuildersSort; showHotIcon: boolean }) {
  const { builders, nextCursor } = await getSortedBuilders({
    sort: sort as BuildersSort,
    limit: 15,
    week: getCurrentWeek(),
    season: currentSeason,
    cursor: null
  });
  return (
    <BuildersGalleryContainer
      sort={sort}
      initialCursor={nextCursor}
      initialBuilders={builders}
      showHotIcon={showHotIcon}
    />
  );
}
