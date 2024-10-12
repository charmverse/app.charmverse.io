import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function query() {
  const w = await prisma.proposalMyWorkColumn.create({
    data: {
      formFieldId: '36635e9d-d6ad-4341-a4b4-477af32c2eec',
      spaceId: 'fedf2aab-260c-4540-a8c3-8857dbb5ee40'
    }
  });

  console.log(w);
}

query();
