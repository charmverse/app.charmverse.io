import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';

async function query() {
  const result = await prisma.page.findFirst({
    where: {
      id: '14d51162-e66b-4900-a0c0-57e0404edad1'
    }
  });

  console.log(result);
}

query();
