import { prisma } from '@charmverse/core/prisma-client';

import { getLeaderboard } from 'lib/builders/getLeaderboard';
import { getTopScoutsByWeek } from 'lib/scouts/getTopScouts';
import { getWeekStartEndFormatted, getDateFromISOWeek } from '@packages/scoutgame/dates';
async function query() {
  // const existingAccounts = await getUserByPath('thescoho');
  // console.log(existingAccounts);
  const week = '2024-W46';

  console.log('Retrieving leaderboard for week:', getWeekStartEndFormatted(getDateFromISOWeek(week).toJSDate()));

  const builders = await getLeaderboard({ week: week });
  console.log('Top Builders');
  console.log(
    builders.map((b, index) => `${index + 1}. https://scoutgame.xyz/u/${b.path} (${b.gemsCollected} gems)`).join('\n')
  );
  const scouts = await getTopScoutsByWeek({ week: week });
  console.log('Top Scouts');
  console.log(
    scouts.map((s, index) => `${index + 1}. https://scoutgame.xyz/u/${s.path}  (${s.pointsEarned} points)`).join('\n')
  );
}

query();
