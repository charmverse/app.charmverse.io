import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';
import { safeAwaitSSRData } from 'lib/utils/async';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export const dynamic = 'force-dynamic';

export async function ScoutPageBuildersGallery({ sort, showHotIcon }: { sort: BuildersSort; showHotIcon: boolean }) {
  const [error, data] = await safeAwaitSSRData(
    getSortedBuilders({
      sort: sort as BuildersSort,
      limit: 15,
      week: getCurrentWeek(),
      season: currentSeason,
      cursor: null
    })
  );

  if (error) {
    return null;
  }

  const { builders, nextCursor } = data;

  return (
    <BuildersGalleryContainer
      sort={sort}
      initialCursor={nextCursor}
      initialBuilders={builders}
      showHotIcon={showHotIcon}
    />
  );
}
