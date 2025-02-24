import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from '@packages/utils/strings';
import { mergeProfiles } from '@packages/users/mergeProfiles';
import { DateTime } from 'luxon';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

/***
 *
 * WARNING!!!!!!!!!!
 * There is no way to revert this operation. Make sure you have the accounts correct and review mergeProfiles.ts before running
 *
 */

async function merge() {
  const primary = await prisma.user.findFirstOrThrow({
    where: {
      wallets: {
        some: {
          ensname: 'brichis.eth'
        }
      }
    }
  });
  console.log('Found primary', primary.id, 'created on', primary.createdAt);
  const secondary = await prisma.user.findFirstOrThrow({
    where: {
      farcasterUser: {
        account: {
          path: ['username'],
          equals: 'brichis'
        }
      }
    }
  });
  console.log('Found secondary', secondary.id, 'created on', secondary.createdAt);
  await mergeProfiles({
    primaryProfileId: primary.id,
    secondaryProfileId: secondary.id
  });
  console.log('Profiles have been merged and secondary marked deleted');
}

merge();
