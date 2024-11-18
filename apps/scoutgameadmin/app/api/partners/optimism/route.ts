import { getLastWeek } from '@packages/scoutgame/dates';
import { getRankedNewScoutsForPastWeek } from '@packages/scoutgame/scouts/getNewScouts';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const scouts = await getRankedNewScoutsForPastWeek({
    week: lastWeek
  });

  const rows = scouts.slice(0, 10).map((scout) => ({
    Path: `https://scoutgame.xyz/u/${scout.path}`,
    'Display Name': scout.displayName,
    'Points Earned': scout.pointsEarned,
    Wallet: scout.scoutWallet?.[0]?.address
  }));

  return respondWithTSV(rows, `partners-export_optimism_new_scouts_${lastWeek}.tsv`);
}
