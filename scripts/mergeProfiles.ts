import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { mergeProfiles } from 'lib/users/mergeProfiles';
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
  // const primary = await prisma.user.findFirstOrThrow({
  //   where: {
  //     wallets: {
  //       some: {
  //         ensname: 'brichis.eth'
  //       }
  //     }
  //   }
  // });
  // console.log('Found primary', primary.id, 'created on', primary.createdAt);
  // const secondary = await prisma.user.findFirstOrThrow({
  //   where: {
  //     farcasterUser: {
  //       account: {
  //         path: ['username'],
  //         equals: 'brichis'
  //       }
  //     }
  //   }
  // });
  // console.log('Found secondary', secondary.id, 'created on', secondary.createdAt);

  await mergeProfiles({
    primaryProfileId: '8e7a423f-a5f6-4782-82e5-9106195792b4',
    secondaryProfileId: '9508f3e2-7cde-4bdf-85a6-5c849c0aa418'
  });

  await merge
  
  console.log('Profiles have been merged and secondary marked deleted');
}

merge();


