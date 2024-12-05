import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { DateTime } from 'luxon';

async function query() {
  const result = await prisma.scout.findFirstOrThrow({
    where: {
      path: 'mattcasey'
    }
  });

  prettyPrint(result);
}

query();
