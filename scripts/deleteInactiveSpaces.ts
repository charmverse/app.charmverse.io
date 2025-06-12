import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { task as chargeSpacesSubscriptionTask } from '../apps/cron/src/tasks/chargeSpacesSubscription/task';
import { task as exportSpaceDataTask } from '../apps/cron/src/tasks/exportSpaceData';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { parseUnits } from 'viem';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import fs from 'fs';
const goldTierPrice = 10_000;
const silverTierPrice = 2_500;

const cutoff = new Date('2023-12-11T00:00:00.000Z');

const newTier = 'gold' as const;
const discount = 0.9;
const tierPrice = newTier === 'gold' ? goldTierPrice : silverTierPrice;
const spaceIds = JSON.parse(fs.readFileSync('spaceIds.json', 'utf8'));

async function getActiveSpaces() {
  const spaces = await prisma.userSpaceAction.groupBy({
    by: ['spaceId'],
    where: {
      createdAt: {
        gt: cutoff
      }
    },
    _count: {
      spaceId: true
    }
  });
  const spaceIds = spaces.map((space) => space.spaceId).filter(Boolean);
  fs.writeFileSync('spaceIds.json', JSON.stringify(spaceIds, null, 2));
  console.log('active spaces', spaces.length);
}
console.log('cutoff', cutoff);
async function query() {
  const spaces = await prisma.space.findMany({
    where: {
      createdAt: {
        // dont include spaces created after the active list was generated
        lt: new Date('2025-06-11T00:00:00.000Z')
      },
      id: {
        notIn: spaceIds
      }
    },
    select: {
      id: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  console.log('inactive spaces', spaces.length);

  const BATCH_SIZE = 5;
  // for (const space of spaces) {
  //   console.time(`deleted space ${space.id}`);
  //   // console.log(`SELECT * FROM "Space" WHERE id = ${space.id}::uuid;`);
  //   // const result = await prisma.$queryRaw`EXPLAIN DELETE FROM "Space" WHERE id = ${space.id}::uuid;`;
  //   // console.log(result);
  //   await prisma.space.deleteMany({
  //     where: {
  //       id: {
  //         in: [space.id]
  //       }
  //     }
  //   });
  //   console.timeEnd(`deleted space ${space.id}`);
  // }
  for (let i = 0; i < spaces.length; i += BATCH_SIZE) {
    const batch = spaces.slice(i, i + BATCH_SIZE);
    const message = `Deleted spaces ${i + 1} to ${Math.min(i + BATCH_SIZE, spaces.length)}`;
    console.time(message);
    await prisma.space.deleteMany({
      where: {
        id: {
          in: batch.map((space) => space.id)
        }
      }
    });
    console.timeEnd(message);
  }
  // console.log(
  //   'deleted',
  //   await prisma.space.deleteMany({
  //     where: {
  //       createdAt: {
  //         lt: DateTime.now().minus({ months: 18 }).toJSDate()
  //       },
  //       id: {
  //         in: spaces.map((space) => space.id)
  //       }
  //     }
  //   })
  // );
}
//getActiveSpaces();
query();
