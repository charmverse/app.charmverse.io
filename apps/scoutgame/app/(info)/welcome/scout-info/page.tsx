import { currentSeason } from '@packages/scoutgame/dates';
import { getBuildersByFid } from '@packages/scoutgame/social/getBuildersByFid';
import { safeAwaitSSRData } from '@packages/scoutgame/utils/async';
import type { Metadata } from 'next';

import { ScoutInfoPage } from 'components/welcome/scout-info/ScoutInfoPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Welcome'
};

export default async function ScoutInfo() {
  // FID of the builder that we want to show in the ScoutInfoPage
  const builderfId = 547807;
  const [, builderByFid] = await safeAwaitSSRData(
    getBuildersByFid({ fids: [builderfId], limit: 1, season: currentSeason })
  );
  const builder = builderByFid?.builders?.at(0);

  if (!builder) {
    return null;
  }

  return <ScoutInfoPage builder={builder} />;
}
