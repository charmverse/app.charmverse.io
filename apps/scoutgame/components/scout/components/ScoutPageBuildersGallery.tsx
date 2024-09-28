import { currentSeason, getCurrentWeek } from '@packages/scoutgame/dates';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import type { BuildersSort } from 'lib/builders/getSortedBuilders';
import { getSortedBuilders } from 'lib/builders/getSortedBuilders';

export const dynamic = 'force-dynamic';

export async function ScoutPageBuildersGallery({
  sort,
  user,
  showHotIcon
}: {
  sort: string;
  showHotIcon: boolean;
  user?: { username: string; id: string } | null;
}) {
  const builders = await getSortedBuilders({
    sort: sort as BuildersSort,
    limit: 10,
    week: getCurrentWeek(),
    season: currentSeason
  });

  return <BuildersGallery builders={builders} user={user} showHotIcon={showHotIcon} />;
}
