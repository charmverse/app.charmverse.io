import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';

import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export const dynamic = 'force-dynamic';

export async function ScoutPageBuildersGallery({ sort, showHotIcon }: { sort: BuildersSort; showHotIcon: boolean }) {
  const [error, data] = await safeAwaitSSRData(
    getSortedBuilders({
      sort: sort as BuildersSort,
      limit: 30,
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
