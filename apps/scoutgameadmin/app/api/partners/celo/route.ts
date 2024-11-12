import { getLastWeek } from '@packages/scoutgame/dates';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getBuildersForPartner } from 'lib/partners/getBuildersForPartner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const rows = await getBuildersForPartner({
    week: lastWeek,
    bonusPartner: 'celo'
  });

  return respondWithTSV(rows, `partners-export_celo_${lastWeek}.tsv`);
}
