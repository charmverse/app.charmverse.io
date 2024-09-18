import { getCurrentWeek, currentSeason } from '@packages/scoutgame/utils';

import { saveBuilderEventsWithGems } from './saveBuilderEventsWithGems';
import { saveGithubEvents } from './saveGithubEvents';

export async function processPullRequests() {
  const week = getCurrentWeek();
  await saveGithubEvents();
  await saveBuilderEventsWithGems({
    season: currentSeason,
    week
  });
}
