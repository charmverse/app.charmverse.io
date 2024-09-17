import { DateTime } from 'luxon';

import { saveBuilderEventsWithGems } from './saveBuilderEventsWithGems';
import { saveGithubEvents } from './saveGithubEvents';

export async function processPullRequests() {
  const dt = DateTime.now();
  const isoWeekNumber = dt.weekNumber.toString();
  await saveGithubEvents();
  await saveBuilderEventsWithGems({
    season: 1,
    week: isoWeekNumber
  });
}
