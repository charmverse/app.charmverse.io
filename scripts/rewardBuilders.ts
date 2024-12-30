import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function query() {
  const w = await prisma.gemsReceipt.findMany({
    where: {
      event: {
        week: '2024-W40'
      }
    },
    include: {
      event: {
        select: {
          builderId: true
        }
      }
    }
  });
  const builderIds = [...new Set(w.map((w) => w.event.builderId))];
  console.log(w.length);
  // const builders = await prisma.scout.findMany({});
  // const builderIds = builders.map((b) => b.id);
  for (const builderId of builderIds) {
    await prisma.builderEvent.create({
      data: {
        builderId,
        type: 'misc_event',
        week: '2024-W41',
        season: '2024-W41',
        description: 'Received points for participating in pre-season week as a Builder',
        pointsReceipts: {
          create: {
            claimedAt: new Date(),
            value: 100,
            recipientId: builderId,
            season: currentSeason,
            activities: {
              create: {
                type: 'points',
                userId: builderId,
                recipientType: 'builder'
              }
            }
          }
        }
      }
    });
    await prisma.scout.update({
      where: {
        id: builderId
      },
      data: {
        currentBalance: {
          increment: 100
        }
      }
    });
  }
}

query();
