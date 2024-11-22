import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

import { getCommitsByUser } from '@packages/github/getCommitsByUser';
const afterDate = DateTime.utc().minus({ months: 3 }).toJSDate();
const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function query() {
  const scouts = await prisma.scout.findMany({ where: { builderStatus: 'applied' }, include: { githubUser: true } });
  console.log(scouts.length);
  let rejected = 0;
  for (const scout of scouts) {
    const commits = await getCommitsByUser({ login: scout.githubUser[0].login, after: afterDate });
    console.log(commits.length);
    if (commits.length === 0) {
      // await prisma.scout.update({ where: { id: scout.id }, data: { builderStatus: 'rejected' } });
      rejected++;
      console.log(`Rejected ${scout.githubUser[0].login}`);
    } else {
      console.log(`Accepted ${scout.githubUser[0].login}`);
    }
  }
  console.log(`Rejected ${rejected} scouts`);
}

query();
