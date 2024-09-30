import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

import { BuildersGalleryContainer } from './BuildersGalleryContainer';

export const dynamic = 'force-dynamic';

export async function ScoutPageBuildersGallery({ sort, showHotIcon }: { sort: string; showHotIcon: boolean }) {
  const builders = await getSortedBuilders({
    sort: sort as BuildersSort,
    limit: 10,
    week: getCurrentWeek(),
    season: currentSeason
  });

  return <BuildersGalleryContainer builders={builders} showHotIcon={showHotIcon} />;
}
