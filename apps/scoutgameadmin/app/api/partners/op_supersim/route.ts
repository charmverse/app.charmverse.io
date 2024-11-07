import { getLastWeek } from '@packages/scoutgame/dates';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';
import { getBuildersForPartner } from 'lib/partners/getBuildersForPartner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const lastWeek = getLastWeek();
  const rows = await getBuildersForPartner({
    week: lastWeek,
    bonusPartner: 'op_supersim'
  });

  return respondWithTSV(rows, `partners-export_supersim_${lastWeek}.tsv`);
}
