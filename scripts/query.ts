import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';

/**
 * Use this script to perform database searches.
 */

async function query() {
  console.log(
    await prisma.page.findFirst({
      where: {
        id: '9ed3702c-4368-4ed8-9274-3744d9e34c8d'
      }
    })
  );
}

query();
