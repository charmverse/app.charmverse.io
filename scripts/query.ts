import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function query() {
  const w = await prisma.scout.findFirst({ where: { path: 'matt_eth' } });
  const x = await prisma.githubUser.findFirst({ where: { login: 'mattcasey' } });

  console.log(x);
  await prisma.githubUser.update({
    where: {
      id: x.id
    },
    data: {
      builderId: w.id
    }
  });
  await prisma.scout.update({
    where: {
      id: w.id
    },
    data: {
      builderStatus: 'applied'
    }
  });
}

query();
