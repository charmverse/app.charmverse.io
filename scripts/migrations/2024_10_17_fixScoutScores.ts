import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';
import { getPointStatsFromHistory } from '@packages/scoutgame/points/getPointStatsFromHistory';
import { refreshPointStatsFromHistory } from '@packages/scoutgame/points/refreshPointStatsFromHistory';
import { log } from '@charmverse/core/log';
import { getNotifications } from '@packages/scoutgame/notifications/getNotifications';
import { sendPoints } from '@packages/scoutgame/points/sendPoints';
const tierByPoints = {
  60: 'Legendary',
  30: 'Mythic',
  20: 'Epic',
  15: 'Rare',
  10: 'Common'
} as any;

const currentSeasonStartDate = DateTime.fromObject({ year: 2024, month: 9, day: 30 }, { zone: 'utc' }); // Actual launch: 2024-W40
const currentSeason = currentSeasonStartDate.toFormat(`kkkk-'W'WW`);

async function query() {
  // const scout = await prisma.scout.findFirstOrThrow({
  //   where: { username: 'macedo' },
  //   include: { pointsReceived: true, pointsSent: true }
  // });
  // const received = scout.pointsReceived.reduce((acc, e) => acc + e.value, 0);
  // const sent = scout.pointsSent.reduce((acc, e) => acc + e.value, 0);
  // console.log(scout.currentBalance, received, sent, received - sent);
  const friends = await prisma.builderEvent.findMany({
    where: {
      description: 'Friends of Scout Game'
    }
  });
  const friendIds = friends.map((e) => e.builderId);

  const invalidEvents = await prisma.builderEvent.findMany({
    where: {
      createdAt: {
        gt: '2024-10-07T21:00:00.000Z',
        lt: '2024-10-07T23:00:00.000Z'
      },
      description: {
        contains: 'week as a Builder'
      },
      type: 'misc_event',
      pointsReceipts: {
        some: {
          recipientId: null,
          senderId: null
        }
      }
    },
    include: {
      builder: {
        select: {
          id: true,
          farcasterId: true,
          username: true,
          currentBalance: true,
          nftPurchaseEvents: true
        }
      },
      pointsReceipts: {
        include: {
          activities: true
        }
      }
    }
  });

  prettyPrint(invalidEvents.length);
  // return;
  let fixable: string[] = [];
  let fixableButCHeck: string[] = [];
  let needsFix: string[] = [];
  let unchanged: string[] = [];
  let _friends: string[] = [];
  for (const event of invalidEvents) {
    const tier = tierByPoints[event.pointsReceipts[0].value];
    if (!tier) {
      throw new Error('couldnot determine tier for points : ' + event.pointsReceipts[0].value);
    }
    // if (event.builder.currentBalance === 0) {
    //   console.log(event.builder.username, event.pointsReceipts[0].value, event.builder.nftPurchaseEvents.length);
    // }
    // await refreshPointStatsFromHistory({ userIdOrUsername: event.builder.id });
    const stats = await getPointStatsFromHistory({ userIdOrUsername: event.builder.id });
    const currentbalance = event.builder.currentBalance;
    const newBalance = stats.balance + event.pointsReceipts[0].value;
    if (newBalance === currentbalance) {
      unchanged.push(event.builder.username);
    }
    if (friendIds.includes(event.builder.id)) {
      _friends.push(event.builder.username);
    }
    if (currentbalance === newBalance) {
      // good to go
      // console.log('Good to go:', event);
      await fixEvents({
        createdAt: event.createdAt,
        week: event.week,
        points: event.pointsReceipts[0].value,
        userId: event.builder.id,
        builderEventId: event.id
      });
      fixable.push(event.builder.username);
    } else if (newBalance < 0) {
      // good to go
      // console.log('Good to go:', event);
      console.log('Negative balance:', {
        username: event.builder.username,
        allpointsReceived: stats.unclaimedPoints + stats.claimedPoints,
        // unclaimedPoints: stats.unclaimedPoints,
        ...stats,
        currentbalance,
        new: newBalance
      });
      await fixEvents({
        createdAt: event.createdAt,
        week: event.week,
        points: event.pointsReceipts[0].value,
        userId: event.builder.id,
        builderEventId: event.id
      });
      // break;
      needsFix.push(event.builder.username);
    } else {
      console.log('Good to go:', event);
      console.log('Will fix but check update:', {
        username: event.builder.username,
        allpointsReceived: stats.unclaimedPoints + stats.claimedPoints,
        // unclaimedPoints: stats.unclaimedPoints,
        ...stats,
        currentbalance,
        new: newBalance
      });
      // prettyPrint(
      //   await prisma.pointsReceipt.findMany({
      //     where: {
      //       OR: [
      //         {
      //           recipientId: event.builder.id
      //         },
      //         {
      //           senderId: event.builder.id
      //         }
      //       ]
      //     },
      //     include: {
      //       event: {
      //         include: {
      //           nftPurchaseEvent: true
      //         }
      //       }
      //     }
      //   })
      // );

      await fixEvents({
        createdAt: event.createdAt,
        week: event.week,
        points: event.pointsReceipts[0].value,
        userId: event.builder.id,
        builderEventId: event.id
      });
      fixableButCHeck.push(event.builder.username);
    }
  }
  console.log({
    fixable: fixable.length,
    friends: _friends.length,
    needsFix: needsFix.length,
    unchanged: unchanged.length,
    fixableButCHeck: fixableButCHeck.length
  });
  // prettyPrint(
  //   await prisma.scout.findUnique({ where: { username: 'watchcoin' }, include: { nftPurchaseEvents: true } })
  // );
  // console.log(await prisma.pointsReceipt.count({ where: { recipientId: null, senderId: null } }));

  // const stats = await getPointStatsFromHistory({ userIdOrUsername: 'd779a84c-4007-426d-a9d0-1a595c53ffd0' });
  // console.log(stats);
}

async function fixEvents({
  createdAt,
  week,
  points,
  userId,
  builderEventId
}: {
  createdAt: Date;
  week: string;
  points: number;
  userId: string;
  builderEventId: string;
}) {
  // const notifications1 = await getNotifications({ userId });
  // log.info('Notifications', notifications1);
  const r = await prisma.$transaction([
    prisma.builderEvent.delete({
      where: {
        id: builderEventId
      }
    }),
    prisma.pointsReceipt.create({
      data: {
        value: points,
        claimedAt: new Date(),
        recipient: {
          connect: {
            id: userId
          }
        },
        event: {
          create: {
            createdAt,
            season: currentSeason,
            type: 'misc_event' as const,
            description: `Received points for achieving ${tierByPoints[points]} status on waitlist`,
            week,
            builderId: userId
          }
        },
        activities: {
          create: {
            type: 'points',
            userId,
            recipientType: 'scout'
          }
        }
      }
    })
  ]);
  const stats = await getPointStatsFromHistory({ userIdOrUsername: userId });
  const scout = await prisma.scout.update({
    where: {
      id: userId
    },
    data: {
      currentBalance: stats.balance
    }
  });
  console.log('Updated balance for', scout.username, 'to', scout.currentBalance, 'Receipt:', r[1].id);
  const notifications = await getNotifications({ userId });
  // log.info('Notifications', notifications);
}

query();

// fix points for users with negative balance
// (async () => {
//   const username = '';
//   const builder = await prisma.scout.findUniqueOrThrow({
//     where: { username: username },
//     include: { events: { include: { pointsReceipts: true } } }
//   });
//   console.log('Current balance:', builder.currentBalance);
//   const points = builder.currentBalance * -1;

//   await prisma.$transaction([
//     prisma.builderEvent.create({
//       data: {
//         builderId: builder.id,
//         type: 'misc_event',
//         week: '2024-W42',
//         season: '2024-W41',
//         description: `Points correction`,
//         pointsReceipts: {
//           create: {
//             claimedAt: new Date(),
//             value: points,
//             recipientId: builder.id
//           }
//         }
//       }
//     }),
//     prisma.scout.update({
//       where: {
//         id: builder.id
//       },
//       data: {
//         currentBalance: 0
//       }
//     })
//   ]);
//   const stats = await getPointStatsFromHistory({ userIdOrUsername: username });
//   console.log(stats);
// })();
