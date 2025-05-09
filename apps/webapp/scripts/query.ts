import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';

async function query() {
  const result = await prisma.externalProject.count({
    // take: 50
    // include: {
    //   events: {
    //     include: {
    //       builderEvent: true
    //     }
    //   }
    // }
  });

  console.log(result);
}

query();
