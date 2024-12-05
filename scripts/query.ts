import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

import { refreshShareImage } from '@packages/scoutgame/builders/refreshShareImage';
import { getCommitsByUser } from '@packages/github/getCommitsByUser';
const afterDate = DateTime.utc().minus({ months: 3 }).toJSDate();

async function query() {
  const builderNft = await prisma.builderNft.findFirstOrThrow({
    where: {
      builder: {
        path: 'mattcasey'
      }
    }
  });
  await refreshShareImage(builderNft);
}

query();
